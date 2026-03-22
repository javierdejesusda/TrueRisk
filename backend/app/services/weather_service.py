"""Weather service -- bridges Open-Meteo data with the database."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data import open_meteo
from app.models.province import Province
from app.models.weather_record import WeatherRecord

logger = logging.getLogger(__name__)


async def _get_province(db: AsyncSession, province_code: str) -> Province:
    province = await db.get(Province, province_code)
    if province is None:
        raise ValueError(f"Province {province_code} not found")
    return province


async def get_current_weather(
    db: AsyncSession, province_code: str
) -> dict:
    """Fetch current weather from Open-Meteo, persist a WeatherRecord, and return data."""
    province = await _get_province(db, province_code)

    data = await open_meteo.fetch_current(province.latitude, province.longitude)
    if not data:
        return {}

    now = datetime.utcnow()
    record = WeatherRecord(
        province_code=province_code,
        source="open_meteo",
        temperature=data.get("temperature", 0.0) or 0.0,
        humidity=data.get("humidity", 0.0) or 0.0,
        precipitation=data.get("precipitation", 0.0) or 0.0,
        wind_speed=data.get("wind_speed"),
        wind_direction=data.get("wind_direction"),
        wind_gusts=data.get("wind_gusts"),
        pressure=data.get("pressure"),
        soil_moisture=data.get("soil_moisture"),
        uv_index=data.get("uv_index"),
        dew_point=data.get("dew_point"),
        cloud_cover=data.get("cloud_cover"),
        raw_data=data,
        recorded_at=now,
    )
    db.add(record)
    await db.commit()

    data["province_code"] = province_code
    data["recorded_at"] = now.isoformat()
    return data


async def get_forecast(
    db: AsyncSession, province_code: str
) -> dict:
    """Fetch hourly + daily forecast from Open-Meteo."""
    province = await _get_province(db, province_code)
    forecast = await open_meteo.fetch_forecast(province.latitude, province.longitude)
    return {
        "province_code": province_code,
        "hourly": forecast.get("hourly", []),
        "daily": forecast.get("daily", []),
    }


async def get_all_current(db: AsyncSession) -> list[dict]:
    """Fetch current weather for all 52 Spanish provinces."""
    result = await db.execute(select(Province))
    provinces = result.scalars().all()

    province_list = [
        {"code": p.ine_code, "lat": p.latitude, "lon": p.longitude}
        for p in provinces
    ]

    weather_map = await open_meteo.fetch_all_provinces(province_list)

    output: list[dict] = []
    for p in provinces:
        weather = weather_map.get(p.ine_code, {})
        weather["province_code"] = p.ine_code
        weather["province_name"] = p.name
        output.append(weather)

    return output


async def get_weather_history(
    db: AsyncSession, province_code: str, days: int = 30
) -> list[WeatherRecord]:
    """Query stored WeatherRecords from the database."""
    cutoff = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(WeatherRecord)
        .where(
            WeatherRecord.province_code == province_code,
            WeatherRecord.recorded_at >= cutoff,
        )
        .order_by(WeatherRecord.recorded_at.desc())
    )
    return list(result.scalars().all())
