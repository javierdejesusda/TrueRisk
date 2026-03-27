"""INE (Instituto Nacional de Estadistica) demographics client."""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from app.data._http import resilient_get, RetryableHTTPStatusError

logger = logging.getLogger(__name__)

_BASE_URL = "https://servicios.ine.es/wstempus/js/ES"
_cache: dict[str, Any] = {}
_cache_ts: dict[str, float] = {}
_CACHE_TTL = 86400  # 24h

_POPULATION_TABLE = "2852"


async def fetch_province_demographics(province_name: str) -> dict[str, Any]:
    """Fetch demographic data for a province from INE."""
    cache_key = f"demo:{province_name}"
    now = time.time()
    if cache_key in _cache and now - _cache_ts.get(cache_key, 0) < _CACHE_TTL:
        return _cache[cache_key]

    try:
        resp = await resilient_get(
            f"{_BASE_URL}/DATOS_TABLA/{_POPULATION_TABLE}",
            source="ine_demographics",
            params={"tip": "A"},
            follow_redirects=True,
        )
        resp.raise_for_status()
        data = resp.json()

        if not isinstance(data, list):
            logger.warning("INE response is not a list, returning empty result")
            return _cache.get(cache_key, {})

        total_pop = 0
        male_pop = 0
        female_pop = 0
        for entry in data:
            name = entry.get("Nombre", "")
            if province_name.lower() not in name.lower():
                continue
            value = (
                entry.get("Data", [{}])[0].get("Valor", 0) if entry.get("Data") else 0
            )
            name_lower = name.lower()
            if "total" in name_lower and "total habitantes" in name_lower:
                if "hombres" in name_lower:
                    male_pop = value
                elif "mujeres" in name_lower:
                    female_pop = value
                else:
                    total_pop = value

        if not total_pop:
            total_pop = male_pop + female_pop

        result = {
            "total_population": total_pop,
            "male_population": male_pop,
            "female_population": female_pop,
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
        logger.exception("Failed to fetch INE demographics for %s", province_name)
        return _cache.get(cache_key, {})
