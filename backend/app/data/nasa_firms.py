"""NASA FIRMS active fire hotspot client (VIIRS/MODIS satellite data)."""

from __future__ import annotations

import csv
import io
import logging
import time
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_TIMEOUT = 30.0
_BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"
_cache: list[dict[str, Any]] = []
_cache_ts: float = 0.0
_CACHE_TTL = 600

_SPAIN_BBOX = {"lat_min": 27.0, "lat_max": 44.0, "lon_min": -19.0, "lon_max": 5.0}


async def fetch_active_fires(
    map_key: str | None = None, source: str = "VIIRS_SNPP_NRT", days: int = 1
) -> list[dict[str, Any]]:
    """Fetch active fire hotspots for Spain from NASA FIRMS."""
    global _cache, _cache_ts
    now = time.time()
    if _cache and now - _cache_ts < _CACHE_TTL:
        return _cache

    key = map_key or settings.firms_map_key
    if not key:
        return []

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as client:
            resp = await client.get(f"{_BASE_URL}/{key}/{source}/world/{days}")
            resp.raise_for_status()

        fires = []
        reader = csv.DictReader(io.StringIO(resp.text))
        for row in reader:
            try:
                lat = float(row.get("latitude", 0))
                lon = float(row.get("longitude", 0))
            except (TypeError, ValueError):
                continue
            if not (
                _SPAIN_BBOX["lat_min"] <= lat <= _SPAIN_BBOX["lat_max"]
                and _SPAIN_BBOX["lon_min"] <= lon <= _SPAIN_BBOX["lon_max"]
            ):
                continue
            fires.append({
                "lat": lat,
                "lon": lon,
                "brightness": float(row.get("brightness", 0)),
                "confidence": row.get("confidence", ""),
                "frp": float(row.get("frp", 0)),
                "acq_date": row.get("acq_date", ""),
                "acq_time": row.get("acq_time", ""),
                "satellite": row.get("satellite", ""),
            })

        _cache = fires
        _cache_ts = now
        return fires
    except Exception:
        logger.exception("Failed to fetch NASA FIRMS data")
        return _cache or []
