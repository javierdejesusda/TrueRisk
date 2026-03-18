"""Train the wildfire RF + LightGBM ensemble with Platt calibration.

Loads wildfire_train.csv, trains both models, averages probabilities,
fits a CalibratedClassifierCV (Platt scaling), and saves all 3 artefacts.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from lightgbm import LGBMClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

from app.ml.models.wildfire_risk import FEATURE_NAMES
from app.ml.training.config import (
    LGBM_LEARNING_RATE,
    LGBM_MAX_DEPTH,
    LGBM_N_ESTIMATORS,
    PROCESSED_DIR,
    RANDOM_SEED,
    RF_MAX_DEPTH,
    RF_N_ESTIMATORS,
    SAVED_MODELS_DIR,
    TEST_SPLIT,
)
from app.ml.training.evaluate_util import print_metrics, save_model


class _EnsembleProbaWrapper:
    """Wraps averaged RF+LGBM probabilities for CalibratedClassifierCV."""

    def __init__(self, rf, lgbm):
        self.rf = rf
        self.lgbm = lgbm
        self.classes_ = np.array([0, 1])

    def predict_proba(self, X):
        p_rf = self.rf.predict_proba(X)
        p_lgbm = self.lgbm.predict_proba(X)
        return (p_rf + p_lgbm) / 2

    def predict(self, X):
        avg = self.predict_proba(X)[:, 1]
        return (avg >= 0.5).astype(int)

    def fit(self, X, y):
        return self

    def get_params(self, deep=True):
        return {"rf": self.rf, "lgbm": self.lgbm}

    def set_params(self, **params):
        return self


def main() -> None:
    csv_path = PROCESSED_DIR / "wildfire_train.csv"
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

    # --- Random Forest ---
    print("Training Random Forest...")
    rf = RandomForestClassifier(
        n_estimators=RF_N_ESTIMATORS,
        max_depth=RF_MAX_DEPTH,
        random_state=RANDOM_SEED,
        class_weight="balanced",
        n_jobs=-1,
    )
    rf.fit(X_train, y_train)

    y_pred_rf = rf.predict(X_test)
    y_prob_rf = rf.predict_proba(X_test)[:, 1]
    print_metrics(y_test, y_pred_rf, y_prob_rf, label="Wildfire RF")

    # --- LightGBM ---
    print("Training LightGBM...")
    lgbm = LGBMClassifier(
        n_estimators=LGBM_N_ESTIMATORS,
        max_depth=LGBM_MAX_DEPTH,
        learning_rate=LGBM_LEARNING_RATE,
        random_state=RANDOM_SEED,
        is_unbalance=True,
        verbose=-1,
    )
    lgbm.fit(X_train, y_train)

    y_pred_lgbm = lgbm.predict(X_test)
    y_prob_lgbm = lgbm.predict_proba(X_test)[:, 1]
    print_metrics(y_test, y_pred_lgbm, y_prob_lgbm, label="Wildfire LightGBM")

    # --- Ensemble average ---
    y_prob_avg = (y_prob_rf + y_prob_lgbm) / 2
    y_pred_avg = (y_prob_avg >= 0.5).astype(int)
    print_metrics(y_test, y_pred_avg, y_prob_avg, label="Wildfire Ensemble (avg)")

    # --- Platt calibration (LogisticRegression on averaged probabilities) ---
    print("Fitting Platt calibrator...")
    from sklearn.linear_model import LogisticRegression

    cal_X_train = (rf.predict_proba(X_train)[:, 1] + lgbm.predict_proba(X_train)[:, 1]) / 2
    calibrator = LogisticRegression(random_state=RANDOM_SEED)
    calibrator.fit(cal_X_train.reshape(-1, 1), y_train)

    y_prob_cal = calibrator.predict_proba(y_prob_avg.reshape(-1, 1))[:, 1]
    y_pred_cal = (y_prob_cal >= 0.5).astype(int)
    print_metrics(y_test, y_pred_cal, y_prob_cal, label="Wildfire Calibrated")

    # --- Save all 3 models ---
    save_model(rf, SAVED_MODELS_DIR / "wildfire_rf.joblib", "Wildfire RF")
    save_model(lgbm, SAVED_MODELS_DIR / "wildfire_lgbm.joblib", "Wildfire LightGBM")
    save_model(calibrator, SAVED_MODELS_DIR / "wildfire_calibrator.joblib", "Wildfire Calibrator")
    print("Done.")


if __name__ == "__main__":
    main()
