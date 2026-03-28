"""Wildfire risk model -- LightGBM with Platt calibration and rule-based fallback."""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)

_SAVED_DIR = Path(__file__).parent.parent / "saved_models"
LGBM_MODEL_PATH = _SAVED_DIR / "wildfire_lgbm.joblib"
CALIBRATOR_PATH = _SAVED_DIR / "wildfire_calibrator.joblib"

# 20 features expected by the trained models (order matters).
FEATURE_NAMES: list[str] = [
    "ffmc",
    "dmc",
    "dc",
    "isi",
    "bui",
    "fwi",
    "temperature",
    "temperature_max_7d",
    "humidity",
    "humidity_min_7d",
    "wind_speed",
    "wind_gust_max",
    "precipitation_7d",
    "precipitation_30d",
    "consecutive_dry_days",
    "soil_moisture",
    "uv_index",
    "elevation_m",
    "month",
    "is_coastal",
    "ndvi",
    "ndvi_anomaly",
]

_lgbm_model = None
_calibrator = None


def _load_models():
    """Lazy-load LightGBM model + optional Platt calibrator from disk."""
    global _lgbm_model, _calibrator

    if _lgbm_model is None and LGBM_MODEL_PATH.exists():
        try:
            import joblib

            _lgbm_model = joblib.load(LGBM_MODEL_PATH)
            logger.info("Loaded wildfire LightGBM model from %s", LGBM_MODEL_PATH)
        except Exception:
            logger.exception("Failed to load wildfire LightGBM model")

    if _calibrator is None and CALIBRATOR_PATH.exists():
        try:
            import joblib

            _calibrator = joblib.load(CALIBRATOR_PATH)
            logger.info("Loaded wildfire Platt calibrator from %s", CALIBRATOR_PATH)
        except Exception:
            logger.exception("Failed to load wildfire calibrator")

    return _lgbm_model, _calibrator


def get_trained_models():
    """Return (lgbm_model, calibrator) tuple. Either may be None."""
    _load_models()
    return _lgbm_model, _calibrator


def predict_wildfire_risk(features: dict) -> float:
    """Return a wildfire-risk score in the range 0--100.

    When the trained LightGBM model is available the score is its
    (optionally Platt-calibrated) predicted probability.  Otherwise a
    deterministic rule-based heuristic driven by the FWI system is used.
    """
    lgbm, calibrator = _load_models()

    if lgbm is not None:
        X = np.array([[features.get(f, 0.0) for f in FEATURE_NAMES]])

        try:
            prob = float(lgbm.predict_proba(X)[0][1])
        except Exception:
            logger.exception("Wildfire model inference failed -- using rule-based fallback")
            return _rule_based_wildfire(features)

        if calibrator is not None:
            try:
                prob = float(
                    calibrator.predict_proba(np.array([[prob]]))[0][1]
                )
            except Exception:
                logger.warning("Platt calibration failed; using raw probability")

        return round(prob * 100, 2)

    return _rule_based_wildfire(features)


# ---------------------------------------------------------------------------
# Rule-based fallback
# ---------------------------------------------------------------------------

def _rule_based_wildfire(f: dict) -> float:
    """Heuristic wildfire-risk score driven primarily by the FWI system."""
    score = 0.0

    # -- FWI is the primary driver -------------------------------------------
    fwi = f.get("fwi", 0) or 0
    if fwi > 50:
        score += 60
    elif fwi > 30:
        score += 40
    elif fwi > 15:
        score += 25
    elif fwi > 5:
        score += 10

    # -- Consecutive dry days ------------------------------------------------
    dry_days = f.get("consecutive_dry_days", 0) or 0
    if dry_days > 30:
        score += 15
    elif dry_days > 15:
        score += 10
    elif dry_days > 7:
        score += 5

    # -- Low humidity --------------------------------------------------------
    humidity = f.get("humidity", 50) or 50
    if humidity < 15:
        score += 10
    elif humidity < 25:
        score += 7
    elif humidity < 35:
        score += 4

    # -- High temperature ----------------------------------------------------
    temperature = f.get("temperature", 20) or 20
    if temperature > 40:
        score += 10
    elif temperature > 35:
        score += 7
    elif temperature > 30:
        score += 4

    # -- Wind speed ----------------------------------------------------------
    wind = f.get("wind_speed", 0) or 0
    if wind > 40:
        score += 8
    elif wind > 25:
        score += 5
    elif wind > 15:
        score += 2

    # -- Soil moisture (dry soil = higher risk) ------------------------------
    soil = f.get("soil_moisture", 0.3) or 0.3
    if soil < 0.1:
        score += 5
    elif soil < 0.2:
        score += 3

    return min(100.0, max(0.0, round(score, 2)))
