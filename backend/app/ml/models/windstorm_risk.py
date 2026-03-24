"""Windstorm risk model for Spain."""

from __future__ import annotations

from typing import Any

FEATURE_NAMES = [
    "wind_speed",
    "wind_gusts",
    "gust_factor",
    "wind_variability_3d",
    "pressure",
    "pressure_tendency_1d",
    "pressure_tendency_3d",
    "pressure_min_3d",
    "humidity",
    "precipitation_6h",
    "gust_speed_ratio_7d",
    "pressure_tendency_7d",
    "storm_energy_proxy",
    "pressure_anomaly_30d",
    "is_coastal",
    "is_mediterranean",
    "elevation_m",
    "month",
    "season_sin",
    "season_cos",
]

_model = None


def predict_windstorm_risk(features: dict[str, Any]) -> float:
    """Return windstorm risk 0-100. Uses rule-based heuristic."""
    return _rule_based_windstorm(features)


def _rule_based_windstorm(f: dict[str, Any]) -> float:
    score = 0.0
    gusts = f.get("wind_gusts", 0.0) or 0.0
    wind = f.get("wind_speed", 0.0) or 0.0
    pressure_tendency = f.get("pressure_tendency_1d", 0.0) or 0.0
    pressure = f.get("pressure", 1013.0) or 1013.0
    is_coastal = f.get("is_coastal", 0.0) or 0.0
    is_med = f.get("is_mediterranean", 0.0) or 0.0
    month = f.get("month", 6) or 6

    # Wind gusts (primary driver)
    if gusts > 120:
        score += 50
    elif gusts > 100:
        score += 40
    elif gusts > 80:
        score += 30
    elif gusts > 60:
        score += 20
    elif gusts > 40:
        score += 10

    # Sustained wind
    if wind > 80:
        score += 20
    elif wind > 60:
        score += 15
    elif wind > 40:
        score += 10
    elif wind > 25:
        score += 5

    # Pressure drop (1-day tendency, negative = dropping)
    if pressure_tendency < -10:
        score += 15
    elif pressure_tendency < -6:
        score += 10
    elif pressure_tendency < -3:
        score += 5

    # Low pressure
    if pressure < 985:
        score += 10
    elif pressure < 995:
        score += 5

    # Coastal exposure
    if is_coastal:
        score += 5

    # Mediterranean in autumn (DANA season: Sep-Nov)
    if is_med and month in (9, 10, 11):
        score += 5

    return min(100.0, max(0.0, score))
