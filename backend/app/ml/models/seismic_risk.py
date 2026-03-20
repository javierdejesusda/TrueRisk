"""Seismic / earthquake risk model for Spain."""

from __future__ import annotations

from typing import Any

FEATURE_NAMES = [
    "max_magnitude_30d",
    "max_magnitude_90d",
    "earthquake_count_30d",
    "nearest_quake_distance_km",
    "nearest_quake_magnitude",
    "nearest_quake_depth_km",
    "cumulative_energy_30d",
    "seismic_zone_weight",
]

_model = None


def predict_seismic_risk(features: dict[str, Any]) -> float:
    """Return seismic risk 0-100. Uses rule-based heuristic."""
    return _rule_based_seismic(features)


def _rule_based_seismic(f: dict[str, Any]) -> float:
    score = 0.0
    mag = f.get("max_magnitude_30d", 0.0) or 0.0
    count = f.get("earthquake_count_30d", 0) or 0
    dist = f.get("nearest_quake_distance_km", 999) or 999
    depth = f.get("nearest_quake_depth_km", 50) or 50
    zone = f.get("seismic_zone_weight", 0.3) or 0.3

    # Magnitude (primary driver)
    if mag >= 5.0:
        score += 50
    elif mag >= 4.0:
        score += 30
    elif mag >= 3.0:
        score += 15
    elif mag >= 2.0:
        score += 5

    # Frequency
    if count >= 20:
        score += 15
    elif count >= 10:
        score += 10
    elif count >= 5:
        score += 5

    # Proximity
    if dist < 50:
        score += 15
    elif dist < 100:
        score += 10
    elif dist < 150:
        score += 5

    # Shallow earthquakes are more damaging
    if depth < 10 and mag >= 3.0 and dist < 100:
        score += 10

    # Zone factor
    score += zone * 10

    return min(100.0, max(0.0, score))
