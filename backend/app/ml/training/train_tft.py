"""Train Temporal Fusion Transformer models for hazard forecasting.

Runnable as:
    python -m app.ml.training.train_tft --hazard flood
    python -m app.ml.training.train_tft --hazard all
    python -m app.ml.training.train_tft --hazard all --optimized
"""

from __future__ import annotations

import argparse
import logging
import shutil
import sys
import time
from pathlib import Path

import torch
import lightning.pytorch as pl
from lightning.pytorch.callbacks import EarlyStopping, ModelCheckpoint, LearningRateMonitor
from pytorch_forecasting import TemporalFusionTransformer, TimeSeriesDataSet
from pytorch_forecasting.metrics import QuantileLoss

from app.ml.training.config import (
    RANDOM_SEED,
    SAVED_MODELS_DIR,
    TFT_ATTENTION_HEAD_SIZE,
    TFT_BATCH_SIZE,
    TFT_DROPOUT,
    TFT_ENCODER_LENGTH_PER_HAZARD,
    TFT_EPOCHS,
    TFT_GRADIENT_CLIP,
    TFT_HIDDEN_CONTINUOUS_SIZE,
    TFT_HIDDEN_SIZE,
    TFT_LR,
    TFT_LR_PER_HAZARD,
    TFT_MAX_ENCODER_LENGTH,
    TFT_MAX_PREDICTION_LENGTH,
    TFT_PATIENCE,
    TFT_QUANTILES,
)
from app.ml.training.prepare_tft_dataset import (
    HAZARD_FEATURES,
    TARGET_COLS,
    load_combined_tft_dataframe,
)

# PyTorch 2.6+ defaults to weights_only=True; allowlist pytorch_forecasting
# classes that are serialised inside Lightning checkpoints.
try:
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

# Use Tensor Cores for faster matmul on RTX 4070 and similar GPUs
torch.set_float32_matmul_precision("medium")

# Windows: safe multiprocessing defaults
_IS_WINDOWS = sys.platform == "win32"
_NUM_WORKERS = 0 if _IS_WINDOWS else 4
_PERSISTENT_WORKERS = False if _IS_WINDOWS else True

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(SAVED_MODELS_DIR.parent.parent.parent / "tft_training.log"),
    ],
)
logger = logging.getLogger(__name__)

ALL_HAZARDS = list(HAZARD_FEATURES.keys())


def _build_train_val_datasets(
    hazard: str, combined, val_fraction: float = 0.2
) -> tuple[TimeSeriesDataSet, TimeSeriesDataSet]:
    """Build proper temporal train/val split using TimeSeriesDataSet."""
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

    logger.info("  Encoder length for %s: %d days", hazard, encoder_length)

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


