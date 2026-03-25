"""Road routing via OSRM public API with Haversine fallback.

Provides real driving/walking route geometry for evacuation planning,
replacing the existing Haversine straight-line distance calculations.
"""
from __future__ import annotations

import logging
import math
from typing import Any

import httpx

logger = logging.getLogger(__name__)

OSRM_BASE = "https://router.project-osrm.org"
_TIMEOUT = 10.0


async def get_route(
    origin: tuple[float, float],
    destination: tuple[float, float],
    profile: str = "driving",
) -> dict[str, Any]:
    """Get road route from OSRM.

    Args:
        origin: (lat, lon) of start point
        destination: (lat, lon) of end point
        profile: "driving" or "foot"

    Returns dict with: geometry (GeoJSON), distance_km, duration_min, source ("osrm" or "haversine")
    """
    url = (
        f"{OSRM_BASE}/route/v1/{profile}/"
        f"{origin[1]},{origin[0]};{destination[1]},{destination[0]}"
    )
    params = {"overview": "full", "geometries": "geojson", "steps": "false"}

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(url, params=params)
            if resp.status_code != 200:
                return _haversine_fallback(origin, destination)
            data = resp.json()
            if data.get("code") != "Ok" or not data.get("routes"):
                return _haversine_fallback(origin, destination)
            route = data["routes"][0]
            return {
                "geometry": route["geometry"],
                "distance_km": round(route["distance"] / 1000, 1),
                "duration_min": round(route["duration"] / 60),
                "source": "osrm",
            }
    except Exception:
        logger.debug("OSRM routing failed, falling back to Haversine")
        return _haversine_fallback(origin, destination)


def _haversine_fallback(
    origin: tuple[float, float], destination: tuple[float, float]
) -> dict[str, Any]:
    """Compute straight-line distance when OSRM is unavailable."""
    lat1, lon1 = math.radians(origin[0]), math.radians(origin[1])
    lat2, lon2 = math.radians(destination[0]), math.radians(destination[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    km = 6371 * c
    return {
        "geometry": {
            "type": "LineString",
            "coordinates": [[origin[1], origin[0]], [destination[1], destination[0]]],
        },
        "distance_km": round(km, 1),
        "duration_min": round(km / 50 * 60),  # Assume 50 km/h average
        "source": "haversine",
    }


async def get_evacuation_route(
    user_lat: float,
    user_lon: float,
    safe_points: list[dict[str, Any]],
    profile: str = "driving",
    max_candidates: int = 3,
) -> list[dict[str, Any]]:
    """Find routes to the nearest safe points.

    Returns up to max_candidates routes sorted by distance.
    """
    if not safe_points:
        return []

    # Sort safe points by Haversine distance to pre-filter
    def _haversine_dist(sp: dict) -> float:
        lat2, lon2 = sp.get("latitude", 0), sp.get("longitude", 0)
        return _haversine_fallback((user_lat, user_lon), (lat2, lon2))["distance_km"]

    sorted_points = sorted(safe_points, key=_haversine_dist)[:max_candidates * 2]

    routes = []
    for sp in sorted_points[:max_candidates]:
        route = await get_route(
            (user_lat, user_lon),
            (sp.get("latitude", 0), sp.get("longitude", 0)),
            profile=profile,
        )
        route["safe_point"] = {
            "name": sp.get("name", ""),
            "type": sp.get("type", ""),
            "latitude": sp.get("latitude"),
            "longitude": sp.get("longitude"),
        }
        routes.append(route)

    routes.sort(key=lambda r: r["distance_km"])
    return routes[:max_candidates]
