"""B2B Insurance risk report API with API key authentication."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.api_key import ApiKey
from app.security.api_key_auth import verify_api_key
from app.services.insurance_report_service import generate_insurance_report

router = APIRouter()


@router.get("/report")
async def get_insurance_report(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    address: str = Query(default="", description="Optional address string"),
    api_key: ApiKey = Depends(verify_api_key),
    db: AsyncSession = Depends(get_db),
):
    """Generate a structured insurance risk report for a location.

    Requires a valid API key in the X-API-Key header.
    """
    report = await generate_insurance_report(db, lat, lon, address)
    report["partner"] = api_key.name
    return report


@router.get("/health")
async def insurance_api_health(api_key: ApiKey = Depends(verify_api_key)):
    """Check API key validity and usage stats."""
    return {
        "status": "active",
        "partner": api_key.name,
        "requests_made": api_key.request_count,
        "rate_limit_per_hour": api_key.rate_limit_per_hour,
    }
