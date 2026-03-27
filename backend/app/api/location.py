"""Location API – update user GPS position and derive province from coordinates."""

from __future__ import annotations

from datetime import timedelta

from app.utils.time import utcnow

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.data.province_data import PROVINCES
from app.models.user import User
from app.services.province_lookup_service import find_province, haversine

router = APIRouter()

# Backward-compatible aliases for existing importers
find_nearest_province = find_province
_haversine = haversine


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class LocationUpdateRequest(BaseModel):
    lat: float
    lon: float


class LocationUpdateResponse(BaseModel):
    province_code: str
    distance_km: float


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/update", response_model=LocationUpdateResponse)
async def update_location(
    body: LocationUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LocationUpdateResponse:
    """
    Update the authenticated user's last known GPS location.

    Determines which Spanish province the coordinates belong to using
    point-in-polygon against real province boundaries, and returns that
    province code together with the distance to the province centroid.
    """
    province_code = find_province(body.lat, body.lon)
    province_data = PROVINCES[province_code]
    distance_km = _haversine(
        body.lat, body.lon, province_data["latitude"], province_data["longitude"]
    )

    user.last_latitude = body.lat
    user.last_longitude = body.lon
    user.last_location_at = utcnow()
    db.add(user)
    await db.commit()

    return LocationUpdateResponse(province_code=province_code, distance_km=round(distance_km, 2))


@router.get("/current-province")
async def current_province(
    user: User = Depends(get_current_user),
) -> dict:
    """
    Return the province that should be used for alert delivery for this user.

    Prefers the GPS-derived province when a recent location fix (within 1 hour)
    is available; otherwise falls back to the user's registered home province.
    """
    one_hour_ago = utcnow() - timedelta(hours=1)

    if (
        user.last_latitude is not None
        and user.last_longitude is not None
        and user.last_location_at is not None
        and user.last_location_at >= one_hour_ago
    ):
        gps_province = find_province(user.last_latitude, user.last_longitude)
        return {
            "province_code": gps_province,
            "source": "gps",
            "home_province_code": user.province_code,
        }

    return {
        "province_code": user.province_code,
        "source": "home",
        "home_province_code": user.province_code,
    }
