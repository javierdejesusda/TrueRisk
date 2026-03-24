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
            try:
                import torch
                from pytorch_forecasting import TemporalFusionTransformer

                device = "cuda" if torch.cuda.is_available() else "cpu"
                self._model = TemporalFusionTransformer.load_from_checkpoint(
                    str(self.model_path), map_location=device
                )
                self._model.train(False)
            except Exception:
                logger.warning("Failed to load TFT checkpoint for %s", self.hazard)
                self._model = None

    def predict(
        self,
        encoder_data: dict[str, list[float]],
        static_features: dict[str, float],
    ) -> dict | None:
        """Run TFT inference. Returns None if model unavailable.

        Parameters
        ----------
        encoder_data : dict[str, list[float]]
            Time-varying features (both known and unknown).
            Each key maps to a list of values (one per timestep).
        static_features : dict[str, float]
            Static features (constant across time).

        Returns
        -------
        dict with point_estimate, horizons, and attention_weights.
        """
        if not self.is_available:
            return None
        if not encoder_data or not any(encoder_data.values()):
            return None

        self._load()
        if self._model is None:
            return None

        try:
            seq_len = len(next(iter(encoder_data.values())))
            pred_len = len(FORECAST_HORIZONS)
            params = self._model.dataset_parameters
            target_name = params.get("target", f"{self.hazard}_score")

            # Collect all feature names the model expects
            all_known = params.get("time_varying_known_reals", [])
            all_unknown = params.get("time_varying_unknown_reals", [])
            all_static = params.get("static_reals", [])

            records = []
            for t in range(seq_len + pred_len):
                row: dict = {
                    "time_idx": t,
                    "province_code": "0",
                    target_name: 0.0,
                }
                # Fill from encoder_data (time-varying known + unknown)
                for feat, vals in encoder_data.items():
                    row[feat] = vals[t] if t < seq_len else vals[-1]
                # Fill static features
                for feat, val in static_features.items():
                    row[feat] = val
                # Default any missing required columns to 0.0
                for feat in all_known + all_unknown + all_static:
                    if feat not in row:
                        row[feat] = 0.0
                records.append(row)

            df = pd.DataFrame(records)

            from pytorch_forecasting import TimeSeriesDataSet

            dataset = TimeSeriesDataSet.from_parameters(
                params, df, predict=True
            )
            dataloader = dataset.to_dataloader(batch_size=1, train=False)

            raw = self._model.predict(dataloader, return_x=True, mode="raw")

            if hasattr(raw, "output"):
                prediction = raw.output
            else:
                prediction = raw

            if hasattr(prediction, "prediction"):
                pred_tensor = prediction.prediction
            elif isinstance(prediction, dict):
                pred_tensor = prediction["prediction"]
            else:
                pred_tensor = prediction

            pred_np = pred_tensor.detach().cpu().numpy()[0]  # (pred_len, n_quantiles)

            # Determine quantile indices based on number of quantiles
            n_q = pred_np.shape[-1]
            if n_q == 5:
                q10_idx, q50_idx, q90_idx = 0, 2, 4
            else:
                q10_idx, q50_idx, q90_idx = 0, 1, 2

            horizons = {}
            for i, h in enumerate(FORECAST_HORIZONS):
                horizons[h] = {
                    "q10": round(float(pred_np[i, q10_idx]), 2),
                    "q50": round(float(pred_np[i, q50_idx]), 2),
                    "q90": round(float(pred_np[i, q90_idx]), 2),
                }

            # Extract attention weights if available
            attention = {}
            try:
                interpretation = self._model.interpret_output(
                    raw.output if hasattr(raw, "output") else raw,
                    reduction="sum",
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
