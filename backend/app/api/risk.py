"""Risk API router -- risk scores, explainability, and model registry."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.ml.model_registry import get_model_registry
from app.models.province import Province
from app.models.risk_score import RiskScore
from app.schemas.risk import (
    HazardExplanation,
    ModelRegistryResponse,
    RiskExplainResponse,
    RiskMapEntry,
    RiskMapResponse,
    RiskScoreResponse,
)
from app.services.explainability_service import explain_risk

router = APIRouter()


def _zero_score(province_code: str) -> dict:
    """Return a default zero-risk response."""
    return {
        "province_code": province_code,
        "flood_score": 0.0,
        "wildfire_score": 0.0,
        "drought_score": 0.0,
        "heatwave_score": 0.0,
        "seismic_score": 0.0,
        "coldwave_score": 0.0,
        "windstorm_score": 0.0,
        "composite_score": 0.0,
        "dominant_hazard": "none",
        "severity": "low",
        "computed_at": datetime.now(timezone.utc),
    }


@router.get("/all", response_model=list[RiskScoreResponse])
async def get_all_risks(db: AsyncSession = Depends(get_db)):
    """Return the latest risk scores for all provinces."""
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


@router.get(
    "/models",
    response_model=ModelRegistryResponse,
    summary="Model registry",
    description="Return metadata for all 7 ML models in the risk pipeline.",
)
async def get_models():
    """Return the ML model inventory with metadata and accuracy metrics."""
    registry = get_model_registry()
    return ModelRegistryResponse(models=registry, total=len(registry))


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
                seismic_score=score.seismic_score if score else 0.0,
                coldwave_score=score.coldwave_score if score else 0.0,
                windstorm_score=score.windstorm_score if score else 0.0,
            )
        )

    return RiskMapResponse(
        provinces=entries,
        computed_at=datetime.now(timezone.utc),
    )


@router.get(
    "/{province_code}/explain",
    response_model=RiskExplainResponse,
    summary="Explain risk score",
    description="Return per-feature importance for each hazard model, derived from the stored features snapshot.",
)
async def explain_province_risk(
    province_code: str,
    db: AsyncSession = Depends(get_db),
):
    """Compute feature importance for the latest risk score of a province."""
    result = await db.execute(
        select(RiskScore)
        .where(RiskScore.province_code == province_code)
        .order_by(RiskScore.computed_at.desc())
        .limit(1)
    )
    score = result.scalar_one_or_none()
    if score is None:
        raise HTTPException(status_code=404, detail=f"No risk score found for province {province_code}")

    snapshot = score.features_snapshot or {}
    explanations = explain_risk(snapshot)

    hazard_scores = {
        "flood": score.flood_score,
        "wildfire": score.wildfire_score,
        "drought": score.drought_score,
        "heatwave": score.heatwave_score,
        "seismic": score.seismic_score,
        "coldwave": score.coldwave_score,
        "windstorm": score.windstorm_score,
    }

    hazards = [
        HazardExplanation(
            hazard=hazard,
            score=hazard_scores.get(hazard, 0.0),
            contributions=contributions,
        )
        for hazard, contributions in explanations.items()
    ]

    return RiskExplainResponse(
        province_code=province_code,
        computed_at=score.computed_at,
        hazards=hazards,
    )


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
