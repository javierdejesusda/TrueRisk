"""DANA nowcasting service -- T+1h, T+3h, T+6h probability.

Takes the current DANA feature set and upper-air forecast arrays,
then substitutes forecast values at each time horizon to estimate
how DANA risk will evolve over the next 6 hours.
"""

from __future__ import annotations

import logging
from typing import Any

from app.ml.models.dana_risk import predict_dana_risk

logger = logging.getLogger(__name__)


def compute_dana_nowcast(
    current_features: dict[str, Any],
    upper_air: dict[str, Any],
) -> dict[str, float]:
    """Compute DANA probability at T+1h, T+3h, T+6h.

    Uses the current DANA features as a base, then substitutes
    forecast precipitation and CAPE at each horizon.
    """
    precip_hourly = upper_air.get("precip_hourly", [])
    cape_hourly = upper_air.get("cape_hourly", [])
    pressure_hourly = upper_air.get("pressure_hourly", [])

    results = {}
    for label, hours in [("t1h", 1), ("t3h", 3), ("t6h", 6)]:
        features = dict(current_features)

        # Substitute forecast values at this horizon
        if len(precip_hourly) > hours:
            features["precip_6h"] = sum(precip_hourly[:hours])
        if len(cape_hourly) > hours:
            features["cape_current"] = max(cape_hourly[:hours])
        if len(pressure_hourly) > hours:
            features["pressure_change_6h"] = (
                pressure_hourly[hours] - pressure_hourly[0]
            )

        score = predict_dana_risk(features)
        results[label] = round(score, 1)

    return results
