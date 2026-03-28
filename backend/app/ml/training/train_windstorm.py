"""Train the windstorm LightGBM classifier.

Loads windstorm_train.csv, trains with stratified split,
saves to saved_models/windstorm_lgbm.joblib.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from lightgbm import LGBMClassifier
from sklearn.model_selection import train_test_split

from app.ml.models.windstorm_risk import FEATURE_NAMES
from app.ml.training.config import (
    LGBM_LEARNING_RATE,
    LGBM_MAX_DEPTH,
    LGBM_N_ESTIMATORS,
    PROCESSED_DIR,
    RANDOM_SEED,
    SAVED_MODELS_DIR,
    TEST_SPLIT,
)
from app.ml.training.evaluate_util import print_metrics, save_model


def main() -> None:
    csv_path = PROCESSED_DIR / "windstorm_train.csv"
    print(f"Loading {csv_path}...")
    df = pd.read_csv(csv_path)

    assert list(df.columns[:-1]) == FEATURE_NAMES, (
        f"Feature mismatch!\nExpected: {FEATURE_NAMES}\nGot: {list(df.columns[:-1])}"
    )

    X = df[FEATURE_NAMES].values.astype(np.float32)
    y = df["label"].values.astype(int)

    X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)

    pos_count = y.sum()
    neg_count = len(y) - pos_count
    print(f"  Samples: {len(y):,} (pos={pos_count:,}, neg={neg_count:,})")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SPLIT, random_state=RANDOM_SEED, stratify=y,
    )

    print("Training windstorm LightGBM...")
    lgbm = LGBMClassifier(
        n_estimators=LGBM_N_ESTIMATORS,
        max_depth=LGBM_MAX_DEPTH,
        learning_rate=LGBM_LEARNING_RATE,
        random_state=RANDOM_SEED,
        is_unbalance=True,
        verbose=-1,
    )
    lgbm.fit(X_train, y_train)

    y_pred = lgbm.predict(X_test)
    y_prob = lgbm.predict_proba(X_test)[:, 1]

    print_metrics(y_test, y_pred, y_prob, label="Windstorm LightGBM")

    out_path = SAVED_MODELS_DIR / "windstorm_lgbm.joblib"
    save_model(lgbm, out_path, label="Windstorm LightGBM")
    print("Done.")


if __name__ == "__main__":
    main()
