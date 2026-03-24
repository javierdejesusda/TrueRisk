"""Location API – update user GPS position and derive province from coordinates."""

from __future__ import annotations

import math
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.data.province_data import PROVINCES
from app.models.user import User

router = APIRouter()

# ---------------------------------------------------------------------------
# Province lookup by nearest centroid (Haversine approximation)
# ---------------------------------------------------------------------------

def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return great-circle distance in kilometres between two points."""
    r = 6_371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def find_nearest_province(lat: float, lon: float) -> str:
    """Return the INE 2-digit province code whose centroid is closest to (lat, lon)."""
    best_code = "28"  # Madrid as fallback
    best_dist = float("inf")
    for code, data in PROVINCES.items():
        dist = _haversine(lat, lon, data["latitude"], data["longitude"])
        if dist < best_dist:
            best_dist = dist
            best_code = code
    return best_code


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

    Determines which Spanish province the coordinates belong to (nearest-centroid
    approximation) and returns that province code together with the distance to
    the centroid.  The user's ``last_latitude``, ``last_longitude`` and
    ``last_location_at`` fields are persisted so that alert matching can use the
    physical location rather than the registered home province.
    """
    province_code = find_nearest_province(body.lat, body.lon)
    province_data = PROVINCES[province_code]
    distance_km = _haversine(
        body.lat, body.lon, province_data["latitude"], province_data["longitude"]
    )

    user.last_latitude = body.lat
    user.last_longitude = body.lon
    user.last_location_at = datetime.now(timezone.utc)
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
    from datetime import timedelta

    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)

    if (
        user.last_latitude is not None
        and user.last_longitude is not None
        and user.last_location_at is not None
        and user.last_location_at.replace(tzinfo=timezone.utc) >= one_hour_ago
    ):
        gps_province = find_nearest_province(user.last_latitude, user.last_longitude)
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
