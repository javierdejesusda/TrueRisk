"""Evaluate trained TFT models on the validation set.

Computes R², MAE, RMSE, MAPE, and 80% CI coverage for all 6 hazards.

Usage:
    cd backend
    python -m app.ml.training.evaluate_tft
"""

from __future__ import annotations

import logging
import sys

import numpy as np
import torch
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from app.ml.training.config import (
    SAVED_MODELS_DIR,
    TFT_ENCODER_LENGTH_PER_HAZARD,
    TFT_MAX_ENCODER_LENGTH,
    TFT_MAX_PREDICTION_LENGTH,
)
from app.ml.training.prepare_tft_dataset import (
    HAZARD_FEATURES,
    TARGET_COLS,
    load_combined_tft_dataframe,
)

try:
    from pytorch_forecasting import TemporalFusionTransformer, TimeSeriesDataSet
    from pytorch_forecasting.data.encoders import (
        EncoderNormalizer,
        GroupNormalizer,
        NaNLabelEncoder,
        TorchNormalizer,
    )
    torch.serialization.add_safe_globals(
        [EncoderNormalizer, GroupNormalizer, NaNLabelEncoder, TorchNormalizer]
    )
except Exception:
    pass

torch.set_float32_matmul_precision("medium")

_IS_WINDOWS = sys.platform == "win32"
_NUM_WORKERS = 0 if _IS_WINDOWS else 4

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

ALL_HAZARDS = list(HAZARD_FEATURES.keys())


def _build_val_dataset(hazard: str, combined, val_fraction: float = 0.2):
    """Build train and val TimeSeriesDataSets for model loading."""
    feat = HAZARD_FEATURES[hazard]
    target = TARGET_COLS[hazard]
    encoder_length = TFT_ENCODER_LENGTH_PER_HAZARD.get(hazard, TFT_MAX_ENCODER_LENGTH)

    all_features = list(dict.fromkeys(feat["static"] + feat["known"] + feat["unknown"]))
    keep_cols = ["time_idx", "province_code", "date", target] + all_features
    keep_cols = list(dict.fromkeys(keep_cols))
    df = combined[keep_cols].copy()
    df["province_code"] = df["province_code"].astype(str)

    max_time = df["time_idx"].max()
    val_start = int(max_time * (1 - val_fraction))
    training_cutoff = val_start - TFT_MAX_PREDICTION_LENGTH

    time_varying_known = [c for c in feat["known"] if c not in feat["static"]]
    time_varying_unknown = [c for c in feat["unknown"] if c not in feat["static"]]

    train_ds = TimeSeriesDataSet(
        df[df["time_idx"] <= training_cutoff],
        time_idx="time_idx",
        target=target,
        group_ids=["province_code"],
        max_encoder_length=encoder_length,
        max_prediction_length=TFT_MAX_PREDICTION_LENGTH,
        static_reals=feat["static"] if feat["static"] else [],
        time_varying_known_reals=time_varying_known if time_varying_known else [],
        time_varying_unknown_reals=time_varying_unknown + [target],
        allow_missing_timesteps=True,
    )

    val_ds = TimeSeriesDataSet.from_dataset(
        train_ds,
        df[(df["time_idx"] > training_cutoff) & (df["time_idx"] <= max_time - TFT_MAX_PREDICTION_LENGTH)],
        stop_randomization=True,
    )

    return train_ds, val_ds


