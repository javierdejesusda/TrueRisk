"""Simple catchment response model for flood nowcasting.

Uses a unit hydrograph approach: converts upstream precipitation volume
to estimated downstream flow with a time-delay based on catchment size.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class CatchmentParams:
    """Parameters for a river catchment."""

    name: str
    area_km2: float
    time_of_concentration_h: float  # Time for water to travel from farthest point to outlet
    runoff_coefficient: float  # 0-1, fraction of precip that becomes runoff
    base_flow_m3s: float  # Typical dry-weather flow


# Simplified catchment parameters for major Spanish river basins
CATCHMENTS: dict[str, CatchmentParams] = {
    "turia": CatchmentParams("Turia", 6394, 8.0, 0.35, 5.0),
    "jucar": CatchmentParams("Júcar", 21578, 12.0, 0.30, 15.0),
    "segura": CatchmentParams("Segura", 18870, 10.0, 0.32, 8.0),
    "guadalquivir": CatchmentParams("Guadalquivir", 57527, 18.0, 0.28, 50.0),
    "ebro": CatchmentParams("Ebro", 85362, 20.0, 0.25, 80.0),
    "llobregat": CatchmentParams("Llobregat", 4948, 6.0, 0.38, 8.0),
    "guadalmedina": CatchmentParams("Guadalmedina", 155, 2.0, 0.45, 0.5),
    "poquet": CatchmentParams("Poquet (Barranco)", 40, 1.0, 0.55, 0.1),
}


def estimate_flow(
    catchment: CatchmentParams,
    precip_mm_per_hour: list[float],
) -> list[dict]:
    """Estimate flow at catchment outlet from hourly precipitation forecast.

    Returns list of {hour, estimated_flow_m3s, above_base_pct} for each hour.
    Uses simplified rational method: Q = C * I * A
    where C=runoff_coefficient, I=intensity(mm/h), A=area(km2)

    Flow is delayed by time_of_concentration.
    """
    results = []
    tc = int(catchment.time_of_concentration_h)

    for h in range(len(precip_mm_per_hour)):
        # Sum precip over the concentration time window ending at hour h
        start = max(0, h - tc)
        window_precip = precip_mm_per_hour[start : h + 1]
        avg_intensity = sum(window_precip) / max(len(window_precip), 1)

        # Rational method: Q (m3/s) = C * I(mm/h) * A(km2) / 3.6
        runoff_flow = (
            catchment.runoff_coefficient * avg_intensity * catchment.area_km2
        ) / 3.6
        total_flow = catchment.base_flow_m3s + runoff_flow
        above_base_pct = (
            round((runoff_flow / catchment.base_flow_m3s) * 100, 1)
            if catchment.base_flow_m3s > 0
            else 0
        )

        results.append(
            {
                "hour": h,
                "estimated_flow_m3s": round(total_flow, 1),
                "runoff_flow_m3s": round(runoff_flow, 1),
                "above_base_pct": above_base_pct,
            }
        )

    return results
