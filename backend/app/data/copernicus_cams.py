"""Copernicus Atmosphere Monitoring Service -- European AQ forecasts."""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_TIMEOUT = 30.0
_BASE_URL = "https://regional.atmosphere.copernicus.eu/api/v1"
_cache: dict[str, Any] = {}
_cache_ts: dict[str, float] = {}
_CACHE_TTL = 3600  # 1h


async def fetch_air_quality_forecast(
    lat: float, lon: float
) -> dict[str, Any]:
    """Fetch CAMS air quality forecast for a location."""
    cache_key = f"cams:{lat:.1f},{lon:.1f}"
    now = time.time()
    if cache_key in _cache and now - _cache_ts.get(cache_key, 0) < _CACHE_TTL:
        return _cache[cache_key]

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as client:
            resp = await client.get(
                f"{_BASE_URL}/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "variables": "pm25,pm10,o3,no2,co",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        result = {
            "pm25_forecast": data.get("pm25"),
            "pm10_forecast": data.get("pm10"),
            "o3_forecast": data.get("o3"),
            "no2_forecast": data.get("no2"),
            "co_forecast": data.get("co"),
        }
        _cache[cache_key] = result
        _cache_ts[cache_key] = now
        return result
    except Exception:
        logger.exception("Failed to fetch CAMS AQ forecast for (%s, %s)", lat, lon)
        return _cache.get(cache_key, {})