def run_model_evaluation(hazard: str, combined) -> dict | None:
    """Load checkpoint, run predictions on val set, compute metrics."""
    ckpt_path = SAVED_MODELS_DIR / f"{hazard}_tft.ckpt"
    if not ckpt_path.exists():
        logger.warning("No checkpoint for %s at %s", hazard, ckpt_path)
        return None

    logger.info("Evaluating %s...", hazard)

    _, val_ds = _build_val_dataset(hazard, combined)
    val_dl = val_ds.to_dataloader(
        train=False, batch_size=256, num_workers=_NUM_WORKERS
    )

    model = TemporalFusionTransformer.load_from_checkpoint(str(ckpt_path))
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = model.to(device)
    model.train(False)

    all_actuals = []
    all_preds_q50 = []
    all_preds_q10 = []
    all_preds_q90 = []

    with torch.no_grad():
        for batch in val_dl:
            x, y = batch
            # Move input tensors to model device
            x = {k: v.to(device) if isinstance(v, torch.Tensor) else v for k, v in x.items()} if isinstance(x, dict) else x.to(device)
            raw = model(x)

            # Extract prediction tensor from model output
            if hasattr(raw, "prediction"):
                pred = raw.prediction
            elif isinstance(raw, dict):
                pred = raw["prediction"]
            else:
                pred = raw

            # pred shape: (batch, pred_len, num_quantiles)
            actuals = y[0] if isinstance(y, (list, tuple)) else y

            n_quantiles = pred.shape[-1]
            if n_quantiles == 5:
                # [0.1, 0.3, 0.5, 0.7, 0.9]
                q10_idx, q50_idx, q90_idx = 0, 2, 4
            else:
                # [0.1, 0.5, 0.9]
                q10_idx, q50_idx, q90_idx = 0, 1, 2

            # Use first prediction horizon (6h ahead)
            pred_q50 = pred[:, 0, q50_idx].cpu().numpy()
            pred_q10 = pred[:, 0, q10_idx].cpu().numpy()
            pred_q90 = pred[:, 0, q90_idx].cpu().numpy()
            actual = actuals[:, 0].cpu().numpy()

            all_actuals.append(actual)
            all_preds_q50.append(pred_q50)
            all_preds_q10.append(pred_q10)
            all_preds_q90.append(pred_q90)

    y_true = np.concatenate(all_actuals)
    y_pred = np.concatenate(all_preds_q50)
    y_q10 = np.concatenate(all_preds_q10)
    y_q90 = np.concatenate(all_preds_q90)

    # Metrics
    r2 = r2_score(y_true, y_pred)
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))

    # MAPE (avoid division by zero)
    mask = np.abs(y_true) > 0.5
    if mask.sum() > 0:
        mape = np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100
    else:
        mape = 0.0

    # 80% CI coverage (proportion of actuals within q10-q90)
    in_ci = ((y_true >= y_q10) & (y_true <= y_q90)).mean() * 100

    metrics = {
        "r2": round(r2, 4),
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "mape": round(mape, 1),
        "ci_coverage": round(in_ci, 1),
        "n_samples": len(y_true),
        "target_mean": round(float(y_true.mean()), 1),
        "target_std": round(float(y_true.std()), 1),
    }

    return metrics


def main():
    logger.info("Loading combined dataset...")
    combined = load_combined_tft_dataframe()

    print(f"\n{'='*80}")
    print("  TFT Model Accuracy (Validation Set - 20% temporal holdout)")
    print(f"{'='*80}\n")

    results = {}
    for hazard in ALL_HAZARDS:
        metrics = run_model_evaluation(hazard, combined)
        if metrics:
            results[hazard] = metrics
        torch.cuda.empty_cache()

    # Print table
    print(f"\n  {'Hazard':12s} {'R2':>8s} {'MAE':>7s} {'RMSE':>7s} {'MAPE':>7s} {'80% CI':>8s} {'Mean':>6s} {'Std':>6s} {'N':>7s}")
    print(f"  {'-'*12} {'-'*8} {'-'*7} {'-'*7} {'-'*7} {'-'*8} {'-'*6} {'-'*6} {'-'*7}")

    for hazard in ALL_HAZARDS:
        if hazard not in results:
            continue
        m = results[hazard]
        print(
            f"  {hazard:12s} {m['r2']:8.4f} {m['mae']:7.2f} {m['rmse']:7.2f}"
            f" {m['mape']:6.1f}% {m['ci_coverage']:7.1f}%"
            f" {m['target_mean']:6.1f} {m['target_std']:6.1f} {m['n_samples']:7d}"
        )

    print(f"\n{'='*80}\n")


if __name__ == "__main__":
    main()
