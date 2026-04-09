"""Weather service -- bridges Open-Meteo data with the database."""

from __future__ import annotations

import logging
from datetime import timedelta

from app.utils.time import utcnow

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data import open_meteo
from app.models.province import Province
from app.models.weather_record import WeatherRecord
from app.utils.cache import weather_cache, weather_singleflight

logger = logging.getLogger(__name__)

# Negative-cache TTL: when an upstream fetch fails we briefly cache the
# fallback so we do not hammer Open-Meteo during an outage / rate limit.
_NEGATIVE_TTL_SECONDS = 60
# Positive cache TTLs
_CURRENT_TTL_SECONDS = 900     # 15 minutes — Open-Meteo updates ~hourly
_FORECAST_TTL_SECONDS = 1800   # 30 minutes — forecast doesn't shift often
_ALL_TTL_SECONDS = 900         # 15 minutes — matches /current


async def _get_province(db: AsyncSession, province_code: str) -> Province:
    province = await db.get(Province, province_code)
    if province is None:
        raise ValueError(f"Province {province_code} not found")
    return province


async def _fallback_from_db(
    db: AsyncSession, province_code: str
) -> dict:
    """Return the most recent persisted WeatherRecord as a fallback payload."""
    result = await db.execute(
        select(WeatherRecord)
        .where(WeatherRecord.province_code == province_code)
        .order_by(WeatherRecord.recorded_at.desc())
        .limit(1)
    )
    record = result.scalar_one_or_none()
    if record is None:
        return {}
    return {
        "temperature": record.temperature,
        "humidity": record.humidity,
        "precipitation": record.precipitation,
        "wind_speed": record.wind_speed,
        "wind_direction": record.wind_direction,
        "wind_gusts": record.wind_gusts,
        "pressure": record.pressure,
        "soil_moisture": record.soil_moisture,
        "uv_index": record.uv_index,
        "dew_point": record.dew_point,
        "cloud_cover": record.cloud_cover,
        "province_code": province_code,
        "recorded_at": record.recorded_at.isoformat(),
        "cached": True,
    }


async def get_current_weather(
    db: AsyncSession, province_code: str
) -> dict:
    """Fetch current weather from Open-Meteo, persist a WeatherRecord, and return data.

    Concurrent requests for the same province coalesce into a single upstream
    call via ``weather_singleflight`` — this prevents thundering-herd 429s
    when many users hit the same endpoint on a cold cache.

    The singleflight closure deliberately does NOT touch the database: it
    only talks to the upstream API. DB persistence and fallback reads use
    the caller's own ``db`` session so a cancelled first-caller cannot
    propagate a session-closed error to every waiter (each waiter has its
    own session, and the cache is populated with the remote payload only).
    """
    cache_key = f"weather:current:{province_code}"
    cached = weather_cache.get(cache_key)
    if cached is not None:
        return cached

    province = await _get_province(db, province_code)
    lat, lon = province.latitude, province.longitude

    async def _fetch_remote() -> dict:
        # Re-check cache inside the singleflight window — a prior waiter may
        # have populated it already.
        hit = weather_cache.get(cache_key)
        if hit is not None:
            return hit
        data = await open_meteo.fetch_current(lat, lon)
        if data:
            data["province_code"] = province_code
            data["recorded_at"] = utcnow().isoformat()
            weather_cache.set(cache_key, data, ttl=_CURRENT_TTL_SECONDS)
            return data
        # Negative-cache a sentinel so repeated cold-cache hits do not
        # re-trigger the upstream during an outage. The actual fallback
        # payload is built from the caller's own session below.
        weather_cache.set(cache_key, {}, ttl=_NEGATIVE_TTL_SECONDS)
        return {}

    data = await weather_singleflight.do(cache_key, _fetch_remote)

    if not data:
        # Empty remote response — fall back to the caller's own session.
        return await _fallback_from_db(db, province_code)

    # Persist a fresh WeatherRecord using THIS request's session so we
    # never reuse another caller's (possibly cancelled) transaction.
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
        recorded_at=utcnow(),
    )
    try:
        db.add(record)
        await db.commit()
    except Exception:  # noqa: BLE001 — persistence is best-effort, never fail the request
        logger.exception("Failed to persist WeatherRecord for %s", province_code)
        await db.rollback()
    return data


async def get_forecast(
    db: AsyncSession, province_code: str
) -> dict:
    """Fetch hourly + daily forecast from Open-Meteo with singleflight coalescing.

    Singleflight closure only talks to the upstream API so a cancelled
    first caller cannot taint the shared future for other waiters.
    """
    cache_key = f"weather:forecast:{province_code}"
    cached = weather_cache.get(cache_key)
    if cached is not None:
        return cached

    province = await _get_province(db, province_code)
    lat, lon = province.latitude, province.longitude

    async def _fetch_remote() -> dict:
        hit = weather_cache.get(cache_key)
        if hit is not None:
            return hit
        forecast = await open_meteo.fetch_forecast(lat, lon)
        hourly = forecast.get("hourly", [])
        daily = forecast.get("daily", [])
        result = {
            "province_code": province_code,
            "hourly": hourly,
            "daily": daily,
        }
        # Negative-cache empty responses briefly to absorb upstream failures.
        ttl = _FORECAST_TTL_SECONDS if (hourly or daily) else _NEGATIVE_TTL_SECONDS
        weather_cache.set(cache_key, result, ttl=ttl)
        return result

    return await weather_singleflight.do(cache_key, _fetch_remote)


async def get_all_current(db: AsyncSession) -> list[dict]:
    """Fetch current weather for all 52 Spanish provinces with coalescing.

    The province list is loaded via the caller's session (fast, indexed
    PK lookup), then the singleflight handles only the upstream fetch.
    """
    cache_key = "weather:all"
    cached = weather_cache.get(cache_key)
    if cached is not None:
        return cached

    # Load the province list via the caller's session. This is cheap and
    # should never fail; it is not shared with the singleflight.
    result = await db.execute(select(Province))
    provinces = list(result.scalars().all())
    province_list = [
        {"code": p.ine_code, "lat": p.latitude, "lon": p.longitude}
        for p in provinces
    ]
    name_by_code = {p.ine_code: p.name for p in provinces}

    async def _fetch_remote() -> list[dict]:
        hit = weather_cache.get(cache_key)
        if hit is not None:
            return hit
        weather_map = await open_meteo.fetch_all_provinces(province_list)
        output: list[dict] = []
        for code in name_by_code:
            weather = weather_map.get(code, {})
            weather["province_code"] = code
            weather["province_name"] = name_by_code[code]
            output.append(weather)
        ttl = _ALL_TTL_SECONDS if weather_map else _NEGATIVE_TTL_SECONDS
        weather_cache.set(cache_key, output, ttl=ttl)
        return output

    return await weather_singleflight.do(cache_key, _fetch_remote)


async def get_weather_history(
    db: AsyncSession, province_code: str, days: int = 30
) -> list[WeatherRecord]:
    """Query stored WeatherRecords from the database."""
    cutoff = utcnow() - timedelta(days=days)
    result = await db.execute(
        select(WeatherRecord)
        .where(
            WeatherRecord.province_code == province_code,
            WeatherRecord.recorded_at >= cutoff,
        )
        .order_by(WeatherRecord.recorded_at.desc())
    )
    return list(result.scalars().all())
