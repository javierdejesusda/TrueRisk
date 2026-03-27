"""Province lookup using point-in-polygon against real GeoJSON boundaries.

Loads the spain-provinces.geojson once and builds prepared Shapely geometries
so that ``find_province`` is a fast spatial query rather than a
nearest-centroid approximation.
"""

from __future__ import annotations

import json
import logging
import math
from pathlib import Path
from typing import Any

from shapely.geometry import Point, shape
from shapely.prepared import prep

from app.data.province_data import PROVINCES

logger = logging.getLogger(__name__)

_GEOJSON_PATH = Path(__file__).resolve().parents[1] / "data" / "spain-provinces.geojson"

_PROVINCE_POLYGONS: list[tuple[str, Any, Any]] = []


def _load_polygons() -> None:
    """Parse the GeoJSON file and build prepared geometries keyed by province code."""
    global _PROVINCE_POLYGONS  # noqa: PLW0603
    if _PROVINCE_POLYGONS:
        return
    try:
        with open(_GEOJSON_PATH, encoding="utf-8") as f:
            data = json.load(f)
        for feature in data["features"]:
            code = feature["properties"].get("cod_prov", "")
            raw_geom = feature.get("geometry")
            if not raw_geom or not raw_geom.get("type"):
                continue
            geom = shape(raw_geom)
            _PROVINCE_POLYGONS.append((code, prep(geom), geom))
        logger.info("Loaded %d province polygons for spatial lookup", len(_PROVINCE_POLYGONS))
    except Exception:
        logger.exception("Failed to load province GeoJSON — falling back to centroid lookup")


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return great-circle distance in kilometres between two points."""
    r = 6_371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _nearest_centroid(lat: float, lon: float) -> str:
    """Fallback: return province code whose centroid is closest."""
    best_code = "28"
    best_dist = float("inf")
    for code, data in PROVINCES.items():
        dist = haversine(lat, lon, data["latitude"], data["longitude"])
        if dist < best_dist:
            best_dist = dist
            best_code = code
    return best_code


def find_province(lat: float, lon: float) -> str:
    """Return the INE 2-digit province code for the given coordinates.

    Uses point-in-polygon against real province boundaries.  Falls back to
    nearest-centroid if the GeoJSON failed to load or the point is offshore.
    """
    _load_polygons()

    if not _PROVINCE_POLYGONS:
        return _nearest_centroid(lat, lon)

    point = Point(lon, lat)  # GeoJSON is (lon, lat)

    for code, prepared_geom, _raw in _PROVINCE_POLYGONS:
        if prepared_geom.contains(point):
            return code

    return _nearest_centroid(lat, lon)
