"""Composite risk engine -- aggregates individual hazard scores.

Uses an INFORM-inspired blended formula: the composite is a weighted mix
of the single highest active hazard (60%) and the geometric mean of the
top-3 active hazards (40%).  This rewards multi-hazard situations -- a
province under several concurrent threats scores higher than one with a
single threat of similar magnitude and everything else near zero.
"""

from __future__ import annotations

import math
from math import prod


def _clamp(v: float) -> float:
    """Clamp a hazard score to [0, 100], treating NaN/Inf as 0/100."""
    if math.isnan(v):
        return 0.0
    if math.isinf(v):
        return 100.0
    return max(0.0, min(100.0, v))


def score_to_severity(score: float) -> str:
    """Map a 0--100 risk score to a human-readable severity label."""
    if score <= 20:
        return "low"
    if score <= 40:
        return "moderate"
    if score <= 60:
        return "high"
    if score <= 80:
        return "very_high"
    return "critical"


def compute_composite_risk(
    flood: float,
    wildfire: float,
    drought: float,
    heatwave: float,
    seismic: float = 0.0,
    coldwave: float = 0.0,
    windstorm: float = 0.0,
    dana: float = 0.0,
) -> dict:
    """Compute the composite risk score from individual hazard scores.

    Uses an INFORM-inspired blended formula:

    * ``active`` = all clamped scores strictly > 5, sorted descending.
    * ``max_hazard`` = the single highest active score.
    * ``geo_mean_top3`` = geometric mean of the top 3 active scores.
    * ``composite = 0.6 * max_hazard + 0.4 * geo_mean_top3`` (capped at 100).

    If no hazard exceeds the noise threshold of 5, the composite is 0.

    Returns a dict suitable for persisting as a :class:`RiskScore` row.
    """
    flood, wildfire, drought, heatwave = _clamp(flood), _clamp(wildfire), _clamp(drought), _clamp(heatwave)
    seismic, coldwave, windstorm, dana = _clamp(seismic), _clamp(coldwave), _clamp(windstorm), _clamp(dana)

    scores = {
        "flood": flood,
        "wildfire": wildfire,
        "drought": drought,
        "heatwave": heatwave,
        "seismic": seismic,
        "coldwave": coldwave,
        "windstorm": windstorm,
        "dana": dana,
    }
    sorted_hazards = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    # INFORM-inspired blended formula
    active = sorted([s for s in scores.values() if s > 5], reverse=True)
    max_hazard = active[0] if active else 0.0
    geo_mean_top3 = (
        prod(active[:3]) ** (1.0 / min(3, len(active))) if active else 0.0
    )
    composite = min(100.0, 0.6 * max_hazard + 0.4 * geo_mean_top3)

    dominant = sorted_hazards[0][0]
    severity = score_to_severity(composite)

    return {
        "composite_score": round(composite, 2),
        "dominant_hazard": dominant,
        "severity": severity,
        "flood_score": round(flood, 2),
        "wildfire_score": round(wildfire, 2),
        "drought_score": round(drought, 2),
        "heatwave_score": round(heatwave, 2),
        "seismic_score": round(seismic, 2),
        "coldwave_score": round(coldwave, 2),
        "windstorm_score": round(windstorm, 2),
        "dana_score": round(dana, 2),
    }
