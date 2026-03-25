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
    # Per-hazard scores
    flood_score: float = 0.0
    wildfire_score: float = 0.0
    drought_score: float = 0.0
    heatwave_score: float = 0.0
    seismic_score: float = 0.0
    coldwave_score: float = 0.0
    windstorm_score: float = 0.0
    dana_score: float = 0.0


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
    elif hazard == "dana":
        if elevation_m < 50:
            return 1.25  # Low areas flood from DANA rainfall
        elif elevation_m < 200:
            return 1.1
        elif elevation_m > 800:
            return 0.7
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
    elif hazard == "dana":
        return 1.2  # DANA hits coastal areas hardest
    return 1.0


def _population_modifier(population: int | None, area_km2: float | None, hazard: str) -> float:
    """Adjust score based on population density for demand-sensitive hazards."""
    if population is None or area_km2 is None or area_km2 == 0:
        return 1.0
    density = population / area_km2
    if hazard == "drought":
        # High population density = more water demand pressure
        if density > 1000:
            return 1.15
        elif density > 500:
            return 1.05
    elif hazard == "heatwave":
        # Urban heat island effect
        if density > 1000:
            return 1.1
        elif density > 500:
            return 1.05
    return 1.0


def _land_use_modifier(land_use: str | None, hazard: str) -> float:
    """Land use type risk modifier."""
    if not land_use:
        return 1.0
    if hazard == "wildfire" and land_use == "forest":
        return 1.3
    if hazard == "wildfire" and land_use == "mixed":
        return 1.15
    if hazard == "heatwave" and land_use == "urban":
        return 1.15  # Urban heat island effect
    return 1.0


def _river_proximity_modifier(distance_km: float | None, hazard: str) -> float:
    """River proximity risk modifier for flood hazards."""
    if hazard != "flood" or distance_km is None:
        return 1.0
    if distance_km < 1:
        return 1.4
    if distance_km < 5:
        return 1.15
    return 1.0


def _elderly_modifier(elderly_pct: float | None, hazard: str) -> float:
    """Elderly population risk modifier."""
    if elderly_pct is None:
        return 1.0
    if hazard in ("heatwave", "coldwave") and elderly_pct > 25:
        return 1.2
    if hazard in ("heatwave", "coldwave") and elderly_pct > 20:
        return 1.1
    return 1.0


def _classify_severity(score: float) -> str:
    """Classify a risk score into a severity label."""
    if score >= 80:
        return "critical"
    elif score >= 60:
        return "high"
    elif score >= 40:
        return "moderate"
    elif score >= 20:
        return "low"
    return "minimal"


HAZARDS = ["flood", "wildfire", "drought", "heatwave", "seismic", "coldwave", "windstorm", "dana"]


async def disaggregate_province_risk(
    db: AsyncSession,
    province_code: str,
    province_risk: dict,
) -> list[MunicipalityRisk]:
    """Disaggregate province-level risk to municipality-level.

    Applies elevation, coastal, and population modifiers to each hazard
    score individually, then recomputes the composite as the max of the
    adjusted per-hazard scores.
    """
    stmt = select(Municipality).where(Municipality.province_code == province_code)
    result = await db.execute(stmt)
    municipalities = result.scalars().all()

    if not municipalities:
        return []

    results = []
    for m in municipalities:
        hazard_scores = {}
        modifiers_detail = {}

        for hazard in HAZARDS:
            raw = province_risk.get(f"{hazard}_score", 0.0) or 0.0
            elev_mod = _elevation_modifier(m.elevation_m, hazard)
            coast_mod = _coastal_modifier(m.is_coastal, hazard)
            pop_mod = _population_modifier(m.population, m.area_km2, hazard)
            land_mod = _land_use_modifier(getattr(m, 'land_use_type', None), hazard)
            river_mod = _river_proximity_modifier(getattr(m, 'distance_river_km', None), hazard)
            elder_mod = _elderly_modifier(getattr(m, 'elderly_pct', None), hazard)
            combined = elev_mod * coast_mod * pop_mod * land_mod * river_mod * elder_mod
            hazard_scores[hazard] = round(min(100, max(0, raw * combined)), 1)
            modifiers_detail[hazard] = {
                "elevation": round(elev_mod, 2),
                "coastal": round(coast_mod, 2),
                "population": round(pop_mod, 2),
                "land_use": round(land_mod, 2),
                "river_proximity": round(river_mod, 2),
                "elderly": round(elder_mod, 2),
                "combined": round(combined, 2),
            }

        composite = max(hazard_scores.values()) if hazard_scores else 0.0
        dominant = max(hazard_scores, key=lambda h: hazard_scores[h]) if hazard_scores else "flood"

        severity = _classify_severity(composite)

        results.append(MunicipalityRisk(
            ine_code=m.ine_code,
            name=m.name,
            province_code=province_code,
            latitude=m.latitude,
            longitude=m.longitude,
            composite_score=composite,
            dominant_hazard=dominant,
            severity=severity,
            modifiers=modifiers_detail,
            flood_score=hazard_scores.get("flood", 0.0),
            wildfire_score=hazard_scores.get("wildfire", 0.0),
            drought_score=hazard_scores.get("drought", 0.0),
            heatwave_score=hazard_scores.get("heatwave", 0.0),
            seismic_score=hazard_scores.get("seismic", 0.0),
            coldwave_score=hazard_scores.get("coldwave", 0.0),
            windstorm_score=hazard_scores.get("windstorm", 0.0),
            dana_score=hazard_scores.get("dana", 0.0),
        ))

    return results
