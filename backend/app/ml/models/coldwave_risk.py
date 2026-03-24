"""Cold wave risk model for Spain."""

from __future__ import annotations

from typing import Any

FEATURE_NAMES = [
    "temperature",
    "temperature_min",
    "temperature_min_7d",
    "wind_chill",
    "consecutive_cold_days",
    "consecutive_cold_nights",
    "humidity",
    "wind_speed",
    "precip_24h",
    "month",
    "latitude",
    "elevation_m",
    "is_coastal",
    "cloud_cover",
    "season_sin",
    "season_cos",
    "temp_trend_7d",
    "cold_persistence",
    "temp_drop_7d",
]

_model = None


def predict_coldwave_risk(features: dict[str, Any]) -> float:
    """Return cold wave risk 0-100. Uses rule-based heuristic."""
    return _rule_based_coldwave(features)


def _rule_based_coldwave(f: dict[str, Any]) -> float:
    score = 0.0
    wind_chill = f.get("wind_chill", 10.0) or 10.0
    temp_min = f.get("temperature_min", 5.0) or 5.0
    consecutive_cold_days = f.get("consecutive_cold_days", 0) or 0
    consecutive_cold_nights = f.get("consecutive_cold_nights", 0) or 0
    elevation = f.get("elevation_m", 200.0) or 200.0
    is_coastal = f.get("is_coastal", 0.0) or 0.0
    month = f.get("month", 6) or 6

    # Wind chill (primary driver)
    if wind_chill < -15:
        score += 40
    elif wind_chill < -10:
        score += 30
    elif wind_chill < -5:
        score += 20
    elif wind_chill < 0:
        score += 10

    # Temperature minimum
    if temp_min < -10:
        score += 20
    elif temp_min < -5:
        score += 15
    elif temp_min < 0:
        score += 8
    elif temp_min < 5:
        score += 4

    # Consecutive cold days (max temp < 5C)
    if consecutive_cold_days > 5:
        score += 15
    elif consecutive_cold_days > 3:
        score += 10
    elif consecutive_cold_days > 1:
        score += 5

    # Consecutive cold nights (min temp < 0C)
    if consecutive_cold_nights > 5:
        score += 10
    elif consecutive_cold_nights > 3:
        score += 5

    # High elevation bonus
    if elevation > 1000:
        score += 5

    # Inland (not coastal) bonus
    if not is_coastal:
        score += 5

    # Seasonal damping: reduce score in warm months
    if month in (6, 7, 8):
        score *= 0.1
    elif month in (5, 9):
        score *= 0.3

    return min(100.0, max(0.0, score))
