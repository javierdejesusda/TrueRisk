"""OpenAQ air quality client -- ground-level sensor network."""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from app.config import settings
from app.data._http import resilient_get, RetryableHTTPStatusError

logger = logging.getLogger(__name__)

_BASE_URL = "https://api.openaq.org/v3"
_cache: dict[str, Any] = {}
_cache_ts: dict[str, float] = {}
_CACHE_TTL = 600


async def fetch_air_quality(
    lat: float, lon: float, radius_m: int = 25000
) -> dict[str, Any]:
    """Fetch nearest air quality measurements for a location."""
    cache_key = f"{lat:.2f},{lon:.2f}"
    now = time.time()
    if cache_key in _cache and now - _cache_ts.get(cache_key, 0) < _CACHE_TTL:
        return _cache[cache_key]

    api_key = settings.openaq_api_key
    headers = {"X-API-Key": api_key} if api_key else {}

    try:
        resp = await resilient_get(
            f"{_BASE_URL}/locations",
            source="openaq",
            headers=headers,
            params={
                "coordinates": f"{lat},{lon}",
                "radius": radius_m,
                "limit": 1,
            },
        )
        resp.raise_for_status()
        data = resp.json()

        results = data.get("results", [])
        if not results:
            return {}

        location = results[0]
        location_id = location.get("id")
        station_name = location.get("name", "")

        sensor_id_to_param: dict[int, str] = {}
        for sensor in location.get("sensors", []):
            param = sensor.get("parameter", {})
            sensor_id_to_param[sensor["id"]] = param.get("name", "")

        measurements: dict[str, float] = {}
        if location_id:
            try:
                resp = await resilient_get(
                    f"{_BASE_URL}/locations/{location_id}/latest",
                    source="openaq",
                    headers=headers,
                )
                if resp.status_code == 200:
                    latest = resp.json()
                    for item in latest.get("results", []):
                        sensor_id = item.get("sensorsId")
                        value = item.get("value")
                        param_name = sensor_id_to_param.get(sensor_id, "")
                        if param_name and value is not None:
                            measurements[param_name] = value
            except (
                httpx.HTTPStatusError,
                RetryableHTTPStatusError,
                httpx.TransportError,
                httpx.TimeoutException,
            ):
                pass

        result = {
            "station_name": station_name,
            "location_id": location_id,
            "pm25": measurements.get("pm25"),
            "pm10": measurements.get("pm10"),
            "no2": measurements.get("no2"),
            "o3": measurements.get("o3"),
            "co": measurements.get("co"),
            "so2": measurements.get("so2"),
            "no": measurements.get("no"),
            "available_params": list(sensor_id_to_param.values()),
        }

        _cache[cache_key] = result
        _cache_ts[cache_key] = now
        return result
    except (
        httpx.HTTPStatusError,
        RetryableHTTPStatusError,
        httpx.TransportError,
        httpx.TimeoutException,
        ValueError,
        KeyError,
    ):
        logger.exception("Failed to fetch OpenAQ data for (%s, %s)", lat, lon)
        return _cache.get(cache_key, {})
