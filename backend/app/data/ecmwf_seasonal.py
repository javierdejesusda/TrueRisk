"""ECMWF seasonal forecast client -- 3-6 month climate outlook."""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_TIMEOUT = 60.0
_cache: dict[str, Any] = {}
_cache_ts: dict[str, float] = {}
_CACHE_TTL = 86400  # 24h


async def fetch_seasonal_outlook(
    lat: float, lon: float
) -> dict[str, Any]:
    """Fetch 3-month seasonal climate outlook."""
    cache_key = f"seasonal:{lat:.1f},{lon:.1f}"
    now = time.time()
    if cache_key in _cache and now - _cache_ts.get(cache_key, 0) < _CACHE_TTL:
        return _cache[cache_key]

    if not settings.cdsapi_key:
        return {}

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as client:
            resp = await client.get(
                f"{settings.cdsapi_url}/resources/seasonal-monthly-single-levels",
                headers={"Authorization": f"Bearer {settings.cdsapi_key}"},
                params={
                    "variable": "2m_temperature_anomaly,total_precipitation_anomaly",
                    "latitude": lat,
                    "longitude": lon,
                    "format": "json",
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                result = {
                    "temp_anomaly_c": data.get("temperature_anomaly"),
                    "precip_anomaly_pct": data.get("precipitation_anomaly"),
                    "forecast_months": 3,
                }
                _cache[cache_key] = result
                _cache_ts[cache_key] = now
                return result
    except Exception:
        logger.exception("Failed to fetch ECMWF seasonal for (%s, %s)", lat, lon)

    return _cache.get(cache_key, {})
