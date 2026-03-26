"""Climate projection API endpoints."""
from __future__ import annotations

from fastapi import APIRouter

from app.services.climate_projection_service import (
    get_province_projections,
    get_all_projections,
    get_risk_trend,
)

router = APIRouter(prefix="/api/v1/climate", tags=["climate"])


@router.get("/projections/{province_code}")
async def province_projections(province_code: str):
    """Get climate projections for a specific province."""
    return get_province_projections(province_code)


@router.get("/projections")
async def all_projections():
    """Get climate projections for all provinces."""
    return {"provinces": get_all_projections()}


@router.get("/trend/{province_code}/{hazard}")
async def risk_trend(province_code: str, hazard: str, scenario: str = "ssp585"):
    """Get projected risk trend for a hazard over decades."""
    return {"province_code": province_code, "hazard": hazard, "trend": get_risk_trend(province_code, hazard, scenario)}
