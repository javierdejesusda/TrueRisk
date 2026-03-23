"""IberFire grid service — spatial fire density and proximity scoring."""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass
from typing import Any

logger = logging.getLogger(__name__)

# Spain grid: 0.5° cells covering mainland + islands
_GRID_RESOLUTION = 0.5  # degrees
_SPAIN_BOUNDS = {"min_lat": 27.0, "max_lat": 44.0, "min_lon": -19.0, "max_lon": 5.0}


@dataclass
class FireGridCell:
    row: int
    col: int
    center_lat: float
    center_lon: float
    fire_count: int
    total_frp: float
    max_confidence: str
    risk_level: str  # "none", "low", "moderate", "high", "extreme"


@dataclass
class FireProximityResult:
    nearest_fire_km: float | None
    fire_count_50km: int
    fire_count_100km: int
    total_frp_100km: float
    fire_density_score: float  # 0-100
    proximity_modifier: float  # multiplier for wildfire risk


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in km."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def compute_fire_proximity(
    lat: float, lon: float, hotspots: list[dict[str, Any]]
) -> FireProximityResult:
    """Compute fire proximity metrics for a given location.

    Args:
        lat, lon: Target location
        hotspots: List of fire hotspot dicts with 'lat', 'lon', 'frp' keys
    """
    nearest = None
    count_50 = 0
    count_100 = 0
    total_frp = 0.0

    for fire in hotspots:
        flat = fire.get("lat")
        flon = fire.get("lon")
        if flat is None or flon is None:
            continue
        dist = _haversine_km(lat, lon, flat, flon)
        if nearest is None or dist < nearest:
            nearest = dist
        if dist <= 50:
            count_50 += 1
        if dist <= 100:
            count_100 += 1
            total_frp += fire.get("frp", 0) or 0

    # Fire density score (0-100)
    density_score = 0.0
    if count_100 > 0:
        density_score = min(100, count_50 * 8 + count_100 * 2 + total_frp / 50)

    # Proximity modifier for wildfire risk
    modifier = 1.0
    if nearest is not None:
        if nearest < 10:
            modifier = 1.5
        elif nearest < 25:
            modifier = 1.3
        elif nearest < 50:
            modifier = 1.15
        elif nearest < 100:
            modifier = 1.05

    if count_50 > 5:
        modifier += 0.1
    if total_frp > 500:
        modifier += 0.1

    modifier = round(min(2.0, modifier), 2)

    return FireProximityResult(
        nearest_fire_km=round(nearest, 1) if nearest is not None else None,
        fire_count_50km=count_50,
        fire_count_100km=count_100,
        total_frp_100km=round(total_frp, 1),
        fire_density_score=round(density_score, 1),
        proximity_modifier=modifier,
    )


def build_fire_grid(hotspots: list[dict[str, Any]]) -> list[FireGridCell]:
    """Build a spatial grid of fire density from hotspot data.

    Returns grid cells that have at least one fire.
    """
    bounds = _SPAIN_BOUNDS
    grid: dict[tuple[int, int], dict] = {}

    for fire in hotspots:
        flat = fire.get("lat")
        flon = fire.get("lon")
        if flat is None or flon is None:
            continue
        if flat < bounds["min_lat"] or flat > bounds["max_lat"]:
            continue
        if flon < bounds["min_lon"] or flon > bounds["max_lon"]:
            continue

        row = int((flat - bounds["min_lat"]) / _GRID_RESOLUTION)
        col = int((flon - bounds["min_lon"]) / _GRID_RESOLUTION)
        key = (row, col)

        if key not in grid:
            grid[key] = {"count": 0, "frp": 0.0, "max_conf": "low"}
        grid[key]["count"] += 1
        grid[key]["frp"] += fire.get("frp", 0) or 0
        conf = fire.get("confidence", "low")
        if conf in ("high", "nominal") and grid[key]["max_conf"] not in ("high", "nominal"):
            grid[key]["max_conf"] = conf

    cells = []
    for (row, col), data in grid.items():
        center_lat = bounds["min_lat"] + (row + 0.5) * _GRID_RESOLUTION
        center_lon = bounds["min_lon"] + (col + 0.5) * _GRID_RESOLUTION

        count = data["count"]
        if count >= 10:
            risk = "extreme"
        elif count >= 5:
            risk = "high"
        elif count >= 2:
            risk = "moderate"
        else:
            risk = "low"

        cells.append(FireGridCell(
            row=row, col=col,
            center_lat=round(center_lat, 2),
            center_lon=round(center_lon, 2),
            fire_count=count,
            total_frp=round(data["frp"], 1),
            max_confidence=data["max_conf"],
            risk_level=risk,
        ))

    return sorted(cells, key=lambda c: c.fire_count, reverse=True)
