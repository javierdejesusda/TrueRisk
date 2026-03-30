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

    try:
        data = resp.json()
    except (ValueError, KeyError):
        logger.warning("SAIH Ebro returned non-JSON response")
        return []
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


def _enrich_with_known_coords(
    readings: list[dict[str, Any]], known_coords: dict[str, tuple[float, float]]
) -> list[dict[str, Any]]:
    """Add coordinates from known stations dict if reading has no coords."""
    for r in readings:
        if r.get("lat") is None or r.get("lon") is None:
            name_lower = (r.get("name") or "").lower().strip()
            for station, (lat, lon) in known_coords.items():
                if station in name_lower or name_lower in station:
                    r["lat"] = lat
                    r["lon"] = lon
                    break
    return readings


def _parse_html_table_flows(
    html: str, basin_key: str, basin_name: str
) -> list[dict[str, Any]]:
    """Extract flow data from HTML tables (generic pattern like Guadalquivir)."""
    table_pattern = re.compile(
        r"<td[^>]*>\s*([A-ZÁÉÍÓÚÑa-záéíóúñ][A-ZÁÉÍÓÚÑa-záéíóúñ\s\.\(\)]+?)\s*</td>"
        r"\s*<td[^>]*>\s*([\d.,]+)\s*</td>",
        re.IGNORECASE,
    )
    readings: list[dict[str, Any]] = []
    for m in table_pattern.finditer(html):
        name = m.group(1).strip()
        flow = _safe_float(m.group(2).replace(",", "."))
        if len(name) < 3 or name.lower() in ("nombre", "estación", "estacion", "caudal"):
            continue
        slug = re.sub(r"[^a-z0-9]", "", name.lower())
        readings.append({
            "gauge_id": f"{basin_key}_{slug}",
            "name": name,
            "river": basin_name,
            "flow_m3s": flow,
            "level_m": None,
            "lat": None, "lon": None,
            "basin": basin_name,
        })
    return readings


def _parse_embedded_js_flows(
    html: str, basin_key: str, basin_name: str
) -> list[dict[str, Any]]:
    """Extract flow data from embedded JavaScript arrays (Jucar-like pattern)."""
    import json
    for var_name in ["aforos", "estaciones", "datos", "stations"]:
        pattern = rf"(?:let|var|const)\s+{var_name}\s*=\s*(\[.*?\])\s*;"
        match = re.search(pattern, html, re.DOTALL)
        if match:
            try:
                items = json.loads(match.group(1))
                if isinstance(items, list) and items:
                    return _parse_generic_flow_items(items, basin_key, basin_name)
            except json.JSONDecodeError:
                continue
    return []


# ---------------------------------------------------------------------------
# Basin-specific known coordinates
# ---------------------------------------------------------------------------

_TAJO_KNOWN_COORDS: dict[str, tuple[float, float]] = {
    "aranjuez": (40.033, -3.603), "toledo": (39.858, -4.024),
    "talavera": (39.961, -4.831), "alcantara": (39.718, -6.889),
    "trillo": (40.700, -2.592), "bolarque": (40.385, -2.780),
    "castrejon": (39.871, -4.437), "azutan": (39.780, -5.147),
    "valdecanas": (39.750, -5.464),
}

_DUERO_KNOWN_COORDS: dict[str, tuple[float, float]] = {
    "zamora": (41.503, -5.745), "toro": (41.522, -5.395),
    "salamanca": (40.970, -5.663), "valladolid": (41.652, -4.724),
    "soria": (41.764, -2.468), "aranda de duero": (41.670, -3.689),
    "peñafiel": (41.600, -4.117), "tordesillas": (41.504, -5.000),
    "villachica": (41.533, -5.483),
}

_NORTE_KNOWN_COORDS: dict[str, tuple[float, float]] = {
    "oviedo": (43.362, -5.849), "gijon": (43.535, -5.662),
    "santander": (43.462, -3.810), "bilbao": (43.263, -2.935),
    "reinosa": (42.998, -4.137), "cabuerniga": (43.233, -4.283),
    "lugo": (43.009, -7.556), "pontevedra": (42.431, -8.644),
}

_GUADIANA_KNOWN_COORDS: dict[str, tuple[float, float]] = {
    "badajoz": (38.878, -6.970), "merida": (38.916, -6.344),
    "ciudad real": (38.986, -3.927), "puertollano": (38.687, -4.110),
    "don benito": (38.954, -5.861), "villanueva de la serena": (38.975, -5.798),
    "zújar": (38.585, -5.281), "orellana": (39.005, -5.542),
}

