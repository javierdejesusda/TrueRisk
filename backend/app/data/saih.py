"""Spanish reservoir level client using MITECO ArcGIS FeatureServer.

Fetches live reservoir data from the official Spanish Ministry (MITECO)
Boletin Hidrologico service — 374 reservoirs across all 16 peninsular
river basins, updated weekly.
"""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_TIMEOUT = 30.0
_cache: dict[str, Any] = {}
_cache_ts: dict[str, float] = {}
_CACHE_TTL = 3600  # 1h

_MITECO_URL = (
    "https://services-eu1.arcgis.com/RvnYk1PBUJ9rrAuT/arcgis/rest/services"
    "/Embalses_Mapa/FeatureServer/0/query"
)
_MITECO_PARAMS = {
    "where": "1=1",
    "outFields": (
        "embalse_nombre,agua_total,agua_actual,ambito_nombre,"
        "Porcentaje_Reserva,Variacion_Reserva,fecha"
    ),
    "returnGeometry": "true",
    "outSR": "4326",
    "f": "json",
    "resultRecordCount": "2000",
}

_FALLBACK_RESERVOIRS: list[dict[str, Any]] = [
    {"name": "Mequinenza", "basin": "Ebro", "capacity_pct": 65, "volume_hm3": 1020, "capacity_hm3": 1534, "stale": True},
    {"name": "Canelles", "basin": "Ebro", "capacity_pct": 58, "volume_hm3": 412, "capacity_hm3": 679, "stale": True},
    {"name": "El Grado", "basin": "Ebro", "capacity_pct": 72, "volume_hm3": 320, "capacity_hm3": 399, "stale": True},
    {"name": "Yesa", "basin": "Ebro", "capacity_pct": 55, "volume_hm3": 246, "capacity_hm3": 447, "stale": True},
    {"name": "Mediano", "basin": "Ebro", "capacity_pct": 61, "volume_hm3": 271, "capacity_hm3": 436, "stale": True},
]


def _parse_features(data: dict[str, Any]) -> list[dict[str, Any]]:
    """Parse ArcGIS FeatureServer JSON into our reservoir format."""
    reservoirs: list[dict[str, Any]] = []
    for feature in data.get("features", []):
        attrs = feature.get("attributes", {})
        geom = feature.get("geometry", {})

        name = attrs.get("embalse_nombre", "")
        capacity = attrs.get("agua_total") or 0
        volume = attrs.get("agua_actual") or 0
        basin = attrs.get("ambito_nombre", "")
        pct = attrs.get("Porcentaje_Reserva")
        variation = attrs.get("Variacion_Reserva")

        if pct is None and capacity > 0:
            pct = round((volume / capacity) * 100, 1)

        entry: dict[str, Any] = {
            "name": name,
            "basin": basin,
            "capacity_pct": round(pct, 1) if pct is not None else 0,
            "volume_hm3": round(volume, 1),
            "capacity_hm3": round(capacity, 1),
        }

        if variation is not None:
            entry["variation_hm3"] = round(variation, 1)

        lon = geom.get("x")
        lat = geom.get("y")
        if lat is not None and lon is not None:
            entry["lat"] = round(lat, 6)
            entry["lon"] = round(lon, 6)

        reservoirs.append(entry)

    return reservoirs


async def fetch_reservoir_levels() -> list[dict[str, Any]]:
    """Fetch reservoir capacity levels from MITECO (all Spanish basins)."""
    from app.demo import is_demo_mode
    if is_demo_mode():
        from app.demo.mock_reservoirs import get_mock_reservoirs
        return get_mock_reservoirs()
    cache_key = "reservoirs:all"
    now = time.time()
    if cache_key in _cache and now - _cache_ts.get(cache_key, 0) < _CACHE_TTL:
        return _cache[cache_key]

    try:
        async with httpx.AsyncClient(
            timeout=_TIMEOUT, follow_redirects=True
        ) as client:
            resp = await client.get(_MITECO_URL, params=_MITECO_PARAMS)

            if resp.status_code != 200:
                logger.warning(
                    "MITECO API returned status %d: %s",
                    resp.status_code,
                    resp.text[:300],
                )
                return _cache.get(cache_key, _FALLBACK_RESERVOIRS)

            data = resp.json()

            if "error" in data:
                logger.warning("MITECO API error: %s", data["error"])
                return _cache.get(cache_key, _FALLBACK_RESERVOIRS)

            reservoirs = _parse_features(data)

            if reservoirs:
                _cache[cache_key] = reservoirs
                _cache_ts[cache_key] = now
                logger.info(
                    "Fetched %d reservoirs from MITECO", len(reservoirs)
                )
                return reservoirs

            logger.warning("MITECO returned 0 features")
            return _cache.get(cache_key, _FALLBACK_RESERVOIRS)

    except Exception:
        logger.exception("Failed to fetch reservoir levels from MITECO")
        return _cache.get(cache_key, _FALLBACK_RESERVOIRS)
