"""Composite risk engine -- aggregates individual hazard scores.

The composite score is dominated by the highest active threat rather than
being a simple average.  Secondary hazards contribute marginal risk with
diminishing returns so that a province under one extreme threat is rated
higher than one under multiple moderate threats.
"""

from __future__ import annotations

import math


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

    The composite is dominated by the single highest hazard.  Secondary
    hazards add a fraction of their score that diminishes with rank:

    * 2nd-highest:  +15% of its score
    * 3rd-highest:  +7.5% of its score
    * etc.

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

    max_hazard = sorted_hazards[0][1]

    # Secondary hazards contribute 15%/rank (rank starts at 1 for the 2nd hazard)
    secondary_sum = sum(
        score * 0.15 / (rank + 1)
        for rank, (_, score) in enumerate(sorted_hazards[1:], 1)
    )

    composite = min(100.0, max_hazard + secondary_sum)
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