_SUR_KNOWN_COORDS: dict[str, tuple[float, float]] = {
    "malaga": (36.721, -4.421), "granada": (37.177, -3.599),
    "almeria": (36.834, -2.463), "motril": (36.745, -3.518),
    "nerja": (36.756, -3.878), "velez malaga": (36.778, -4.100),
    "antequera": (37.019, -4.561), "loja": (37.169, -4.152),
}


# ---------------------------------------------------------------------------
# Basin fetchers for previously-stubbed basins
# ---------------------------------------------------------------------------

async def _fetch_tajo_flows(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    """Fetch river flow readings from SAIH Tajo."""
    base = SAIH_BASINS["tajo"]["url"]

    # Strategy 1: Try REST API endpoints
    for path in ["/api/datos/caudales", "/saih/rest/aforo/datos", "/api/aforos"]:
        try:
            resp = await client.get(f"{base}{path}", headers={"Accept": "application/json"})
            if resp.status_code == 200:
                ct = resp.headers.get("content-type", "")
                if "json" in ct:
                    data = resp.json()
                    items = data if isinstance(data, list) else data.get("data", data.get("datos", []))
                    if isinstance(items, list) and items:
                        readings = _parse_generic_flow_items(items, "tajo", "Tajo")
                        return _enrich_with_known_coords(readings, _TAJO_KNOWN_COORDS)
        except (httpx.HTTPError, Exception):
            continue

    # Strategy 2: Try HTML scraping
    for path in ["/Informes/CaudalesInstantaneos.aspx", "/saih/caudales.html", "/"]:
        try:
            resp = await client.get(f"{base}{path}", headers={"Accept": "text/html"})
            if resp.status_code == 200 and "text/html" in resp.headers.get("content-type", ""):
                readings = _parse_html_table_flows(resp.text, "tajo", "Tajo")
                if readings:
                    return _enrich_with_known_coords(readings, _TAJO_KNOWN_COORDS)
        except (httpx.HTTPError, Exception):
            continue

    logger.debug("SAIH Tajo: no accessible data endpoint found")
    return []


async def _fetch_duero_flows(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    """Fetch river flow readings from SAIH Duero."""
    base = SAIH_BASINS["duero"]["url"]

    for path in ["/risr/datos-tiempo-real", "/risr/caudales", "/api/caudales", "/rest/aforo/datos"]:
        try:
            resp = await client.get(f"{base}{path}", headers={"Accept": "application/json"})
            if resp.status_code == 200:
                ct = resp.headers.get("content-type", "")
                if "json" in ct:
                    data = resp.json()
                    items = data if isinstance(data, list) else data.get("data", data.get("datos", []))
                    if isinstance(items, list) and items:
                        readings = _parse_generic_flow_items(items, "duero", "Duero")
                        return _enrich_with_known_coords(readings, _DUERO_KNOWN_COORDS)
        except (httpx.HTTPError, Exception):
            continue

    # HTML fallback
    for path in ["/Informes/CaudalesInstantaneos.aspx", "/saih/", "/"]:
        try:
            resp = await client.get(f"{base}{path}", headers={"Accept": "text/html"})
            if resp.status_code == 200 and "html" in resp.headers.get("content-type", ""):
                readings = _parse_embedded_js_flows(resp.text, "duero", "Duero")
                if readings:
                    return _enrich_with_known_coords(readings, _DUERO_KNOWN_COORDS)
                readings = _parse_html_table_flows(resp.text, "duero", "Duero")
                if readings:
                    return _enrich_with_known_coords(readings, _DUERO_KNOWN_COORDS)
        except (httpx.HTTPError, Exception):
            continue

    logger.debug("SAIH Duero: no accessible data endpoint found")
    return []


async def _fetch_norte_flows(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    """Fetch river flow readings from SAIH Norte (Cantabrico)."""
    base = SAIH_BASINS["norte"]["url"]

    for path in ["/api/datos/caudales", "/rest/aforo/datos", "/api/aforos", "/datos/caudales"]:
        try:
            resp = await client.get(f"{base}{path}", headers={"Accept": "application/json"})
            if resp.status_code == 200:
                ct = resp.headers.get("content-type", "")
                if "json" in ct:
                    data = resp.json()
                    items = data if isinstance(data, list) else data.get("data", data.get("datos", []))
                    if isinstance(items, list) and items:
                        readings = _parse_generic_flow_items(items, "norte", "Norte (Cantabrico)")
                        return _enrich_with_known_coords(readings, _NORTE_KNOWN_COORDS)
        except (httpx.HTTPError, Exception):
            continue

    for path in ["/Informes/CaudalesInstantaneos.aspx", "/saih/caudales.html", "/"]:
        try:
            resp = await client.get(f"{base}{path}", headers={"Accept": "text/html"})
            if resp.status_code == 200 and "html" in resp.headers.get("content-type", ""):
                readings = _parse_embedded_js_flows(resp.text, "norte", "Norte (Cantabrico)")
                if readings:
                    return _enrich_with_known_coords(readings, _NORTE_KNOWN_COORDS)
                readings = _parse_html_table_flows(resp.text, "norte", "Norte (Cantabrico)")
                if readings:
                    return _enrich_with_known_coords(readings, _NORTE_KNOWN_COORDS)
        except (httpx.HTTPError, Exception):
            continue

    logger.debug("SAIH Norte: no accessible data endpoint found")
    return []


async def _fetch_guadiana_flows(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    """Fetch river flow readings from SAIH Guadiana."""
    base = SAIH_BASINS["guadiana"]["url"]

    for path in ["/api/datos/caudales", "/rest/aforo/datos", "/api/aforos", "/datos/caudales"]:
        try:
            resp = await client.get(f"{base}{path}", headers={"Accept": "application/json"})
            if resp.status_code == 200:
                ct = resp.headers.get("content-type", "")
                if "json" in ct:
                    data = resp.json()
                    items = data if isinstance(data, list) else data.get("data", data.get("datos", []))
                    if isinstance(items, list) and items:
                        readings = _parse_generic_flow_items(items, "guadiana", "Guadiana")
                        return _enrich_with_known_coords(readings, _GUADIANA_KNOWN_COORDS)
        except (httpx.HTTPError, Exception):
            continue

    for path in ["/Informes/CaudalesInstantaneos.aspx", "/saih/caudales.html", "/"]:
        try:
            resp = await client.get(f"{base}{path}", headers={"Accept": "text/html"})
            if resp.status_code == 200 and "html" in resp.headers.get("content-type", ""):
                readings = _parse_embedded_js_flows(resp.text, "guadiana", "Guadiana")
                if readings:
                    return _enrich_with_known_coords(readings, _GUADIANA_KNOWN_COORDS)
                readings = _parse_html_table_flows(resp.text, "guadiana", "Guadiana")
                if readings:
                    return _enrich_with_known_coords(readings, _GUADIANA_KNOWN_COORDS)
        except (httpx.HTTPError, Exception):
            continue

    logger.debug("SAIH Guadiana: no accessible data endpoint found")
    return []


async def _fetch_sur_flows(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    """Fetch river flow readings from SAIH Sur (Mediterraneo Andaluz)."""
    base = SAIH_BASINS["sur"]["url"]

    for path in ["/api/datos/caudales", "/rest/aforo/datos", "/api/aforos", "/datos/caudales"]:
        try:
            resp = await client.get(f"{base}{path}", headers={"Accept": "application/json"})
            if resp.status_code == 200:
                ct = resp.headers.get("content-type", "")
                if "json" in ct:
                    data = resp.json()
                    items = data if isinstance(data, list) else data.get("data", data.get("datos", []))
                    if isinstance(items, list) and items:
                        readings = _parse_generic_flow_items(items, "sur", "Sur (Mediterraneo Andaluz)")
                        return _enrich_with_known_coords(readings, _SUR_KNOWN_COORDS)
        except (httpx.HTTPError, Exception):
            continue

    for path in ["/Informes/CaudalesInstantaneos.aspx", "/saih/caudales.html", "/"]:
        try:
            resp = await client.get(f"{base}{path}", headers={"Accept": "text/html"})
            if resp.status_code == 200 and "html" in resp.headers.get("content-type", ""):
                readings = _parse_embedded_js_flows(resp.text, "sur", "Sur (Mediterraneo Andaluz)")
                if readings:
                    return _enrich_with_known_coords(readings, _SUR_KNOWN_COORDS)
                readings = _parse_html_table_flows(resp.text, "sur", "Sur (Mediterraneo Andaluz)")
                if readings:
                    return _enrich_with_known_coords(readings, _SUR_KNOWN_COORDS)
        except (httpx.HTTPError, Exception):
            continue

    logger.debug("SAIH Sur: no accessible data endpoint found")
    return []


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
    "tajo": _fetch_tajo_flows,
    "duero": _fetch_duero_flows,
    "norte": _fetch_norte_flows,
    "guadiana": _fetch_guadiana_flows,
    "sur": _fetch_sur_flows,
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
    from app.demo import is_demo_mode
    if is_demo_mode():
        from app.demo.mock_river_gauges import get_mock_river_flows
        return get_mock_river_flows()
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
            timeout=_TIMEOUT, follow_redirects=True, verify=False
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
    from app.demo import is_demo_mode
    if is_demo_mode():
        from app.demo.mock_river_gauges import get_mock_river_flows
        return get_mock_river_flows()
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
