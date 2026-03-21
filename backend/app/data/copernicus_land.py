"""Copernicus Land Monitoring Service -- NDVI vegetation health."""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx


logger = logging.getLogger(__name__)

_TIMEOUT = 60.0
_cache: dict[str, Any] = {}
_cache_ts: dict[str, float] = {}
_CACHE_TTL = 86400  # 24h


async def fetch_ndvi(lat: float, lon: float) -> dict[str, Any]:
    """Fetch vegetation health index for a location via WMS."""
    cache_key = f"ndvi:{lat:.2f},{lon:.2f}"
    now = time.time()
    if cache_key in _cache and now - _cache_ts.get(cache_key, 0) < _CACHE_TTL:
        return _cache[cache_key]

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as client:
            resp = await client.get(
                "https://land.copernicus.vgt.vito.be/geoserver/wms",
                params={
                    "service": "WMS",
                    "request": "GetFeatureInfo",
                    "layers": "cgls:ndvi300_v2_global",
                    "query_layers": "cgls:ndvi300_v2_global",
                    "info_format": "application/json",
                    "crs": "EPSG:4326",
                    "width": 1,
                    "height": 1,
                    "bbox": f"{lon - 0.01},{lat - 0.01},{lon + 0.01},{lat + 0.01}",
                    "x": 0,
                    "y": 0,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        features = data.get("features", [])
        ndvi_value = None
        if features:
            props = features[0].get("properties", {})
            ndvi_value = props.get("GRAY_INDEX") or props.get("ndvi")

        result = {
            "ndvi": ndvi_value,
            "vegetation_status": (
                "healthy" if ndvi_value and ndvi_value > 0.5
                else "stressed" if ndvi_value and ndvi_value > 0.2
                else "bare/water" if ndvi_value is not None
                else "unavailable"
            ),
        }
        _cache[cache_key] = result
        _cache_ts[cache_key] = now
        return result
    except Exception:
        logger.exception("Failed to fetch NDVI for (%s, %s)", lat, lon)
        return _cache.get(cache_key, {})
