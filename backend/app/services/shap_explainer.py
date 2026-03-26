"""SHAP TreeExplainer for tree-based risk models (XGBoost, LightGBM, RF).

Provides model-derived feature importance as an alternative to the
rule-based lookup tables in explainability_service.py.
"""
from __future__ import annotations

import logging
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)

_FEATURE_DESCRIPTIONS: dict[str, str] = {
    "precip_1h": "1-hour precipitation",
    "precip_6h": "6-hour precipitation",
    "precip_24h": "24-hour precipitation",
    "precip_48h": "48-hour precipitation",
    "precip_momentum": "Precipitation momentum",
    "humidity": "Relative humidity",
    "soil_moisture": "Soil moisture",
    "soil_moisture_change_24h": "24h soil moisture change",
    "wind_speed": "Wind speed",
    "pressure": "Atmospheric pressure",
    "pressure_tendency_1d": "Pressure tendency (1 day)",
    "dew_point_depression": "Dew point depression",
    "cloud_cover": "Cloud cover",
    "elevation_m": "Elevation",
    "is_coastal": "Coastal location",
    "is_mediterranean": "Mediterranean region",
    "river_basin_risk": "River basin risk factor",
    "month": "Month of year",
    "season_sin": "Seasonal cycle (sine)",
    "season_cos": "Seasonal cycle (cosine)",
    "precip_7day_anomaly": "7-day precipitation anomaly",
    "consecutive_rain_days": "Consecutive rain days",
    "max_precip_intensity_ratio": "Max precipitation intensity ratio",
    "antecedent_precip_index": "Antecedent precipitation index",
    "soil_saturation_excess": "Soil saturation excess",
    "ffmc": "Fine Fuel Moisture Code",
    "dmc": "Duff Moisture Code",
    "dc": "Drought Code",
    "isi": "Initial Spread Index",
    "bui": "Buildup Index",
    "fwi": "Fire Weather Index",
    "temperature": "Temperature",
    "temperature_max_7d": "7-day max temperature",
    "humidity_min_7d": "7-day minimum humidity",
    "wind_gust_max": "Maximum wind gusts",
    "precipitation_7d": "7-day precipitation",
    "precipitation_30d": "30-day precipitation",
    "consecutive_dry_days": "Consecutive dry days",
    "uv_index": "UV index",
    "ndvi": "Vegetation index (NDVI)",
    "ndvi_anomaly": "NDVI anomaly",
    "heat_index": "Heat index",
    "wbgt": "Wet Bulb Globe Temperature",
    "consecutive_hot_days": "Consecutive hot days",
    "night_temperature_min": "Minimum night temperature",
    "temperature_anomaly": "Temperature anomaly vs normal",
}


def explain_with_shap(
    model: Any,
    features: dict[str, float],
    feature_names: list[str],
    hazard: str,
) -> list[dict]:
    """Compute SHAP feature importance for a single prediction.

    Returns list of {feature, value, contribution, description} dicts,
    sorted by absolute contribution (descending), top 10.
    Returns empty list if SHAP computation fails.
    """
    try:
        import shap

        # Validate model has predict_proba (basic sanity check)
        if not hasattr(model, "predict_proba"):
            return []

        feature_values = np.array([[features.get(f, 0.0) for f in feature_names]])
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(feature_values)

        if isinstance(shap_values, list):
            sv = shap_values[1][0]
        elif shap_values.ndim == 3:
            sv = shap_values[0, :, 1]
        else:
            sv = shap_values[0]

        contributions = []
        for i, fname in enumerate(feature_names):
            if abs(sv[i]) < 0.01:
                continue
            contributions.append({
                "feature": fname,
                "value": round(float(feature_values[0][i]), 2),
                "contribution": round(float(sv[i]) * 100, 2),
                "description": _FEATURE_DESCRIPTIONS.get(fname, fname.replace("_", " ").title()),
            })

        contributions.sort(key=lambda x: abs(float(x["contribution"])), reverse=True)
        return contributions[:10]
    except Exception:
        logger.warning("SHAP explanation failed for %s", hazard, exc_info=True)
        return []
