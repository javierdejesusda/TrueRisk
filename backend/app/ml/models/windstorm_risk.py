"""Windstorm risk model for Spain."""

from __future__ import annotations

from typing import Any

FEATURE_NAMES = [
    "wind_speed",
    "wind_gusts",
    "wind_gust_max_24h",
    "wind_speed_max_24h",
    "pressure",
    "pressure_change_6h",
    "pressure_change_24h",
    "pressure_min_24h",
    "humidity",
    "precipitation_6h",
    "is_coastal",
    "is_mediterranean",
    "elevation_m",
    "month",
]

_model = None


def predict_windstorm_risk(features: dict[str, Any]) -> float:
    """Return windstorm risk 0-100. Uses rule-based heuristic."""
    return _rule_based_windstorm(features)


def _rule_based_windstorm(f: dict[str, Any]) -> float:
    score = 0.0
    gusts = f.get("wind_gusts", 0.0) or 0.0
    wind = f.get("wind_speed", 0.0) or 0.0
    gust_max_24h = f.get("wind_gust_max_24h", 0.0) or 0.0
    pressure_change_6h = f.get("pressure_change_6h", 0.0) or 0.0
    pressure = f.get("pressure", 1013.0) or 1013.0
    is_coastal = f.get("is_coastal", 0.0) or 0.0
    is_med = f.get("is_mediterranean", 0.0) or 0.0
    month = f.get("month", 6) or 6

    # Use the larger of current gusts and 24h max
    effective_gusts = max(gusts, gust_max_24h)

    # Wind gusts (primary driver)
    if effective_gusts > 120:
        score += 50
    elif effective_gusts > 100:
        score += 40
    elif effective_gusts > 80:
        score += 30
    elif effective_gusts > 60:
        score += 20
    elif effective_gusts > 40:
        score += 10

    # Sustained wind
    wind_max_24h = f.get("wind_speed_max_24h", wind) or wind
    effective_wind = max(wind, wind_max_24h)
    if effective_wind > 80:
        score += 20
    elif effective_wind > 60:
        score += 15
    elif effective_wind > 40:
        score += 10
    elif effective_wind > 25:
        score += 5

    # Pressure drop over 6h (negative = dropping)
    if pressure_change_6h < -10:
        score += 15
    elif pressure_change_6h < -6:
        score += 10
    elif pressure_change_6h < -3:
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
