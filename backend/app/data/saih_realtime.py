"""Multi-basin SAIH river flow polling service.

Fetches real-time river flow data from Spanish hydrological basin
SAIH (Sistema Automatico de Informacion Hidrologica) systems.
Currently implements full parsing for Ebro; other basins are stubbed
with the architecture ready to add their specific API parsers.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_TIMEOUT = 30.0
_cache: dict[str, Any] = {}
_cache_ts: dict[str, float] = {}
_CACHE_TTL = 900  # 15 min — river flow can change rapidly

SAIH_BASINS: dict[str, dict[str, Any]] = {
    "ebro": {
        "name": "Ebro",
        "url": "https://www.saihebro.com/saihebro/rest",
        "provinces": ["01", "09", "22", "25", "26", "31", "44", "50"],
    },
    "segura": {
        "name": "Segura",
        "url": "https://www.chsegura.es/saih",
        "provinces": ["02", "03", "23", "30"],
    },
    "jucar": {
        "name": "Jucar",
        "url": "https://saih.chj.es",
        "provinces": ["02", "03", "12", "16", "43", "46"],
    },
    "guadalquivir": {
        "name": "Guadalquivir",
        "url": "https://www.chguadalquivir.es/saih",
        "provinces": ["06", "11", "14", "18", "23", "29", "41"],
    },
    "tajo": {
        "name": "Tajo",
        "url": "https://saihtajo.chtajo.es",
        "provinces": ["02", "10", "13", "16", "19", "28", "45"],
    },
    "duero": {
        "name": "Duero",
        "url": "https://www.saihduero.es",
        "provinces": ["05", "09", "24", "34", "37", "40", "42", "47", "49"],
    },
    "norte": {
        "name": "Norte (Cantabrico)",
        "url": "https://www.chcantabrico.es/saih",
        "provinces": ["15", "27", "32", "33", "36", "39", "48"],
    },
    "guadiana": {
        "name": "Guadiana",
        "url": "https://saihguadiana.chguadiana.es",
        "provinces": ["06", "10", "13"],
    },
    "sur": {
        "name": "Sur (Mediterraneo Andaluz)",
        "url": "https://www.chmediterraneo.es/saih",
        "provinces": ["04", "18", "29"],
    },
}


async def _fetch_ebro_flows(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    """Fetch river flow readings from SAIH Ebro REST API."""
    base = SAIH_BASINS["ebro"]["url"]
    resp = await client.get(
        f"{base}/aforo/datos",
        headers={"Accept": "application/json"},
    )
    if resp.status_code != 200:
        logger.warning("SAIH Ebro returned status %d", resp.status_code)
        return []

    data = resp.json()
    items = data if isinstance(data, list) else data.get("data", [])
    readings: list[dict[str, Any]] = []
    for item in items if isinstance(items, list) else []:
        gauge_id = item.get("codigo") or item.get("id")
        if not gauge_id:
            continue
        readings.append({
            "gauge_id": f"ebro_{gauge_id}",
            "name": item.get("nombre", ""),
            "river": item.get("rio", ""),
            "flow_m3s": _safe_float(item.get("caudal")),
            "level_m": _safe_float(item.get("nivel")),
            "lat": _safe_float(item.get("latitud") or item.get("y")),
            "lon": _safe_float(item.get("longitud") or item.get("x")),
            "basin": "Ebro",
        })
    return readings


async def _fetch_stub_flows(basin_key: str) -> list[dict[str, Any]]:
    """Stub fetcher for basins whose API format is not yet implemented.

    Returns empty list. As each basin's API is reverse-engineered, this
    gets replaced with a real parser like ``_fetch_ebro_flows``.
    """
    logger.debug(
        "SAIH %s: fetch not yet implemented, skipping",
        SAIH_BASINS[basin_key]["name"],
    )
    return []


_BASIN_FETCHERS = {
    "ebro": _fetch_ebro_flows,
    # Other basins use stub until their API format is implemented:
    "segura": lambda _client: _fetch_stub_flows("segura"),
    "jucar": lambda _client: _fetch_stub_flows("jucar"),
    "guadalquivir": lambda _client: _fetch_stub_flows("guadalquivir"),
    "tajo": lambda _client: _fetch_stub_flows("tajo"),
    "duero": lambda _client: _fetch_stub_flows("duero"),
    "norte": lambda _client: _fetch_stub_flows("norte"),
    "guadiana": lambda _client: _fetch_stub_flows("guadiana"),
    "sur": lambda _client: _fetch_stub_flows("sur"),
}


def _safe_float(val: Any) -> float | None:
    """Convert a value to float, returning None on failure."""
    if val is None:
        return None
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


async def fetch_river_flows(basin: str = "ebro") -> list[dict[str, Any]]:
    """Fetch current river flow readings from a SAIH basin.

    Returns list of dicts with keys:
        gauge_id, name, river, flow_m3s, level_m, lat, lon, basin
    """
    basin = basin.lower()
    if basin not in SAIH_BASINS:
        logger.warning("Unknown SAIH basin: %s", basin)
        return []

    cache_key = f"river_flows:{basin}"
    now = time.time()
    if cache_key in _cache and now - _cache_ts.get(cache_key, 0) < _CACHE_TTL:
        return _cache[cache_key]

    fetcher = _BASIN_FETCHERS.get(basin)
    if fetcher is None:
        return []

    try:
        async with httpx.AsyncClient(
            timeout=_TIMEOUT, follow_redirects=True
        ) as client:
            readings = await fetcher(client)
            if readings:
                _cache[cache_key] = readings
                _cache_ts[cache_key] = now
            return readings
    except Exception:
        logger.exception("Failed to fetch river flows for basin %s", basin)
        return _cache.get(cache_key, [])


async def fetch_all_basin_flows() -> list[dict[str, Any]]:
    """Fetch flows from all configured basins.

    Best-effort: continues if one basin fails. Results are cached
    per-basin so partial failures don't invalidate other basins.
    """
    cache_key = "river_flows:all"
    now = time.time()
    if cache_key in _cache and now - _cache_ts.get(cache_key, 0) < _CACHE_TTL:
        return _cache[cache_key]

    tasks = [fetch_river_flows(basin) for basin in SAIH_BASINS]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_readings: list[dict[str, Any]] = []
    for basin_key, result in zip(SAIH_BASINS, results):
        if isinstance(result, BaseException):
            logger.error("Basin %s failed: %s", basin_key, result)
            continue
        all_readings.extend(result)

    if all_readings:
        _cache[cache_key] = all_readings
        _cache_ts[cache_key] = now
    return all_readings


async def get_gauge_status(gauge_id: str) -> dict[str, Any]:
    """Get current flow and historical percentiles for a gauge.

    Searches across all cached basin data. Returns gauge info with
    threshold context if available from the database, or a simple
    status dict from the most recent cached data.
    """
    # Search all cached basin data for this gauge
    for basin_key in SAIH_BASINS:
        cache_key = f"river_flows:{basin_key}"
        readings = _cache.get(cache_key, [])
        for reading in readings:
            if reading.get("gauge_id") == gauge_id:
                return {
                    "gauge_id": gauge_id,
                    "name": reading.get("name", ""),
                    "river": reading.get("river", ""),
                    "basin": reading.get("basin", ""),
                    "flow_m3s": reading.get("flow_m3s"),
                    "level_m": reading.get("level_m"),
                    "lat": reading.get("lat"),
                    "lon": reading.get("lon"),
                    "status": "ok",
                }

    # If not in cache, try fetching all basins
    all_flows = await fetch_all_basin_flows()
    for reading in all_flows:
        if reading.get("gauge_id") == gauge_id:
            return {
                "gauge_id": gauge_id,
                "name": reading.get("name", ""),
                "river": reading.get("river", ""),
                "basin": reading.get("basin", ""),
                "flow_m3s": reading.get("flow_m3s"),
                "level_m": reading.get("level_m"),
                "lat": reading.get("lat"),
                "lon": reading.get("lon"),
                "status": "ok",
            }

    return {"gauge_id": gauge_id, "status": "not_found"}
