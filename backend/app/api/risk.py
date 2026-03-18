"""Risk API router -- placeholder endpoints until ML models are integrated."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.province import Province
from app.models.risk_score import RiskScore
from app.models.user import User
from app.schemas.risk import (
    RiskMapEntry,
    RiskMapResponse,
    RiskScoreResponse,
    UserRiskResponse,
)

router = APIRouter()


def _zero_score(province_code: str) -> dict:
    """Return a default zero-risk response."""
    return {
        "province_code": province_code,
        "flood_score": 0.0,
        "wildfire_score": 0.0,
        "drought_score": 0.0,
        "heatwave_score": 0.0,
        "composite_score": 0.0,
        "dominant_hazard": "none",
        "severity": "low",
        "computed_at": datetime.now(timezone.utc),
    }


@router.get("/{province_code}", response_model=RiskScoreResponse)
async def get_risk(
    province_code: str,
    db: AsyncSession = Depends(get_db),
):
    """Return the latest risk score for a province."""
    result = await db.execute(
        select(RiskScore)
        .where(RiskScore.province_code == province_code)
        .order_by(RiskScore.computed_at.desc())
        .limit(1)
    )
    score = result.scalar_one_or_none()
    if score is None:
        return _zero_score(province_code)
    return score


@router.get("/all", response_model=list[RiskScoreResponse])
async def get_all_risks(db: AsyncSession = Depends(get_db)):
    """Return the latest risk scores for all provinces."""
    # Use a subquery to get the latest score per province
    from sqlalchemy import func

    subq = (
        select(
            RiskScore.province_code,
            func.max(RiskScore.computed_at).label("latest"),
        )
        .group_by(RiskScore.province_code)
        .subquery()
    )
    result = await db.execute(
        select(RiskScore).join(
            subq,
            (RiskScore.province_code == subq.c.province_code)
            & (RiskScore.computed_at == subq.c.latest),
        )
    )
    scores = result.scalars().all()
    return list(scores) if scores else []


@router.get("/map", response_model=RiskMapResponse)
async def get_risk_map(db: AsyncSession = Depends(get_db)):
    """Return risk map data (province coordinates + risk scores)."""
    provinces_result = await db.execute(select(Province))
    provinces = {p.ine_code: p for p in provinces_result.scalars().all()}

    from sqlalchemy import func

    subq = (
        select(
            RiskScore.province_code,
            func.max(RiskScore.computed_at).label("latest"),
        )
        .group_by(RiskScore.province_code)
        .subquery()
    )
    scores_result = await db.execute(
        select(RiskScore).join(
            subq,
            (RiskScore.province_code == subq.c.province_code)
            & (RiskScore.computed_at == subq.c.latest),
        )
    )
    scores = {s.province_code: s for s in scores_result.scalars().all()}

    entries: list[RiskMapEntry] = []
    for code, prov in provinces.items():
        score = scores.get(code)
        entries.append(
            RiskMapEntry(
                province_code=code,
                province_name=prov.name,
                latitude=prov.latitude,
                longitude=prov.longitude,
                composite_score=score.composite_score if score else 0.0,
                dominant_hazard=score.dominant_hazard if score else "none",
                severity=score.severity if score else "low",
                flood_score=score.flood_score if score else 0.0,
                wildfire_score=score.wildfire_score if score else 0.0,
                drought_score=score.drought_score if score else 0.0,
                heatwave_score=score.heatwave_score if score else 0.0,
            )
        )

    return RiskMapResponse(
        provinces=entries,
        computed_at=datetime.now(timezone.utc),
    )


@router.get("/user", response_model=UserRiskResponse)
async def get_user_risk(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return risk information for the authenticated user's province."""
    province = await db.get(Province, user.province_code)
    if province is None:
        raise HTTPException(status_code=404, detail="Province not found")

    result = await db.execute(
        select(RiskScore)
        .where(RiskScore.province_code == user.province_code)
        .order_by(RiskScore.computed_at.desc())
        .limit(1)
    )
    score = result.scalar_one_or_none()

    # Simple vulnerability heuristic based on user profile
    vulnerability = 0.0
    if user.residence_type in ("planta_baja", "sotano"):
        vulnerability += 0.3
    if user.special_needs:
        vulnerability += 0.2 * len(user.special_needs)
    vulnerability = min(vulnerability, 1.0)

    if score:
        return UserRiskResponse(
            province_code=score.province_code,
            flood_score=score.flood_score,
            wildfire_score=score.wildfire_score,
            drought_score=score.drought_score,
            heatwave_score=score.heatwave_score,
            composite_score=score.composite_score,
            dominant_hazard=score.dominant_hazard,
            severity=score.severity,
            computed_at=score.computed_at,
            province_name=province.name,
            user_vulnerability_score=vulnerability,
        )

    return UserRiskResponse(
        **_zero_score(user.province_code),
        province_name=province.name,
        user_vulnerability_score=vulnerability,
    )
