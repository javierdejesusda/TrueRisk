"""Flash-flood risk model -- XGBoost classifier with rule-based fallback."""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).parent.parent / "saved_models" / "flood_xgboost.joblib"

# 25 features expected by the trained XGBoost model (order matters).
FEATURE_NAMES: list[str] = [
    "precip_1h",
    "precip_6h",
    "precip_24h",
    "precip_48h",
    "precip_momentum",
    "humidity",
    "soil_moisture",
    "soil_moisture_change_24h",
    "wind_speed",
    "pressure",
    "pressure_tendency_1d",
    "dew_point_depression",
    "cloud_cover",
    "elevation_m",
    "is_coastal",
    "is_mediterranean",
    "river_basin_risk",
    "month",
    "season_sin",
    "season_cos",
    "precip_7day_anomaly",
    "consecutive_rain_days",
    "max_precip_intensity_ratio",
    "antecedent_precip_index",
    "antecedent_precip_index_092",
    "antecedent_precip_index_095",
    "soil_saturation_excess",
]

_model = None


def _load_model():
    """Lazy-load the trained XGBoost model from disk (once)."""
    global _model
    if _model is None and MODEL_PATH.exists():
        try:
            import joblib

            _model = joblib.load(MODEL_PATH)
            logger.info("Loaded flood XGBoost model from %s", MODEL_PATH)
        except Exception:
            logger.exception("Failed to load flood model from %s", MODEL_PATH)
    return _model


def get_trained_model():
    """Return the loaded XGBoost model or None."""
    return _load_model()


def predict_flood_risk(features: dict) -> float:
    """Return a flood-risk score in the range 0--100.

    Uses the trained XGBoost model when available; otherwise falls back to a
    deterministic rule-based heuristic.
    """
    model = _load_model()
    if model is not None:
        X = np.array([[features.get(f, 0.0) for f in FEATURE_NAMES]])
        try:
            prob = model.predict_proba(X)[0][1]
            return round(float(prob) * 100, 2)
        except Exception:
            logger.exception("Flood model inference failed -- using rule-based fallback")

    return _rule_based_flood(features)


# Rule-based fallback

def _rule_based_flood(f: dict) -> float:
    """Heuristic flood-risk score driven primarily by recent precipitation."""
    score = 0.0

    # -- Precipitation is the primary driver ---------------------------------
    precip_24h = f.get("precip_24h", 0) or 0
    if precip_24h > 100:
        score += 40
    elif precip_24h > 60:
        score += 30
    elif precip_24h > 30:
        score += 20
    elif precip_24h > 10:
        score += 10

    # 6-hour precipitation intensity
    precip_6h = f.get("precip_6h", 0) or 0
    if precip_6h > 50:
        score += 20
    elif precip_6h > 30:
        score += 15
    elif precip_6h > 15:
        score += 8

    # -- Soil saturation -----------------------------------------------------
    soil = f.get("soil_moisture", 0.3) or 0.3
    if soil > 0.8:
        score += 15
    elif soil > 0.6:
        score += 10
    elif soil > 0.4:
        score += 5

    # -- Geographic factors --------------------------------------------------
    river_basin_risk = f.get("river_basin_risk", 0.3) or 0.3
    score += river_basin_risk * 15

    if f.get("is_mediterranean", False):
        score += 5

    # -- Humidity (saturated atmosphere) -------------------------------------
    humidity = f.get("humidity", 50) or 50
    if humidity > 90:
        score += 5

    return min(100.0, max(0.0, round(score, 2)))
