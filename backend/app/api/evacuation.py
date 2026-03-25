"""Evacuation routing API."""

from dataclasses import asdict

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.evacuation_route import SafePoint
from app.services.evacuation_service import find_nearest_safe_points

router = APIRouter()


@router.get("/routes")
async def get_evacuation_routes(
    lat: float = Query(...),
    lon: float = Query(...),
    province: str | None = Query(default=None),
    type: str | None = Query(default=None),
    limit: int = Query(default=5, le=10),
    db: AsyncSession = Depends(get_db),
):
    """Find nearest safe points with distance and direction."""
    routes = await find_nearest_safe_points(db, lat, lon, province, type, limit)
    return [asdict(r) for r in routes]


@router.get("/safe-points")
async def get_safe_points(
    province: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """List all safe points, optionally filtered by province."""
    stmt = select(SafePoint).where(SafePoint.is_active == True)  # noqa: E712
    if province:
        stmt = stmt.where(SafePoint.province_code == province)
    result = await db.execute(stmt)
    points = result.scalars().all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "type": p.point_type,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "address": p.address,
            "phone": p.phone,
            "province_code": p.province_code,
        }
        for p in points
    ]
