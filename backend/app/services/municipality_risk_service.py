"""Municipality-level risk disaggregation.

Distributes province-level risk scores to municipalities based on
geographic and demographic modifiers.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.municipality import Municipality

logger = logging.getLogger(__name__)


@dataclass
class MunicipalityRisk:
    ine_code: str
    name: str
    province_code: str
    latitude: float
    longitude: float
    composite_score: float
    dominant_hazard: str
    severity: str
    modifiers: dict


def _elevation_modifier(elevation_m: float | None, hazard: str) -> float:
    """Adjust score based on elevation for specific hazards."""
    if elevation_m is None:
        return 1.0
    if hazard == "flood":
        # Low elevation = higher flood risk
        if elevation_m < 50:
            return 1.2
        elif elevation_m < 200:
            return 1.05
        elif elevation_m > 800:
            return 0.8
    elif hazard == "heatwave":
        # Low inland elevation = heat trapping
        if elevation_m < 200:
            return 1.1
        elif elevation_m > 1000:
            return 0.85
    elif hazard == "wildfire":
        # Mid-elevation forested areas
        if 300 < elevation_m < 1000:
            return 1.1
    elif hazard == "coldwave":
        if elevation_m > 1000:
            return 1.2
        elif elevation_m > 600:
            return 1.1
    elif hazard == "windstorm":
        if elevation_m > 800:
            return 1.1
    return 1.0


def _coastal_modifier(is_coastal: bool, hazard: str) -> float:
    """Adjust score based on coastal location."""
    if not is_coastal:
        return 1.0
    if hazard == "flood":
        return 1.15  # Coastal flooding
    elif hazard == "heatwave":
        return 0.9  # Sea breeze cooling
    elif hazard == "wildfire":
        return 0.95  # Higher humidity near coast
    elif hazard == "windstorm":
        return 1.1  # Coastal wind exposure
    return 1.0


async def disaggregate_province_risk(
    db: AsyncSession,
    province_code: str,
    province_risk: dict,
) -> list[MunicipalityRisk]:
    """Disaggregate province-level risk to municipality-level.

    Uses elevation and coastal modifiers to adjust province scores
    for each municipality.
    """
    stmt = select(Municipality).where(Municipality.province_code == province_code)
    result = await db.execute(stmt)
    municipalities = result.scalars().all()

    if not municipalities:
        return []

    composite = province_risk.get("composite_score", 0)
    dominant = province_risk.get("dominant_hazard", "flood")

    results = []
    for m in municipalities:
        elev_mod = _elevation_modifier(m.elevation_m, dominant)
        coast_mod = _coastal_modifier(m.is_coastal, dominant)
        combined_mod = elev_mod * coast_mod

        adjusted = round(min(100, composite * combined_mod), 1)

        if adjusted >= 80:
            sev = "critical"
        elif adjusted >= 60:
            sev = "high"
        elif adjusted >= 40:
            sev = "moderate"
        elif adjusted >= 20:
            sev = "low"
        else:
            sev = "minimal"

        results.append(MunicipalityRisk(
            ine_code=m.ine_code,
            name=m.name,
            province_code=province_code,
            latitude=m.latitude,
            longitude=m.longitude,
            composite_score=adjusted,
            dominant_hazard=dominant,
            severity=sev,
            modifiers={
                "elevation": round(elev_mod, 2),
                "coastal": round(coast_mod, 2),
                "combined": round(combined_mod, 2),
            },
        ))

    return results