def train_single_hazard(
    hazard: str,
    combined=None,
    resume: bool = False,
    optimized: bool = False,
) -> str | None:
    """Train a TFT for one hazard. Returns path to best checkpoint or None on failure."""
    start_time = time.time()
    mode = "OPTIMIZED" if optimized else "STANDARD"
    logger.info("=" * 60)
    logger.info("Training TFT [%s] for hazard: %s", mode, hazard)
    logger.info("=" * 60)

    if hazard not in HAZARD_FEATURES:
        logger.error("Unknown hazard '%s'. Valid: %s", hazard, ALL_HAZARDS)
        return None

    # ------------------------------------------------------------------
    # 1. Build train/val datasets with proper temporal split
    # ------------------------------------------------------------------
    try:
        if combined is None:
            combined = load_combined_tft_dataframe()
        train_ds, val_ds = _build_train_val_datasets(hazard, combined)
    except Exception:
        logger.exception("Failed to build dataset for %s", hazard)
        return None

    logger.info(
        "Dataset: %d train / %d val samples",
        len(train_ds),
        len(val_ds),
    )

    # ------------------------------------------------------------------
    # 2. Dataloaders (num_workers=0 on Windows to avoid spawn issues)
    # ------------------------------------------------------------------
    batch_size = TFT_BATCH_SIZE if not optimized else min(TFT_BATCH_SIZE, 128)

    train_dataloader = train_ds.to_dataloader(
        train=True,
        batch_size=batch_size,
        num_workers=_NUM_WORKERS,
        persistent_workers=_PERSISTENT_WORKERS,
    )
    val_dataloader = val_ds.to_dataloader(
        train=False,
        batch_size=batch_size,
        num_workers=_NUM_WORKERS,
        persistent_workers=_PERSISTENT_WORKERS,
    )

    # ------------------------------------------------------------------
    # 3. Create model
    # ------------------------------------------------------------------
    pl.seed_everything(RANDOM_SEED)

    hidden_size = TFT_HIDDEN_SIZE if not optimized else 128
    attention_heads = TFT_ATTENTION_HEAD_SIZE if not optimized else 8
    hidden_continuous = TFT_HIDDEN_CONTINUOUS_SIZE if not optimized else 64
    dropout = TFT_DROPOUT if not optimized else 0.15
    lr = TFT_LR_PER_HAZARD.get(hazard, TFT_LR) if not optimized else 1e-3
    epochs = TFT_EPOCHS if not optimized else 100
    patience = TFT_PATIENCE if not optimized else 10

    # More quantiles for low-variance targets to improve supervision signal
    if hazard in ("windstorm", "flood"):
        quantiles = [0.1, 0.3, 0.5, 0.7, 0.9]
    else:
        quantiles = TFT_QUANTILES

    model = TemporalFusionTransformer.from_dataset(
        train_ds,
        learning_rate=lr,
        hidden_size=hidden_size,
        attention_head_size=attention_heads,
        dropout=dropout,
        hidden_continuous_size=hidden_continuous,
        loss=QuantileLoss(quantiles=quantiles),
        reduce_on_plateau_patience=patience // 2,
    )

    n_params = sum(p.numel() for p in model.parameters())
    logger.info("Model: %d parameters (hidden=%d, heads=%d, lr=%.1e)", n_params, hidden_size, attention_heads, lr)

    # ------------------------------------------------------------------
    # 4. Optimal learning rate (optimized mode only)
    # ------------------------------------------------------------------
    if optimized:
        logger.info("Running learning rate finder...")
        try:
            trainer_lr = pl.Trainer(
                accelerator="auto",
                devices=1,
                precision="bf16-mixed",
                gradient_clip_val=TFT_GRADIENT_CLIP,
                logger=False,
                enable_checkpointing=False,
            )
            lr_result = trainer_lr.tuner.lr_find(  # type: ignore[attr-defined]
                model,
                train_dataloaders=train_dataloader,
                val_dataloaders=val_dataloader,
                min_lr=1e-6,
                max_lr=1e-1,
                num_training=100,
            )
            suggested_lr = lr_result.suggestion()
            if suggested_lr and 1e-6 < suggested_lr < 1e-1:
                logger.info("LR finder suggested: %.2e (using it)", suggested_lr)
                model.hparams.learning_rate = suggested_lr
            else:
                logger.info("LR finder result (%.2e) out of range, keeping %.2e", suggested_lr or 0, lr)
        except Exception:
            logger.warning("LR finder failed, using default lr=%.2e", lr, exc_info=True)

    # ------------------------------------------------------------------
    # 5. Callbacks
    # ------------------------------------------------------------------
    SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
    suffix = "_tft_optimized" if optimized else "_tft"
    ckpt_path = str(SAVED_MODELS_DIR / f"{hazard}{suffix}.ckpt")

    early_stop = EarlyStopping(
        monitor="val_loss",
        patience=patience,
        mode="min",
        verbose=True,
    )
    checkpoint = ModelCheckpoint(
        dirpath=str(SAVED_MODELS_DIR),
        filename=f"{hazard}{suffix}",
        monitor="val_loss",
        mode="min",
        save_top_k=1,
        verbose=True,
        enable_version_counter=False,
    )
    lr_monitor = LearningRateMonitor(logging_interval="epoch")

    # ------------------------------------------------------------------
    # 6. Train
    # ------------------------------------------------------------------
    trainer = pl.Trainer(
        max_epochs=epochs,
        gradient_clip_val=TFT_GRADIENT_CLIP,
        callbacks=[early_stop, checkpoint, lr_monitor],
        enable_progress_bar=True,
        accelerator="auto",
        precision="bf16-mixed",
        devices=1,
        log_every_n_steps=50,
        logger=False,
        enable_checkpointing=False,
    )

    resume_path = ckpt_path if resume and Path(ckpt_path).exists() else None
    if resume_path:
        logger.info("Resuming from checkpoint: %s", resume_path)

    try:
        trainer.fit(
            model,
            train_dataloaders=train_dataloader,
            val_dataloaders=val_dataloader,
            ckpt_path=resume_path,
        )
    except Exception:
        logger.exception("Training failed for %s", hazard)
        return None

    best_path = checkpoint.best_model_path
    best_score = checkpoint.best_model_score
    logger.info(
        "Best checkpoint for %s: %s (val_loss=%.4f)",
        hazard, best_path, best_score or 0.0,
    )

    # Copy best checkpoint to canonical location
    if best_path and str(Path(best_path).resolve()) != str(Path(ckpt_path).resolve()):
        try:
            shutil.copy2(best_path, ckpt_path)
            logger.info("Saved final model to %s", ckpt_path)
        except PermissionError:
            logger.warning("Could not copy checkpoint (file locked); using in-place checkpoint")

    # Also save as the standard _tft.ckpt if optimized is better
    if optimized:
        std_ckpt = str(SAVED_MODELS_DIR / f"{hazard}_tft.ckpt")
        try:
            shutil.copy2(ckpt_path, std_ckpt)
            logger.info("Copied optimized model to standard path: %s", std_ckpt)
        except Exception:
            logger.warning("Could not copy to standard path", exc_info=True)

    elapsed = time.time() - start_time
    logger.info("Finished %s [%s] in %.1f min (val_loss=%.4f)", hazard, mode, elapsed / 60, best_score or 0.0)
    return ckpt_path


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(description="Train TFT hazard forecasting models")
    parser.add_argument(
        "--hazard",
        type=str,
        required=True,
        choices=ALL_HAZARDS + ["all"],
        help="Hazard to train (flood|wildfire|heatwave|drought|coldwave|windstorm|all)",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Resume training from existing checkpoint",
    )
    parser.add_argument(
        "--optimized",
        action="store_true",
        help="Train with larger model, LR finder, and more epochs",
    )
    args = parser.parse_args()

    hazards = ALL_HAZARDS if args.hazard == "all" else [args.hazard]

    logger.info("=" * 60)
    logger.info("TFT Training Pipeline")
    logger.info("  Hazards: %s", hazards)
    logger.info("  Mode: %s", "OPTIMIZED" if args.optimized else "STANDARD")
    logger.info("  Resume: %s", args.resume)
    logger.info("  GPU: %s", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU")
    logger.info("  Workers: %d (Windows=%s)", _NUM_WORKERS, _IS_WINDOWS)
    logger.info("=" * 60)

    # Load data once if training multiple hazards
    combined = None
    if len(hazards) > 1:
        logger.info("Loading combined dataset for all hazards...")
        try:
            combined = load_combined_tft_dataframe()
        except Exception:
            logger.exception("Failed to load combined dataset")
            return

    total_start = time.time()
    results: dict[str, str | None] = {}

    for i, h in enumerate(hazards):
        logger.info("[%d/%d] Starting %s...", i + 1, len(hazards), h)
        results[h] = train_single_hazard(h, combined, resume=args.resume, optimized=args.optimized)
        # Free GPU memory between hazards
        torch.cuda.empty_cache()

    total_elapsed = time.time() - total_start

    logger.info("=" * 60)
    logger.info("Training summary (%.1f min total):", total_elapsed / 60)
    for h, path in results.items():
        status = f"OK -> {path}" if path else "FAILED"
        logger.info("  %s: %s", h, status)

    failed = [h for h, p in results.items() if p is None]
    if failed:
        logger.error("FAILED hazards: %s", failed)
    else:
        logger.info("All %d hazards trained successfully!", len(results))
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
