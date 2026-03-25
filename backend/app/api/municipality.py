"""Municipality-level risk and vulnerability endpoints."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db
from app.models.municipality import Municipality
from app.models.risk_score import RiskScore
from app.services.municipality_risk_service import disaggregate_province_risk

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/municipalities", tags=["municipalities"])


@router.get("/{province_code}/risk")
async def get_municipality_risk(
    province_code: str, db: AsyncSession = Depends(get_db)
):
    """Return disaggregated risk scores for all municipalities in a province."""
    # Get latest province risk
    stmt = (
        select(RiskScore)
        .where(RiskScore.province_code == province_code)
        .order_by(RiskScore.computed_at.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    risk = result.scalar_one_or_none()
    if not risk:
        return {"municipalities": [], "province_code": province_code}

    province_risk = {
        "flood_score": risk.flood_score,
        "wildfire_score": risk.wildfire_score,
        "drought_score": risk.drought_score,
        "heatwave_score": risk.heatwave_score,
        "seismic_score": risk.seismic_score,
        "coldwave_score": risk.coldwave_score,
        "windstorm_score": risk.windstorm_score,
        "dana_score": risk.dana_score,
    }
    municipalities = await disaggregate_province_risk(db, province_code, province_risk)
    return {
        "province_code": province_code,
        "computed_at": risk.computed_at.isoformat() if risk.computed_at else None,
        "municipalities": [
            {
                "ine_code": m.ine_code,
                "name": m.name,
                "latitude": m.latitude,
                "longitude": m.longitude,
                "composite_score": m.composite_score,
                "dominant_hazard": m.dominant_hazard,
                "severity": m.severity,
                "flood_score": m.flood_score,
                "wildfire_score": m.wildfire_score,
                "drought_score": m.drought_score,
                "heatwave_score": m.heatwave_score,
                "seismic_score": m.seismic_score,
                "coldwave_score": m.coldwave_score,
                "windstorm_score": m.windstorm_score,
                "dana_score": m.dana_score,
            }
            for m in municipalities
        ],
    }


@router.get("/{province_code}/vulnerability")
async def get_vulnerability_heatmap(
    province_code: str, db: AsyncSession = Depends(get_db)
):
    """Return municipality-level vulnerability index for map overlay."""
    stmt = select(Municipality).where(Municipality.province_code == province_code)
    result = await db.execute(stmt)
    municipalities = result.scalars().all()

    return {
        "province_code": province_code,
        "municipalities": [
            {
                "ine_code": m.ine_code,
                "name": m.name,
                "latitude": m.latitude,
                "longitude": m.longitude,
                "vulnerability_index": _compute_vulnerability_index(m),
                "elderly_pct": getattr(m, 'elderly_pct', None),
                "elevation_m": m.elevation_m,
                "is_coastal": m.is_coastal,
                "risk_factors": _identify_risk_factors(m),
            }
            for m in municipalities
        ],
    }


def _compute_vulnerability_index(m: Municipality) -> float:
    """Compute 0-1 vulnerability index from municipality attributes."""
    score = 0.0
    elderly = getattr(m, 'elderly_pct', None)
    if elderly and elderly > 20:
        score += min(0.4, (elderly - 20) / 30 * 0.4)
    if m.elevation_m and m.elevation_m < 50:
        score += 0.15  # Low elevation = flood vulnerable
    if m.is_coastal:
        score += 0.1
    land_use = getattr(m, 'land_use_type', None)
    if land_use == "urban":
        score += 0.1  # Urban heat island
    distance_river = getattr(m, 'distance_river_km', None)
    if distance_river is not None and distance_river < 2:
        score += 0.15
    return round(min(1.0, score), 2)


def _identify_risk_factors(m: Municipality) -> list[str]:
    """Identify human-readable risk factors for a municipality."""
    factors = []
    elderly = getattr(m, 'elderly_pct', None)
    if elderly and elderly > 25:
        factors.append(f"High elderly population ({elderly:.0f}%)")
    if m.elevation_m and m.elevation_m < 50:
        factors.append(f"Low elevation ({m.elevation_m:.0f}m)")
    if m.is_coastal:
        factors.append("Coastal location")
    land_use = getattr(m, 'land_use_type', None)
    if land_use == "forest":
        factors.append("Forest area (wildfire risk)")
    distance_river = getattr(m, 'distance_river_km', None)
    if distance_river is not None and distance_river < 2:
        factors.append(f"Near river ({distance_river:.1f}km)")
    return factors
