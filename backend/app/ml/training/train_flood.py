"""Train the flood XGBoost classifier.

Loads flood_train.csv, trains with stratified split and early stopping,
saves to saved_models/flood_xgboost.joblib.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

from app.ml.models.flood_risk import FEATURE_NAMES
from app.ml.training.config import (
    PROCESSED_DIR,
    RANDOM_SEED,
    SAVED_MODELS_DIR,
    TEST_SPLIT,
    XGB_EARLY_STOPPING,
    XGB_LEARNING_RATE,
    XGB_MAX_DEPTH,
    XGB_N_ESTIMATORS,
)
from app.ml.training.evaluate_util import print_metrics, save_model


def main() -> None:
    csv_path = PROCESSED_DIR / "flood_train.csv"
    print(f"Loading {csv_path}...")
    df = pd.read_csv(csv_path)

    assert list(df.columns[:-1]) == FEATURE_NAMES, (
        f"Feature mismatch!\nExpected: {FEATURE_NAMES}\nGot: {list(df.columns[:-1])}"
    )

    X = df[FEATURE_NAMES].values.astype(np.float32)
    y = df["label"].values.astype(int)

    # Replace NaN/inf
    X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)

    pos_count = y.sum()
    neg_count = len(y) - pos_count
    scale_pos_weight = neg_count / max(pos_count, 1)
    print(f"  Samples: {len(y):,} (pos={pos_count:,}, neg={neg_count:,}, ratio={scale_pos_weight:.1f})")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SPLIT, random_state=RANDOM_SEED, stratify=y,
    )

    model = XGBClassifier(
        n_estimators=XGB_N_ESTIMATORS,
        max_depth=XGB_MAX_DEPTH,
        learning_rate=XGB_LEARNING_RATE,
        scale_pos_weight=scale_pos_weight,
        random_state=RANDOM_SEED,
        eval_metric="logloss",
        early_stopping_rounds=XGB_EARLY_STOPPING,
        verbosity=1,
    )

    print("Training flood XGBoost...")
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=20,
    )

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    print_metrics(y_test, y_pred, y_prob, label="Flood XGBoost")

    out_path = SAVED_MODELS_DIR / "flood_xgboost.joblib"
    save_model(model, out_path, label="Flood XGBoost")
    print("Done.")


if __name__ == "__main__":
    main()
