"""USGS earthquake catalog client -- supplements IGN data."""

from __future__ import annotations

import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_TIMEOUT = 30.0
_BASE_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"
_cache: list[dict] = []
_cache_ts: float = 0.0
_CACHE_TTL = 600


async def fetch_recent_quakes(
    min_magnitude: float = 2.0, days: int = 90
) -> list[dict[str, Any]]:
    """Fetch recent earthquakes near Spain/Iberian region from USGS."""
    global _cache, _cache_ts
    now = time.time()
    if _cache and now - _cache_ts < _CACHE_TTL:
        return _cache

    start = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as client:
            resp = await client.get(
                _BASE_URL,
                params={
                    "format": "geojson",
                    "starttime": start,
                    "minlatitude": 27,
                    "maxlatitude": 44,
                    "minlongitude": -19,
                    "maxlongitude": 5,
                    "minmagnitude": min_magnitude,
                    "orderby": "time",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        quakes = []
        for feature in data.get("features", []):
            props = feature.get("properties", {})
            coords = feature.get("geometry", {}).get("coordinates", [0, 0, 0])
            quakes.append({
                "magnitude": props.get("mag", 0),
                "depth_km": coords[2] if len(coords) > 2 else 10,
                "lat": coords[1],
                "lon": coords[0],
                "timestamp": props.get("time", ""),
                "place": props.get("place", ""),
                "felt": props.get("felt"),
                "tsunami": props.get("tsunami", 0),
            })

        _cache = quakes
        _cache_ts = now
        return quakes
    except Exception:
        logger.exception("Failed to fetch USGS earthquake data")
        return _cache or []
