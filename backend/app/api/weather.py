"""Weather API router."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas.weather import (
    CurrentWeather,
    ForecastResponse,
    WeatherRecordResponse,
)
from app.services import weather_service

router = APIRouter()


@router.get("/current/{province_code}", response_model=CurrentWeather)
async def current_weather(
    province_code: str,
    db: AsyncSession = Depends(get_db),
):
    """Get current weather conditions for a province."""
    try:
        data = await weather_service.get_current_weather(db, province_code)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    if not data:
        raise HTTPException(status_code=502, detail="Could not fetch weather data")
    return data


@router.get("/forecast/{province_code}", response_model=ForecastResponse)
async def forecast(
    province_code: str,
    db: AsyncSession = Depends(get_db),
):
    """Get 7-day weather forecast for a province."""
    try:
        data = await weather_service.get_forecast(db, province_code)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return data


@router.get(
    "/history/{province_code}",
    response_model=list[WeatherRecordResponse],
)
async def weather_history(
    province_code: str,
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    """Get historical weather records from the database."""
    try:
        records = await weather_service.get_weather_history(db, province_code, days)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch weather history")
    return records


@router.get("/all")
async def all_current(db: AsyncSession = Depends(get_db)):
    """Get current weather for all 52 Spanish provinces."""
    return await weather_service.get_all_current(db)
