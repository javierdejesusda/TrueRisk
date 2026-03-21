"""NASA POWER solar radiation and agricultural meteorology client."""

from __future__ import annotations

import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_TIMEOUT = 30.0
_BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
_cache: dict[str, Any] = {}
_cache_ts: dict[str, float] = {}
_CACHE_TTL = 86400  # 24h


async def fetch_solar_and_agmet(
    lat: float, lon: float, days_back: int = 30
) -> dict[str, Any]:
    """Fetch solar radiation and agricultural meteorology data."""
    cache_key = f"power:{lat:.2f},{lon:.2f}"
    now = time.time()
    if cache_key in _cache and now - _cache_ts.get(cache_key, 0) < _CACHE_TTL:
        return _cache[cache_key]

    end = datetime.now(timezone.utc) - timedelta(days=2)  # 2-day data lag
    start = end - timedelta(days=days_back)

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as client:
            resp = await client.get(
                _BASE_URL,
                params={
                    "parameters": "ALLSKY_SFC_SW_DWN,T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,WS2M",
                    "community": "AG",
                    "longitude": lon,
                    "latitude": lat,
                    "start": start.strftime("%Y%m%d"),
                    "end": end.strftime("%Y%m%d"),
                    "format": "JSON",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        params = data.get("properties", {}).get("parameter", {})
        solar = params.get("ALLSKY_SFC_SW_DWN", {})
        solar_values = [v for v in solar.values() if v != -999]

        result = {
            "solar_irradiance_avg": (
                sum(solar_values) / len(solar_values) if solar_values else None
            ),
            "solar_irradiance_max": max(solar_values) if solar_values else None,
            "data_points": len(solar_values),
        }
        _cache[cache_key] = result
        _cache_ts[cache_key] = now
        return result
    except Exception:
        logger.exception("Failed to fetch NASA POWER for (%s, %s)", lat, lon)
        return _cache.get(cache_key, {})
