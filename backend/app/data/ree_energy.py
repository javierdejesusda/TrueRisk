"""Red Electrica Espanola (REE) energy grid API client."""

from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_TIMEOUT = 30.0
_BASE_URL = "https://apidatos.ree.es"
_cache: dict[str, Any] = {}
_cache_ts: dict[str, float] = {}
_CACHE_TTL = 900


async def fetch_demand(date: str | None = None) -> dict[str, Any]:
    """Fetch current electricity demand from REE."""
    cache_key = "demand"
    now = time.time()
    if cache_key in _cache and now - _cache_ts.get(cache_key, 0) < _CACHE_TTL:
        return _cache[cache_key]

    today = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as client:
            resp = await client.get(
                f"{_BASE_URL}/en/datos/demanda/evolucion",
                params={
                    "start_date": f"{today}T00:00",
                    "end_date": f"{today}T23:59",
                    "time_trunc": "hour",
                },
                headers={"Accept": "application/json"},
            )
            resp.raise_for_status()
            data = resp.json()

        included = data.get("included", [])
        demand_values = []
        for item in included:
            if "demanda" in (item.get("type", "") or "").lower():
                for val in item.get("attributes", {}).get("values", []):
                    v = val.get("value")
                    if v is not None:
                        demand_values.append(v)

        result = {
            "current_demand_mw": demand_values[-1] if demand_values else None,
            "max_demand_mw": max(demand_values) if demand_values else None,
            "min_demand_mw": min(demand_values) if demand_values else None,
            "values_count": len(demand_values),
        }
        _cache[cache_key] = result
        _cache_ts[cache_key] = now
        return result
    except Exception:
        logger.exception("Failed to fetch REE demand data")
        return _cache.get(cache_key, {})


async def fetch_generation_mix(date: str | None = None) -> dict[str, Any]:
    """Fetch current generation mix (solar, wind, nuclear, etc.)."""
    cache_key = "generation"
    now = time.time()
    if cache_key in _cache and now - _cache_ts.get(cache_key, 0) < _CACHE_TTL:
        return _cache[cache_key]

    today = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as client:
            resp = await client.get(
                f"{_BASE_URL}/en/datos/generacion/estructura-generacion",
                params={
                    "start_date": f"{today}T00:00",
                    "end_date": f"{today}T23:59",
                    "time_trunc": "day",
                },
                headers={"Accept": "application/json"},
            )
            resp.raise_for_status()
            data = resp.json()

        mix = {}
        for item in data.get("included", []):
            source_type = item.get("attributes", {}).get("title", "Unknown")
            values = item.get("attributes", {}).get("values", [])
            total = sum(v.get("value", 0) for v in values if v.get("value") is not None)
            mix[source_type] = total

        result = {"generation_mix": mix}
        _cache[cache_key] = result
        _cache_ts[cache_key] = now
        return result
    except Exception:
        logger.exception("Failed to fetch REE generation mix")
        return _cache.get(cache_key, {})
