"""Async client for the Open-Meteo weather APIs."""

from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_TIMEOUT = 30.0
_BASE_URL = "https://api.open-meteo.com/v1/forecast"
_FLOOD_URL = "https://flood-api.open-meteo.com/v1/flood"
_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

_CURRENT_PARAMS = (
    "temperature_2m,relative_humidity_2m,precipitation,"
    "wind_speed_10m,wind_direction_10m,wind_gusts_10m,"
    "surface_pressure,cloud_cover,uv_index,dew_point_2m"
)

_HOURLY_PARAMS = (
    "temperature_2m,relative_humidity_2m,precipitation,"
    "wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover"
)

_DAILY_PARAMS = (
    "temperature_2m_max,temperature_2m_min,precipitation_sum,"
    "wind_speed_10m_max,uv_index_max,et0_fao_evapotranspiration"
)


async def fetch_current(lat: float, lon: float) -> dict[str, Any]:
    """Fetch current weather conditions for a single location."""
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(
                _BASE_URL,
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "current": _CURRENT_PARAMS,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        current = data.get("current", {})
        return {
            "temperature": current.get("temperature_2m"),
            "humidity": current.get("relative_humidity_2m"),
            "precipitation": current.get("precipitation", 0.0),
            "wind_speed": current.get("wind_speed_10m"),
            "wind_direction": current.get("wind_direction_10m"),
            "wind_gusts": current.get("wind_gusts_10m"),
            "pressure": current.get("surface_pressure"),
            "cloud_cover": current.get("cloud_cover"),
            "uv_index": current.get("uv_index"),
            "dew_point": current.get("dew_point_2m"),
            "time": current.get("time"),
        }
    except Exception:
        logger.exception("Failed to fetch current weather for (%s, %s)", lat, lon)
        return {}


async def fetch_forecast(
    lat: float, lon: float, days: int = 7
) -> dict[str, Any]:
    """Fetch hourly + daily forecast for a single location."""
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(
                _BASE_URL,
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "hourly": _HOURLY_PARAMS,
                    "daily": _DAILY_PARAMS,
                    "forecast_days": days,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        raw_hourly = data.get("hourly", {})
        raw_daily = data.get("daily", {})

        times = raw_hourly.get("time", [])
        hourly: list[dict[str, Any]] = []
        for i, t in enumerate(times):
            hourly.append({
                "time": t,
                "temperature": raw_hourly.get("temperature_2m", [None])[i],
                "humidity": raw_hourly.get("relative_humidity_2m", [None])[i],
                "precipitation": raw_hourly.get("precipitation", [0.0])[i],
                "wind_speed": raw_hourly.get("wind_speed_10m", [None])[i],
                "wind_direction": raw_hourly.get("wind_direction_10m", [None])[i],
                "pressure": raw_hourly.get("surface_pressure", [None])[i],
                "cloud_cover": raw_hourly.get("cloud_cover", [None])[i],
            })

        dates = raw_daily.get("time", [])
        daily: list[dict[str, Any]] = []
        for i, d in enumerate(dates):
            daily.append({
                "date": d,
                "temperature_max": raw_daily.get("temperature_2m_max", [None])[i],
                "temperature_min": raw_daily.get("temperature_2m_min", [None])[i],
                "precipitation_sum": raw_daily.get("precipitation_sum", [0.0])[i],
                "wind_speed_max": raw_daily.get("wind_speed_10m_max", [None])[i],
                "uv_index_max": raw_daily.get("uv_index_max", [None])[i],
                "et0_evapotranspiration": raw_daily.get(
                    "et0_fao_evapotranspiration", [None]
                )[i],
            })

        return {"hourly": hourly, "daily": daily}
    except Exception:
        logger.exception("Failed to fetch forecast for (%s, %s)", lat, lon)
        return {"hourly": [], "daily": []}


async def fetch_all_provinces(
    provinces: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    """Fetch current weather for many provinces using batched requests.

    Open-Meteo supports comma-separated latitude/longitude params.
    We split into batches of 50 locations per request.
    """
    result: dict[str, dict[str, Any]] = {}
    batch_size = 50

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            for start in range(0, len(provinces), batch_size):
                batch = provinces[start : start + batch_size]
                lats = ",".join(str(p["lat"]) for p in batch)
                lons = ",".join(str(p["lon"]) for p in batch)

                resp = await client.get(
                    _BASE_URL,
                    params={
                        "latitude": lats,
                        "longitude": lons,
                        "current": _CURRENT_PARAMS,
                    },
                )
                resp.raise_for_status()
                data = resp.json()

                # Single location returns a dict; multiple returns a list
                items = data if isinstance(data, list) else [data]
                for province, item in zip(batch, items):
                    current = item.get("current", {})
                    result[province["code"]] = {
                        "temperature": current.get("temperature_2m"),
                        "humidity": current.get("relative_humidity_2m"),
                        "precipitation": current.get("precipitation", 0.0),
                        "wind_speed": current.get("wind_speed_10m"),
                        "wind_direction": current.get("wind_direction_10m"),
                        "wind_gusts": current.get("wind_gusts_10m"),
                        "pressure": current.get("surface_pressure"),
                        "cloud_cover": current.get("cloud_cover"),
                        "uv_index": current.get("uv_index"),
                        "dew_point": current.get("dew_point_2m"),
                        "time": current.get("time"),
                    }
    except Exception:
        logger.exception("Failed to fetch weather for province batch")

    return result


async def fetch_flood_forecast(lat: float, lon: float) -> dict[str, Any]:
    """Fetch river-discharge based flood forecast."""
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(
                _FLOOD_URL,
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "daily": "river_discharge",
                },
            )
            resp.raise_for_status()
            return resp.json()
    except Exception:
        logger.exception("Failed to fetch flood forecast for (%s, %s)", lat, lon)
        return {}


async def fetch_historical(
    lat: float, lon: float, start_date: str, end_date: str
) -> dict[str, Any]:
    """Fetch historical daily weather data from Open-Meteo archive."""
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(
                _ARCHIVE_URL,
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "start_date": start_date,
                    "end_date": end_date,
                    "daily": _DAILY_PARAMS,
                },
            )
            resp.raise_for_status()
            return resp.json()
    except Exception:
        logger.exception(
            "Failed to fetch historical data for (%s, %s) %s..%s",
            lat, lon, start_date, end_date,
        )
        return {}
