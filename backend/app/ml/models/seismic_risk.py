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
    mag = f.get("max_magnitude_30d", 0.0) or 0.0
    mag_90 = f.get("max_magnitude_90d", 0.0) or 0.0
    count = f.get("earthquake_count_30d", 0) or 0
    dist = f.get("nearest_quake_distance_km", 999) or 999
    depth = f.get("nearest_quake_depth_km", 50) or 50
    zone = f.get("seismic_zone_weight", 0.3) or 0.3

    # 1. Geological baseline from zone weight (0-60 points)
    # Maps zone weight 0.0-1.0 to a baseline score using a quadratic curve
    # that emphasizes high-risk zones (e.g. Murcia 0.85 -> ~50.6)
    baseline = zone * zone * 70

    # 2. Recent activity score (0-40 points)
    activity = 0.0

    # Magnitude contribution (30-day window, primary)
    if mag >= 5.0:
        activity += 30
    elif mag >= 4.0:
        activity += 20
    elif mag >= 3.0:
        activity += 12
    elif mag >= 2.0:
        activity += 5

    # 90-day magnitude (secondary, smaller contribution)
    if mag_90 >= 4.0 and mag < 4.0:
        activity += 8
    elif mag_90 >= 3.0 and mag < 3.0:
        activity += 4

    # Frequency bonus
    if count >= 20:
        activity += 10
    elif count >= 10:
        activity += 6
    elif count >= 5:
        activity += 3

    # Proximity bonus
    if dist < 50:
        activity += 8
    elif dist < 100:
        activity += 5
    elif dist < 150:
        activity += 2

    # Shallow earthquake amplifier
    if depth < 10 and mag >= 3.0 and dist < 100:
        activity += 6

    # 3. Combine: baseline + activity (activity slightly amplified in high-risk zones)
    score = baseline + activity * (0.7 + 0.3 * zone)

    return min(100.0, max(0.0, round(score, 1)))
