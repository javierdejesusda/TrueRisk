"""Shared TFT inference wrapper for all hazard models."""
from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd
import torch

logger = logging.getLogger(__name__)

SAVED_MODELS = Path(__file__).parent.parent / "saved_models"

# Horizons in hours (must match training config)
FORECAST_HORIZONS = [6, 12, 24, 48, 72, 168]


class HazardTFT:
    """Loads a trained TFT checkpoint and runs multi-horizon inference."""

    def __init__(self, hazard: str):
        self.hazard = hazard
        self.model_path = SAVED_MODELS / f"{hazard}_tft.ckpt"
        self._model = None

    @property
    def is_available(self) -> bool:
        return self.model_path.exists()

    def _load(self):
        if self._model is None and self.is_available:
            from pytorch_forecasting import TemporalFusionTransformer

            self._model = TemporalFusionTransformer.load_from_checkpoint(
                str(self.model_path)
            )
            # Switch to evaluation mode (disables dropout, etc.)
            self._model.train(False)

    def predict(
        self,
        encoder_data: dict[str, list[float]],
        static_features: dict[str, float],
    ) -> dict | None:
        """Run TFT inference. Returns None if model unavailable.

        Returns: {
            "point_estimate": float,       # q50 at first horizon
            "horizons": {
                6:   {"q10": float, "q50": float, "q90": float},
                12:  {"q10": float, "q50": float, "q90": float},
                ...
            },
            "attention_weights": {"feature_name": float, ...}
        }
        """
        if not self.is_available:
            return None

        self._load()
        if self._model is None:
            return None

        try:
            # Build encoder DataFrame
            seq_len = len(next(iter(encoder_data.values())))
            pred_len = len(FORECAST_HORIZONS)

            records = []
            for t in range(seq_len + pred_len):
                row: dict = {"time_idx": t, "group": "0"}
                for feat, vals in encoder_data.items():
                    row[feat] = vals[t] if t < seq_len else vals[-1]
                for feat, val in static_features.items():
                    row[feat] = val
                records.append(row)

            df = pd.DataFrame(records)

            # Predict using the model's own dataset creation
            from pytorch_forecasting import TimeSeriesDataSet

            dataset = TimeSeriesDataSet.from_parameters(
                self._model.dataset_parameters, df, predict=True
            )
            dataloader = dataset.to_dataloader(batch_size=1, train=False)

            raw = self._model.predict(dataloader, return_x=True, mode="raw")
            prediction = raw.output
            # prediction shape: (1, pred_len, 3) for 3 quantiles

            if isinstance(prediction, dict):
                pred_tensor = prediction["prediction"]
            else:
                pred_tensor = prediction

            pred_np = pred_tensor.detach().cpu().numpy()[0]  # (pred_len, 3)

            horizons = {}
            for i, h in enumerate(FORECAST_HORIZONS):
                horizons[h] = {
                    "q10": round(float(pred_np[i, 0]), 2),
                    "q50": round(float(pred_np[i, 1]), 2),
                    "q90": round(float(pred_np[i, 2]), 2),
                }

            # Extract attention weights if available
            attention = {}
            try:
                interpretation = self._model.interpret_output(
                    raw.output, reduction="sum"
                )
                weights = interpretation.get("encoder_variables", {})
                if hasattr(weights, "items"):
                    attention = {k: round(float(v), 4) for k, v in weights.items()}
                elif isinstance(weights, torch.Tensor):
                    feature_names = list(encoder_data.keys()) + list(
                        static_features.keys()
                    )
                    for idx, w in enumerate(weights.flatten().tolist()):
                        if idx < len(feature_names):
                            attention[feature_names[idx]] = round(w, 4)
            except Exception:
                logger.debug(
                    "Could not extract attention weights for %s", self.hazard
                )

            return {
                "point_estimate": horizons[FORECAST_HORIZONS[0]]["q50"],
                "horizons": horizons,
                "attention_weights": attention,
            }
        except Exception:
            logger.exception("TFT inference failed for %s", self.hazard)
            return None
