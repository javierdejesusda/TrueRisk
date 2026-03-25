"""Evacuation routing service — finds nearest safe points and routes."""

import logging
import math
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.evacuation_route import SafePoint

logger = logging.getLogger(__name__)


@dataclass
class EvacuationRoute:
    safe_point: dict
    distance_km: float
    bearing: str  # N, NE, E, SE, S, SW, W, NW
    estimated_time_min: int  # walking time estimate


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in km between two GPS points."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.asin(math.sqrt(a))


def _bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> str:
    """Cardinal direction from point 1 to point 2."""
    dlon = math.radians(lon2 - lon1)
    x = math.sin(dlon) * math.cos(math.radians(lat2))
    y = math.cos(math.radians(lat1)) * math.sin(math.radians(lat2)) - math.sin(
        math.radians(lat1)
    ) * math.cos(math.radians(lat2)) * math.cos(dlon)
    deg = (math.degrees(math.atan2(x, y)) + 360) % 360
    dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    return dirs[round(deg / 45) % 8]


async def find_nearest_safe_points(
    db: AsyncSession,
    lat: float,
    lon: float,
    province_code: str | None = None,
    point_type: str | None = None,
    limit: int = 5,
) -> list[EvacuationRoute]:
    """Find nearest safe points sorted by distance."""
    stmt = select(SafePoint).where(SafePoint.is_active == True)  # noqa: E712
    if province_code:
        stmt = stmt.where(SafePoint.province_code == province_code)
    if point_type:
        stmt = stmt.where(SafePoint.point_type == point_type)

    result = await db.execute(stmt)
    points = result.scalars().all()

    routes = []
    for p in points:
        dist = _haversine(lat, lon, p.latitude, p.longitude)
        direction = _bearing(lat, lon, p.latitude, p.longitude)
        # Walking speed ~5 km/h
        time_min = max(1, int((dist / 5.0) * 60))
        routes.append(
            EvacuationRoute(
                safe_point={
                    "id": p.id,
                    "name": p.name,
                    "type": p.point_type,
                    "latitude": p.latitude,
                    "longitude": p.longitude,
                    "address": p.address,
                    "phone": p.phone,
                },
                distance_km=round(dist, 1),
                bearing=direction,
                estimated_time_min=time_min,
            )
        )

    routes.sort(key=lambda r: r.distance_km)
    return routes[:limit]
