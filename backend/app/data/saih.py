"""Spanish reservoir level client using SAIH Ebro REST API."""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_TIMEOUT = 30.0
_cache: dict[str, Any] = {}
_cache_ts: dict[str, float] = {}
_CACHE_TTL = 3600  # 1h — reservoir data updates infrequently

_FALLBACK_RESERVOIRS: list[dict[str, Any]] = [
    {"name": "Mequinenza", "basin": "Ebro", "capacity_pct": 65, "volume_hm3": 1020, "total_capacity_hm3": 1534, "stale": True},
    {"name": "Canelles", "basin": "Ebro", "capacity_pct": 58, "volume_hm3": 412, "total_capacity_hm3": 679, "stale": True},
    {"name": "El Grado", "basin": "Ebro", "capacity_pct": 72, "volume_hm3": 320, "total_capacity_hm3": 399, "stale": True},
    {"name": "Yesa", "basin": "Ebro", "capacity_pct": 55, "volume_hm3": 246, "total_capacity_hm3": 447, "stale": True},
    {"name": "Mediano", "basin": "Ebro", "capacity_pct": 61, "volume_hm3": 271, "total_capacity_hm3": 436, "stale": True},
]


async def fetch_reservoir_levels() -> list[dict[str, Any]]:
    """Fetch reservoir capacity levels from SAIH Ebro basin (real REST API)."""
    cache_key = "reservoirs:all"
    now = time.time()
    if cache_key in _cache and now - _cache_ts.get(cache_key, 0) < _CACHE_TTL:
        return _cache[cache_key]

    try:
        async with httpx.AsyncClient(
            timeout=_TIMEOUT, follow_redirects=True
        ) as client:
            resp = await client.get(
                "https://www.saihebro.com/saihebro/rest/embalse/datos",
                headers={"Accept": "application/json"},
            )
            if resp.status_code == 200:
                data = resp.json()
                reservoirs = []
                items = data if isinstance(data, list) else data.get("data", [])
                for item in items if isinstance(items, list) else []:
                    reservoirs.append({
                        "name": item.get("nombre", ""),
                        "basin": "Ebro",
                        "capacity_pct": item.get("porcentaje", 0),
                        "volume_hm3": item.get("volumen", 0),
                        "total_capacity_hm3": item.get("capacidad", 0),
                    })
                if reservoirs:
                    _cache[cache_key] = reservoirs
                    _cache_ts[cache_key] = now
                    return reservoirs
            else:
                logger.warning(
                    "SAIH API returned status %d: %s",
                    resp.status_code,
                    resp.text[:200],
                )

        return _cache.get(cache_key, _FALLBACK_RESERVOIRS)
    except Exception:
        logger.exception("Failed to fetch reservoir levels")
        return _cache.get(cache_key, _FALLBACK_RESERVOIRS)
