"""Composite risk engine -- aggregates individual hazard scores.

The composite score is dominated by the highest active threat rather than
being a simple average.  Secondary hazards contribute marginal risk with
diminishing returns so that a province under one extreme threat is rated
higher than one under multiple moderate threats.
"""

from __future__ import annotations


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
) -> dict:
    """Compute the composite risk score from four individual hazard scores.

    The composite is dominated by the single highest hazard.  Secondary
    hazards add a fraction of their score that diminishes with rank:

    * 2nd-highest:  +15% of its score
    * 3rd-highest:  +7.5% of its score
    * 4th-highest:  +5% of its score

    Returns a dict suitable for persisting as a :class:`RiskScore` row.
    """
    scores = {
        "flood": flood,
        "wildfire": wildfire,
        "drought": drought,
        "heatwave": heatwave,
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
    }
