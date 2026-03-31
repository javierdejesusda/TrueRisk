"""ARPSI flood zone service -- spatial queries without PostGIS.

Checks whether a coordinate falls within a government-designated flood risk
zone (ARPSI = Areas de Riesgo Potencial Significativo de Inundacion) using
a two-step approach: SQL bounding-box filter followed by Shapely
point-in-polygon tests.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass

from shapely.geometry import Point, shape
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.arpsi_flood_zone import ArpsiFloodZone

logger = logging.getLogger(__name__)

# Return-period severity ordering (lower index = more severe).
_RETURN_PERIOD_SEVERITY: dict[str, int] = {
    "T10": 0,
    "T50": 1,
    "T100": 2,
    "T500": 3,
}

# Approximate metres per degree of latitude at mid-latitudes.
_DEG_TO_M = 111_320.0


# Result type


@dataclass
class FloodZoneResult:
    """Result of checking whether a point lies in a flood zone."""

    in_flood_zone: bool
    zone_id: str | None = None
    zone_name: str | None = None
    zone_type: str | None = None  # fluvial, pluvial, coastal
    return_period: str | None = None  # T10, T100, T500
    risk_level: str | None = None  # high, medium, low
    distance_to_nearest_zone_m: float | None = None


# Internal helpers


def _parse_geometry(geojson_str: str):
    """Parse a GeoJSON geometry string into a Shapely geometry object.

    Returns *None* when the string cannot be parsed.
    """
    try:
        geom = json.loads(geojson_str)
        return shape(geom)
    except Exception:
        logger.warning("Failed to parse geometry_geojson: %.80s...", geojson_str)
        return None


def _return_period_rank(period: str | None) -> int:
    """Return a severity rank for a return period (lower = more severe)."""
    if period is None:
        return 999
    return _RETURN_PERIOD_SEVERITY.get(period.upper().strip(), 500)


# Public API


async def check_flood_zone(
    lat: float,
    lon: float,
    db: AsyncSession,
) -> FloodZoneResult:
    """Check whether a coordinate lies inside an ARPSI flood zone.

    1. SQL bounding-box filter to find candidate zones.
    2. Shapely point-in-polygon for each candidate.
    3. If inside multiple zones, return the one with the shortest (most
       severe) return period.
    4. If not inside any zone, delegate to :func:`find_nearest_flood_zone`.
    """
    try:
        # Step 1: bounding-box filter
        stmt = (
            select(ArpsiFloodZone)
            .where(ArpsiFloodZone.min_lat <= lat)
            .where(ArpsiFloodZone.max_lat >= lat)
            .where(ArpsiFloodZone.min_lon <= lon)
            .where(ArpsiFloodZone.max_lon >= lon)
        )
        result = await db.execute(stmt)
        candidates = result.scalars().all()

        if not candidates:
            return await find_nearest_flood_zone(lat, lon, db)

        # Step 2: precise point-in-polygon
        point = Point(lon, lat)
        matching_zones: list[ArpsiFloodZone] = []

        for zone in candidates:
            geom = _parse_geometry(zone.geometry_geojson)
            if geom is None:
                continue
            if geom.contains(point) or point.within(geom):
                matching_zones.append(zone)

        if not matching_zones:
            return await find_nearest_flood_zone(lat, lon, db)

        # Step 3: pick the most severe zone (shortest return period)
        matching_zones.sort(key=lambda z: _return_period_rank(z.return_period))
        best = matching_zones[0]

        logger.info(
            "Point (%.5f, %.5f) is inside flood zone %s (%s, %s)",
            lat,
            lon,
            best.zone_id,
            best.zone_type,
            best.return_period,
        )

        return FloodZoneResult(
            in_flood_zone=True,
            zone_id=best.zone_id,
            zone_name=best.zone_name,
            zone_type=best.zone_type,
            return_period=best.return_period,
            risk_level=best.risk_level,
            distance_to_nearest_zone_m=0.0,
        )
    except Exception:
        logger.exception("ARPSI flood zone check failed for (%s, %s)", lat, lon)
        return FloodZoneResult(in_flood_zone=False)


async def find_nearest_flood_zone(
    lat: float,
    lon: float,
    db: AsyncSession,
    search_radius_deg: float = 0.05,
) -> FloodZoneResult:
    """Find the nearest ARPSI flood zone within *search_radius_deg*.

    Queries zones whose bounding boxes overlap with an expanded search
    window, then computes the minimum distance from the point to each
    zone's polygon boundary.  Distance in degrees is converted to
    approximate metres using ``dist_deg * 111320``.

    Returns a :class:`FloodZoneResult` with ``in_flood_zone=False`` and
    the distance to the closest zone.  If no zones are found within the
    search radius, distance fields are left as *None*.
    """
    try:
        stmt = (
            select(ArpsiFloodZone)
            .where(ArpsiFloodZone.min_lat <= lat + search_radius_deg)
            .where(ArpsiFloodZone.max_lat >= lat - search_radius_deg)
            .where(ArpsiFloodZone.min_lon <= lon + search_radius_deg)
            .where(ArpsiFloodZone.max_lon >= lon - search_radius_deg)
        )
        result = await db.execute(stmt)
        candidates = result.scalars().all()

        if not candidates:
            logger.debug(
                "No flood zones found within %.3f deg of (%.5f, %.5f)",
                search_radius_deg,
                lat,
                lon,
            )
            return FloodZoneResult(in_flood_zone=False)

        point = Point(lon, lat)
        nearest_zone: ArpsiFloodZone | None = None
        nearest_dist_deg: float = float("inf")

        for zone in candidates:
            geom = _parse_geometry(zone.geometry_geojson)
            if geom is None:
                continue
            dist = point.distance(geom)
            if dist < nearest_dist_deg:
                nearest_dist_deg = dist
                nearest_zone = zone

        if nearest_zone is None:
            return FloodZoneResult(in_flood_zone=False)

        dist_m = nearest_dist_deg * _DEG_TO_M

        logger.info(
            "Nearest flood zone to (%.5f, %.5f): %s at ~%.0f m",
            lat,
            lon,
            nearest_zone.zone_id,
            dist_m,
        )

        return FloodZoneResult(
            in_flood_zone=False,
            zone_id=nearest_zone.zone_id,
            zone_name=nearest_zone.zone_name,
            zone_type=nearest_zone.zone_type,
            return_period=nearest_zone.return_period,
            risk_level=nearest_zone.risk_level,
            distance_to_nearest_zone_m=round(dist_m, 1),
        )
    except Exception:
        logger.exception(
            "ARPSI nearest flood zone search failed for (%s, %s)", lat, lon
        )
        return FloodZoneResult(in_flood_zone=False)
