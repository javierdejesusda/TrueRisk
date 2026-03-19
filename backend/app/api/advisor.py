"""AI Advisor context API router."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.alert import Alert
from app.models.province import Province
from app.models.risk_score import RiskScore
from app.models.weather_record import WeatherRecord

router = APIRouter()


@router.get("/context/{province_code}")
async def get_advisor_context(
    province_code: str,
    db: AsyncSession = Depends(get_db),
):
    """Return aggregated context for the AI advisor: province info, risk, alerts, weather."""
    # Province name
    province = await db.get(Province, province_code)
    if province is None:
        raise HTTPException(status_code=404, detail="Province not found")

    # Latest risk scores
    result = await db.execute(
        select(RiskScore)
        .where(RiskScore.province_code == province_code)
        .order_by(RiskScore.computed_at.desc())
        .limit(1)
    )
    risk = result.scalar_one_or_none()

    risk_scores = None
    if risk:
        risk_scores = {
            "composite_score": risk.composite_score,
            "dominant_hazard": risk.dominant_hazard,
            "severity": risk.severity,
            "flood_score": risk.flood_score,
            "wildfire_score": risk.wildfire_score,
            "drought_score": risk.drought_score,
            "heatwave_score": risk.heatwave_score,
            "seismic_score": risk.seismic_score,
            "coldwave_score": risk.coldwave_score,
            "windstorm_score": risk.windstorm_score,
            "computed_at": risk.computed_at.isoformat() if risk.computed_at else None,
        }

    # Active alerts
    alerts_result = await db.execute(
        select(Alert).where(
            Alert.province_code == province_code,
            Alert.is_active == True,  # noqa: E712
        )
    )
    alerts = [
        {
            "id": a.id,
            "severity": a.severity,
            "hazard_type": a.hazard_type,
            "title": a.title,
            "description": a.description,
            "onset": a.onset.isoformat() if a.onset else None,
            "expires": a.expires.isoformat() if a.expires else None,
        }
        for a in alerts_result.scalars().all()
    ]

    # Latest weather record
    weather_result = await db.execute(
        select(WeatherRecord)
        .where(WeatherRecord.province_code == province_code)
        .order_by(WeatherRecord.recorded_at.desc())
        .limit(1)
    )
    weather_rec = weather_result.scalar_one_or_none()

    weather = None
    if weather_rec:
        weather = {
            "temperature": weather_rec.temperature,
            "humidity": weather_rec.humidity,
            "precipitation": weather_rec.precipitation,
            "wind_speed": weather_rec.wind_speed,
            "wind_gusts": weather_rec.wind_gusts,
            "pressure": weather_rec.pressure,
            "recorded_at": weather_rec.recorded_at.isoformat() if weather_rec.recorded_at else None,
        }

    return {
        "province_name": province.name,
        "province_code": province_code,
        "risk_scores": risk_scores,
        "alerts": alerts,
        "weather": weather,
    }
