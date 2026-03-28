"""Heatwave / health-impact risk model -- XGBoost with rule-based fallback."""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).parent.parent / "saved_models" / "heatwave_xgboost.joblib"

# 20 features expected by the trained XGBoost model (order matters).
FEATURE_NAMES: list[str] = [
    "temperature",
    "temperature_max",
    "temperature_min",
    "heat_index",
    "wbgt",
    "utci",
    "consecutive_hot_days",
    "consecutive_hot_nights",
    "heat_wave_day",
    "humidity",
    "wind_speed",
    "uv_index",
    "temperature_anomaly",
    "temp_max_trend",
    "month",
    "latitude",
    "elevation_m",
    "is_coastal",
    "cloud_cover",
    "solar_irradiance",
]

_model = None


def _load_model():
    """Lazy-load the trained XGBoost model from disk (once)."""
    global _model
    if _model is None and MODEL_PATH.exists():
        try:
            import joblib

            _model = joblib.load(MODEL_PATH)
            logger.info("Loaded heatwave XGBoost model from %s", MODEL_PATH)
        except Exception:
            logger.exception("Failed to load heatwave model from %s", MODEL_PATH)
    return _model


def get_trained_model():
    """Return the loaded XGBoost model or None."""
    return _load_model()


def predict_heatwave_risk(features: dict) -> float:
    """Return a heatwave-risk score in the range 0--100.

    Uses the trained XGBoost model when available; otherwise falls back to a
    deterministic rule-based heuristic driven by heat-index thresholds.
    """
    model = _load_model()
    if model is not None:
        X = np.array([[features.get(f, 0.0) for f in FEATURE_NAMES]])
        try:
            prob = model.predict_proba(X)[0][1]
            return round(float(prob) * 100, 2)
        except Exception:
            logger.exception("Heatwave model inference failed -- using rule-based fallback")

    return _rule_based_heatwave(features)


# ---------------------------------------------------------------------------
# Rule-based fallback
# ---------------------------------------------------------------------------

def _rule_based_heatwave(f: dict) -> float:
    """Heuristic heatwave score driven by heat index and consecutive hot days."""
    score = 0.0

    # -- Heat index is the primary driver ------------------------------------
    heat_index = f.get("heat_index", 0) or 0
    if heat_index > 54:
        score += 90
    elif heat_index > 41:
        score += 60
    elif heat_index > 32:
        score += 30
    elif heat_index > 27:
        score += 15

    # -- Consecutive hot days ------------------------------------------------
    hot_days = f.get("consecutive_hot_days", 0) or 0
    if hot_days > 7:
        score += 15
    elif hot_days > 4:
        score += 10
    elif hot_days > 2:
        score += 5

    # -- Consecutive hot nights (lack of nighttime cooling) ------------------
    hot_nights = f.get("consecutive_hot_nights", 0) or 0
    if hot_nights > 5:
        score += 10
    elif hot_nights > 3:
        score += 6
    elif hot_nights > 1:
        score += 3

    # -- Low elevation (trapped heat) ----------------------------------------
    elevation = f.get("elevation_m", 200) or 200
    if elevation < 50:
        score += 5
    elif elevation < 200:
        score += 3

    # -- Inland (no sea-breeze cooling) --------------------------------------
    if not f.get("is_coastal", False):
        score += 5

    # -- UV index (aggravates health impact) ---------------------------------
    uv = f.get("uv_index", 0) or 0
    if uv > 10:
        score += 5
    elif uv > 7:
        score += 3

    return min(100.0, max(0.0, round(score, 2)))
