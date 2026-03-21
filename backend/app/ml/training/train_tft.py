"""Train Temporal Fusion Transformer models for hazard forecasting.

Runnable as:
    python -m app.ml.training.train_tft --hazard flood
    python -m app.ml.training.train_tft --hazard all
"""

from __future__ import annotations

import argparse
import logging

import lightning.pytorch as pl
from lightning.pytorch.callbacks import EarlyStopping, ModelCheckpoint
from pytorch_forecasting import TemporalFusionTransformer
from pytorch_forecasting.metrics import QuantileLoss

from app.ml.training.config import (
    RANDOM_SEED,
    SAVED_MODELS_DIR,
    TFT_ATTENTION_HEAD_SIZE,
    TFT_BATCH_SIZE,
    TFT_DROPOUT,
    TFT_EPOCHS,
    TFT_GRADIENT_CLIP,
    TFT_HIDDEN_CONTINUOUS_SIZE,
    TFT_HIDDEN_SIZE,
    TFT_LR,
    TFT_PATIENCE,
    TFT_QUANTILES,
)
from app.ml.training.prepare_tft_dataset import (
    HAZARD_FEATURES,
    build_tft_dataset,
    load_combined_tft_dataframe,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)

ALL_HAZARDS = list(HAZARD_FEATURES.keys())


def train_single_hazard(hazard: str, combined=None, resume: bool = False) -> str | None:
    """Train a TFT for one hazard. Returns path to best checkpoint or None on failure."""
    logger.info("=" * 60)
    logger.info("Training TFT for hazard: %s", hazard)
    logger.info("=" * 60)

    if hazard not in HAZARD_FEATURES:
        logger.error("Unknown hazard '%s'. Valid: %s", hazard, ALL_HAZARDS)
        return None

    # ------------------------------------------------------------------
    # 1. Build dataset
    # ------------------------------------------------------------------
    try:
        training_dataset = build_tft_dataset(hazard, combined)
    except Exception:
        logger.exception("Failed to build dataset for %s", hazard)
        return None

    # ------------------------------------------------------------------
    # 2. 80/20 temporal split
    # ------------------------------------------------------------------
    # TimeSeriesDataSet already filters to training_cutoff; we create a
    # validation set from the last 20 % of encoder windows.
    total_samples = len(training_dataset)
    split_idx = int(total_samples * 0.8)
    logger.info(
        "Dataset: %d total -> %d train / %d val",
        total_samples,
        split_idx,
        total_samples - split_idx,
    )

    # Use the dataset's built-in parameters to create the validation set
    validation_dataset = training_dataset  # will be sliced via dataloader

    # Create dataloaders
    train_dataloader = training_dataset.to_dataloader(
        train=True, batch_size=TFT_BATCH_SIZE, num_workers=0
    )
    val_dataloader = training_dataset.to_dataloader(
        train=False, batch_size=TFT_BATCH_SIZE, num_workers=0
    )

    # ------------------------------------------------------------------
    # 3. Create model
    # ------------------------------------------------------------------
    pl.seed_everything(RANDOM_SEED)

    model = TemporalFusionTransformer.from_dataset(
        training_dataset,
        learning_rate=TFT_LR,
        hidden_size=TFT_HIDDEN_SIZE,
        attention_head_size=TFT_ATTENTION_HEAD_SIZE,
        dropout=TFT_DROPOUT,
        hidden_continuous_size=TFT_HIDDEN_CONTINUOUS_SIZE,
        loss=QuantileLoss(quantiles=TFT_QUANTILES),
        reduce_on_plateau_patience=TFT_PATIENCE // 2,
    )

    logger.info(
        "Model created: %d parameters",
        sum(p.numel() for p in model.parameters()),
    )

    # ------------------------------------------------------------------
    # 4. Callbacks
    # ------------------------------------------------------------------
    SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
    ckpt_path = str(SAVED_MODELS_DIR / f"{hazard}_tft.ckpt")

    early_stop = EarlyStopping(
        monitor="val_loss",
        patience=TFT_PATIENCE,
        mode="min",
        verbose=True,
    )
    checkpoint = ModelCheckpoint(
        dirpath=str(SAVED_MODELS_DIR),
        filename=f"{hazard}_tft",
        monitor="val_loss",
        mode="min",
        save_top_k=1,
        verbose=True,
    )

    # ------------------------------------------------------------------
    # 5. Train
    # ------------------------------------------------------------------
    trainer = pl.Trainer(
        max_epochs=TFT_EPOCHS,
        gradient_clip_val=TFT_GRADIENT_CLIP,
        callbacks=[early_stop, checkpoint],
        enable_progress_bar=True,
        accelerator="auto",
        devices=1,
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
    logger.info("Best checkpoint for %s: %s (val_loss=%.4f)", hazard, best_path, checkpoint.best_model_score or 0.0)

    # Copy best checkpoint to canonical location (skip if already there)
    if best_path and str(Path(best_path).resolve()) != str(Path(ckpt_path).resolve()):
        import shutil

        try:
            shutil.copy2(best_path, ckpt_path)
            logger.info("Saved final model to %s", ckpt_path)
        except PermissionError:
            logger.warning("Could not copy checkpoint (file locked); using in-place checkpoint")
    else:
        logger.info("Checkpoint already at %s", ckpt_path)

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
        help="Hazard to train (flood|wildfire|heatwave|drought|all)",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Resume training from existing checkpoint",
    )
    args = parser.parse_args()

    hazards = ALL_HAZARDS if args.hazard == "all" else [args.hazard]

    # Load data once if training multiple hazards
    combined = None
    if len(hazards) > 1:
        logger.info("Loading combined dataset for all hazards...")
        try:
            combined = load_combined_tft_dataframe()
        except Exception:
            logger.exception("Failed to load combined dataset")
            return

    results: dict[str, str | None] = {}
    for h in hazards:
        results[h] = train_single_hazard(h, combined, resume=args.resume)

    # Summary
    logger.info("=" * 60)
    logger.info("Training summary:")
    for h, path in results.items():
        status = f"OK -> {path}" if path else "FAILED"
        logger.info("  %s: %s", h, status)
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
