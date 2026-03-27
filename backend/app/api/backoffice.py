"""Backoffice API router -- admin-only endpoints."""

from __future__ import annotations

from datetime import timedelta

from app.utils.time import utcnow

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.alert import Alert
from app.models.province import Province
from app.models.risk_score import RiskScore
from app.models.weather_record import WeatherRecord
from app.schemas.weather import WeatherRecordResponse
from app.services.data_health_service import health_tracker

router = APIRouter()


@router.get("/stats")
async def stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Dashboard statistics for the backoffice."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    province_count = await db.scalar(select(func.count()).select_from(Province))
    active_alerts = await db.scalar(
        select(func.count()).select_from(Alert).where(Alert.is_active.is_(True))
    )

    # Find the province with the highest composite risk score
    highest_risk_result = await db.execute(
        select(RiskScore)
        .order_by(RiskScore.composite_score.desc())
        .limit(1)
    )
    highest_risk = highest_risk_result.scalar_one_or_none()

    highest_risk_province = None
    if highest_risk:
        province = await db.get(Province, highest_risk.province_code)
        highest_risk_province = {
            "province_code": highest_risk.province_code,
            "province_name": province.name if province else "Unknown",
            "composite_score": highest_risk.composite_score,
            "dominant_hazard": highest_risk.dominant_hazard,
        }

    return {
        "province_count": province_count or 0,
        "active_alerts": active_alerts or 0,
        "highest_risk_province": highest_risk_province,
    }


@router.get("/weather-records", response_model=list[WeatherRecordResponse])
async def list_weather_records(
    province: str | None = Query(default=None),
    days: int = Query(default=7, ge=1, le=365),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Paginated weather records with optional province and date filters."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    cutoff = utcnow() - timedelta(days=days)

    stmt = (
        select(WeatherRecord)
        .where(WeatherRecord.recorded_at >= cutoff)
        .order_by(WeatherRecord.recorded_at.desc())
    )

    if province is not None:
        stmt = stmt.where(WeatherRecord.province_code == province)

    stmt = stmt.offset(skip).limit(limit)

    try:
        result = await db.execute(stmt)
        return list(result.scalars().all())
    except Exception:
        return []


@router.get("/data-health")
async def get_data_health(user: User = Depends(get_current_user)):
    """Return current health status for all tracked external data sources."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return health_tracker.get_all_statuses()
