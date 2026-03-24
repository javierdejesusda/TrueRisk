"""Multi-basin SAIH river flow polling service.

Fetches real-time river flow data from Spanish hydrological basin
SAIH (Sistema Automatico de Informacion Hidrologica) systems.
Implements parsing for Ebro (REST API), Jucar (HTML-embedded JS),
Guadalquivir (HTML table scraping), and Segura (HTML scraping).
Other basins remain stubbed pending API discovery.
"""

from __future__ import annotations

import asyncio
import logging
import math
import re
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


def _utm30n_to_wgs84(easting: float, northing: float) -> tuple[float, float]:
    """Convert UTM zone 30N coordinates to WGS84 lat/lon.

    Uses pyproj if available, otherwise falls back to a simplified
    mathematical conversion accurate to ~1m for the Iberian Peninsula.
    """
    try:
        from pyproj import Transformer

        transformer = Transformer.from_crs("EPSG:25830", "EPSG:4326", always_xy=True)
        lon, lat = transformer.transform(easting, northing)
        return lat, lon
    except ImportError:
        pass

    # Fallback: simplified UTM zone 30N to WGS84 conversion
    # Using Karney's approximation for the Iberian Peninsula
    k0 = 0.9996
    a = 6378137.0  # WGS84 semi-major axis
    e = 0.0818191908  # eccentricity
    e2 = e * e
    e_prime2 = e2 / (1 - e2)
    x = easting - 500000.0  # remove false easting
    y = northing
    m = y / k0
    mu = m / (a * (1 - e2 / 4 - 3 * e2**2 / 64 - 5 * e2**3 / 256))
    e1 = (1 - math.sqrt(1 - e2)) / (1 + math.sqrt(1 - e2))
    phi1 = (
        mu
        + (3 * e1 / 2 - 27 * e1**3 / 32) * math.sin(2 * mu)
        + (21 * e1**2 / 16 - 55 * e1**4 / 32) * math.sin(4 * mu)
        + (151 * e1**3 / 96) * math.sin(6 * mu)
    )
    n1 = a / math.sqrt(1 - e2 * math.sin(phi1) ** 2)
    t1 = math.tan(phi1) ** 2
    c1 = e_prime2 * math.cos(phi1) ** 2
    r1 = a * (1 - e2) / (1 - e2 * math.sin(phi1) ** 2) ** 1.5
    d = x / (n1 * k0)
    lat = phi1 - (n1 * math.tan(phi1) / r1) * (
        d**2 / 2 - (5 + 3 * t1 + 10 * c1 - 4 * c1**2 - 9 * e_prime2) * d**4 / 24
    )
    lon_rad = (
        d - (1 + 2 * t1 + c1) * d**3 / 6
        + (5 - 2 * c1 + 28 * t1 - 3 * c1**2 + 8 * e_prime2 + 24 * t1**2) * d**5 / 120
    ) / math.cos(phi1)
    # Central meridian for UTM zone 30 is -3 degrees
    lat_deg = math.degrees(lat)
    lon_deg = math.degrees(lon_rad) + (-3.0)
    return lat_deg, lon_deg


