"""Elevation and terrain-slope service via Open-Meteo Elevation API.

Provides elevation (meters) and slope (percent) for any coordinate pair.
Used to refine address-level climate risk scores -- e.g. wildfire risk
increases on steep slopes, flood risk decreases at high elevation.
"""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass

import httpx

logger = logging.getLogger(__name__)

_TIMEOUT = 30.0
_ELEVATION_URL = "https://api.open-meteo.com/v1/elevation"

# Delta in degrees (~111 m) used to sample neighbouring points for slope.
_DELTA = 0.001

# ---------------------------------------------------------------------------
# Result type
# ---------------------------------------------------------------------------


@dataclass
class ElevationResult:
    """Elevation and terrain slope for a single coordinate."""

    elevation_m: float
    slope_pct: float  # percent slope (0-100+)


# ---------------------------------------------------------------------------
# In-memory cache  (key = "lat,lon" rounded to 4 decimals)
# ---------------------------------------------------------------------------

_cache: dict[str, ElevationResult] = {}


def _cache_key(lat: float, lon: float) -> str:
    """Build a cache key by rounding coordinates to 4 decimal places."""
    return f"{round(lat, 4)},{round(lon, 4)}"


# ---------------------------------------------------------------------------
# Low-level API helpers
# ---------------------------------------------------------------------------


async def _fetch_elevations(lats: list[float], lons: list[float]) -> list[float]:
    """Batch-query the Open-Meteo Elevation API.

    Returns a list of elevations in metres corresponding to the input
    coordinate lists.  On failure returns a list of 0.0 values.
    """
    try:
        lat_csv = ",".join(str(v) for v in lats)
        lon_csv = ",".join(str(v) for v in lons)
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(
                _ELEVATION_URL,
                params={"latitude": lat_csv, "longitude": lon_csv},
            )
            resp.raise_for_status()
            data = resp.json()
        elevations = data.get("elevation", [])
        if len(elevations) == len(lats):
            return [float(e) for e in elevations]
        logger.warning(
            "Elevation API returned %d values, expected %d",
            len(elevations),
            len(lats),
        )
        return [0.0] * len(lats)
    except Exception:
        logger.exception("Failed to fetch elevations for %d points", len(lats))
        return [0.0] * len(lats)


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------


async def get_elevation(lat: float, lon: float) -> float:
    """Return elevation in metres for a single point.

    Falls back to 0.0 on error.
    """
    result = await _fetch_elevations([lat], [lon])
    return result[0]


async def get_terrain_slope(lat: float, lon: float) -> float:
    """Compute terrain slope (%) by sampling 4 neighbouring points.

    Queries (lat+d, lon), (lat-d, lon), (lat, lon+d), (lat, lon-d) in a
    single batch call.  Gradient is computed from the elevation differences:

        dz_dy = (north - south) / (2 * dy_m)
        dz_dx = (east  - west)  / (2 * dx_m)
        slope  = sqrt(dz_dx^2 + dz_dy^2) * 100
    """
    d = _DELTA
    lats = [lat + d, lat - d, lat, lat]
    lons = [lon, lon, lon + d, lon - d]

    elevs = await _fetch_elevations(lats, lons)
    north, south, east, west = elevs

    lat_rad = math.radians(lat)
    dy_m = d * 111320.0
    dx_m = d * 111320.0 * math.cos(lat_rad)

    dz_dy = (north - south) / (2.0 * dy_m)
    dz_dx = (east - west) / (2.0 * dx_m) if dx_m > 0 else 0.0

    slope_pct = math.sqrt(dz_dx**2 + dz_dy**2) * 100.0
    return slope_pct


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------


async def get_elevation_and_slope(lat: float, lon: float) -> ElevationResult:
    """Return elevation and slope for a coordinate, with in-memory caching.

    Batches the centre point and 4 neighbours into a single API call
    (5 points total) to minimise round-trips.
    """
    key = _cache_key(lat, lon)
    if key in _cache:
        logger.debug("Elevation cache hit for %s", key)
        return _cache[key]

    d = _DELTA
    # Order: centre, north, south, east, west
    lats = [lat, lat + d, lat - d, lat, lat]
    lons = [lon, lon, lon, lon + d, lon - d]

    elevs = await _fetch_elevations(lats, lons)
    centre, north, south, east, west = elevs

    lat_rad = math.radians(lat)
    dy_m = d * 111320.0
    dx_m = d * 111320.0 * math.cos(lat_rad)

    dz_dy = (north - south) / (2.0 * dy_m)
    dz_dx = (east - west) / (2.0 * dx_m) if dx_m > 0 else 0.0

    slope_pct = math.sqrt(dz_dx**2 + dz_dy**2) * 100.0

    result = ElevationResult(elevation_m=centre, slope_pct=slope_pct)
    _cache[key] = result
    logger.debug(
        "Elevation for (%s, %s): %.1f m, slope %.2f%%",
        lat,
        lon,
        centre,
        slope_pct,
    )
    return result
