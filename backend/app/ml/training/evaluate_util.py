"""Shared evaluation and model-saving utilities for all training scripts."""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
from sklearn.metrics import (
    classification_report,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

logger = logging.getLogger(__name__)


def print_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: np.ndarray | None = None,
    label: str = "Model",
) -> dict[str, float]:
    """Print and return classification metrics."""
    metrics: dict[str, float] = {
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1": f1_score(y_true, y_pred, zero_division=0),
    }

    if y_prob is not None and len(np.unique(y_true)) > 1:
        metrics["auc_roc"] = roc_auc_score(y_true, y_prob)

    print(f"\n{'=' * 50}")
    print(f"  {label} — Evaluation Results")
    print(f"{'=' * 50}")
    for k, v in metrics.items():
        print(f"  {k:>12s}: {v:.4f}")
    print()
    print(classification_report(y_true, y_pred, target_names=["Negative", "Positive"], zero_division=0))

    return metrics


def save_model(model, path: Path, label: str = "Model") -> None:
    """Save a scikit-learn compatible model to disk via joblib."""
    import joblib

    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, path)
    size_mb = path.stat().st_size / (1024 * 1024)
    print(f"  Saved {label} to {path} ({size_mb:.1f} MB)")
    logger.info("Saved %s to %s", label, path)