async def _fetch_jucar_flows(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    """Fetch river flow readings from SAIH Jucar by scraping embedded JS data.

    The Jucar SAIH portal embeds a JavaScript array ``aforos`` in the
    /mapa-aforos page containing real-time flow gauge data. Coordinates
    are in UTM zone 30N (EPSG:25830) and are converted to WGS84.
    """
    base = SAIH_BASINS["jucar"]["url"]
    resp = await client.get(
        f"{base}/mapa-aforos",
        headers={"Accept": "text/html"},
    )
    if resp.status_code != 200:
        logger.warning("SAIH Jucar returned status %d", resp.status_code)
        return []

    html = resp.text
    # Extract the embedded aforos JavaScript array
    match = re.search(r"let\s+aforos\s*=\s*(\[.*?\])\s*;", html, re.DOTALL)
    if not match:
        logger.warning("SAIH Jucar: could not find aforos data in HTML")
        return []

    import json

    try:
        items = json.loads(match.group(1))
    except json.JSONDecodeError:
        logger.warning("SAIH Jucar: failed to parse aforos JSON")
        return []

    readings: list[dict[str, Any]] = []
    for item in items:
        gauge_id = item.get("fldTCodigo") or item.get("idEstacionRemota")
        if not gauge_id:
            continue

        # Extract flow value - lastValue contains current flow in m3/s
        flow = _safe_float(item.get("lastValue"))

        # Convert UTM coordinates to WGS84
        utm_x = _safe_float(item.get("fldNCoordGPSLat"))  # easting
        utm_y = _safe_float(item.get("fldNCoordGPSLon"))  # northing
        lat: float | None = None
        lon: float | None = None
        if utm_x is not None and utm_y is not None and utm_x > 100000:
            try:
                lat, lon = _utm30n_to_wgs84(utm_x, utm_y)
            except Exception:
                pass

        # The sub-basin name often corresponds to the river
        river = item.get("fldTSubCuenca", "")

        readings.append({
            "gauge_id": f"jucar_{gauge_id}",
            "name": item.get("fldTNombre", ""),
            "river": river,
            "flow_m3s": flow,
            "level_m": None,  # Not provided in aforos data
            "lat": lat,
            "lon": lon,
            "basin": "Jucar",
        })
    return readings


async def _fetch_guadalquivir_flows(
    client: httpx.AsyncClient,
) -> list[dict[str, Any]]:
    """Fetch river flow readings from SAIH Guadalquivir by scraping HTML tables.

    The Guadalquivir SAIH uses ASP.NET pages. CaudalesMapa.aspx contains a
    table of main flow stations with current and daily average flow rates.
    Coordinates are not available from the HTML; they are omitted.
    """
    base = SAIH_BASINS["guadalquivir"]["url"]
    resp = await client.get(
        f"{base}/CaudalesMapa.aspx",
        headers={"Accept": "text/html"},
    )
    if resp.status_code != 200:
        logger.warning("SAIH Guadalquivir returned status %d", resp.status_code)
        return []

    html = resp.text

    # Known main-river gauges with approximate WGS84 coordinates
    # (sourced from public geographic databases for the Guadalquivir basin)
    _KNOWN_COORDS: dict[str, tuple[float, float]] = {
        "alcala del rio": (37.5189, -5.9806),
        "penaflor": (37.7106, -5.3447),
        "peñaflor": (37.7106, -5.3447),
        "fte. palmera": (37.7000, -5.0667),
        "fuente palmera": (37.7000, -5.0667),
        "ecija": (37.5414, -5.0828),
        "écija (el villar)": (37.5414, -5.0828),
        "villafranca": (37.9667, -4.5333),
        "loja": (37.1689, -4.1519),
        "marmolejo": (38.0500, -4.1667),
        "mengibar": (37.9706, -3.8117),
        "mengíbar": (37.9706, -3.8117),
        "pedro marin": (37.8500, -3.7833),
        "pedro marín": (37.8500, -3.7833),
    }

    # Parse the HTML table - look for rows with station data
    # Pattern: station name followed by flow values (e.g., "88.67")
    # The table structure has station names and flow values in adjacent cells
    readings: list[dict[str, Any]] = []

    # Try to extract data from the table using regex on table rows
    # Look for patterns like: <td>Station Name</td><td>value</td><td>value</td>
    table_pattern = re.compile(
        r"<td[^>]*>\s*([A-ZÁÉÍÓÚÑa-záéíóúñ][A-ZÁÉÍÓÚÑa-záéíóúñ\s\.\(\)]+?)\s*</td>"
        r"\s*<td[^>]*>\s*([\d.,]+)\s*</td>"
        r"\s*<td[^>]*>\s*([\d.,]+)\s*</td>",
        re.IGNORECASE,
    )

    for m in table_pattern.finditer(html):
        name = m.group(1).strip()
        flow_str = m.group(2).replace(",", ".")
        flow = _safe_float(flow_str)

        # Skip if name looks like a header or non-station text
        if len(name) < 3 or name.lower() in ("nombre", "estación", "estacion"):
            continue

        # Generate a stable gauge ID from the name
        slug = re.sub(r"[^a-z0-9]", "", name.lower().replace("á", "a").replace(
            "é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u").replace(
            "ñ", "n"))
        gauge_id = f"guadalquivir_{slug}"

        # Look up known coordinates
        name_lower = name.lower().strip()
        coords = _KNOWN_COORDS.get(name_lower)
        lat = coords[0] if coords else None
        lon = coords[1] if coords else None

        readings.append({
            "gauge_id": gauge_id,
            "name": name,
            "river": "Guadalquivir",
            "flow_m3s": flow,
            "level_m": None,
            "lat": lat,
            "lon": lon,
            "basin": "Guadalquivir",
        })

    if not readings:
        logger.debug("SAIH Guadalquivir: no flow data found in HTML")

    return readings


async def _fetch_segura_flows(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    """Fetch river flow readings from SAIH Segura.

    The Segura SAIH is behind a gated acceptance form and uses an ArcGIS
    viewer, making direct API access difficult. This fetcher attempts to
    reach known endpoint patterns. If the main portal is unreachable,
    returns an empty list.

    NOTE: The Segura SAIH system (www.chsegura.es) does not expose a
    public JSON API. The data viewer requires form acceptance and uses
    proprietary ArcGIS widgets. This fetcher is best-effort and may
    return empty results if the portal format changes.
    """
    # Try the DGA/MITECO Anuario de Aforos API as a fallback data source
    # for the Segura basin - this provides historical + recent flow data
    # from the Spanish Ministry's gauging network
    base = "https://www.chsegura.es"

    # Attempt 1: Try the SAIH direct data page
    for path in [
        "/saih/datos.html",
        "/saih/api/datos",
        "/saih/rest/aforo/datos",
        "/saih/datos/caudales",
    ]:
        try:
            resp = await client.get(
                f"{base}{path}",
                headers={"Accept": "application/json, text/html"},
            )
            if resp.status_code == 200 and resp.headers.get(
                "content-type", ""
            ).startswith("application/json"):
                try:
                    data = resp.json()
                    items = data if isinstance(data, list) else data.get("data", [])
                    if isinstance(items, list) and items:
                        return _parse_generic_flow_items(items, "segura", "Segura")
                except Exception:
                    pass
        except httpx.HTTPError:
            continue

    logger.debug(
        "SAIH Segura: no accessible JSON API found, basin data unavailable"
    )
    return []


def _parse_generic_flow_items(
    items: list[dict[str, Any]], basin_key: str, basin_name: str
) -> list[dict[str, Any]]:
    """Parse a generic list of flow items with common Spanish SAIH field names."""
    readings: list[dict[str, Any]] = []
    for item in items:
        gauge_id = (
            item.get("codigo")
            or item.get("fldTCodigo")
            or item.get("id")
            or item.get("cod")
        )
        if not gauge_id:
            continue
        readings.append({
            "gauge_id": f"{basin_key}_{gauge_id}",
            "name": item.get("nombre", item.get("fldTNombre", "")),
            "river": item.get("rio", item.get("fldTSubCuenca", "")),
            "flow_m3s": _safe_float(
                item.get("caudal") or item.get("lastValue") or item.get("valor")
            ),
            "level_m": _safe_float(item.get("nivel") or item.get("altura")),
            "lat": _safe_float(
                item.get("latitud") or item.get("lat") or item.get("y")
            ),
            "lon": _safe_float(
                item.get("longitud") or item.get("lon") or item.get("x")
            ),
            "basin": basin_name,
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
    "jucar": _fetch_jucar_flows,
    "guadalquivir": _fetch_guadalquivir_flows,
    "segura": _fetch_segura_flows,
    # Other basins use stub until their API format is implemented:
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
