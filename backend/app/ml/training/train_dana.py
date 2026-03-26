"""Train XGBoost DANA classifier.

Usage:
    python -m app.ml.training.train_dana
"""
from __future__ import annotations

import logging
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
import xgboost as xgb

logger = logging.getLogger(__name__)

DATA_PATH = Path(__file__).parent.parent.parent.parent / "data" / "historical" / "dana_events.csv"
MODEL_PATH = Path(__file__).parent.parent / "saved_models" / "dana_xgboost.joblib"

FEATURE_NAMES = [
    "is_mediterranean", "is_coastal", "month", "latitude",
    "precip_24h", "precip_6h", "temperature", "pressure_change_6h",
    "wind_gusts", "humidity", "cape_current", "precip_forecast_6h",
]


def train():
    """Train DANA XGBoost classifier."""
    if not DATA_PATH.exists():
        print(f"Dataset not found at {DATA_PATH}. Run prepare_dana_dataset first.")
        return

    df = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df)} rows, {df['is_dana'].sum()} positive, {(~df['is_dana'].astype(bool)).sum()} negative")

    X = df[FEATURE_NAMES].fillna(0)
    y = df["is_dana"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        scale_pos_weight=5,
        eval_metric="aucpr",
        random_state=42,
    )
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False,
    )

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    print(f"AUC-ROC: {roc_auc_score(y_test, y_prob):.4f}")

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"\nModel saved to {MODEL_PATH}")


if __name__ == "__main__":
    train()
