"""Property risk report API router -- geocoding, risk computation, and report management."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, get_optional_user
from app.data.province_data import PROVINCES
from app.models.property_report import PropertyReport
from app.models.user import User
from app.rate_limit import limiter
from app.schemas.property import (
    FloodZoneDetail,
    GeocodingResponse,
    HazardScoreDetail,
    PropertyReportListItem,
    PropertyReportRequest,
    PropertyReportResponse,
    TerrainDetail,
    WildfireProximityDetail,
)
from app.services.arpsi_service import check_flood_zone
from app.services.geocoding_service import geocode_address
from app.services.property_risk_service import compute_property_risk

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Rate-limit key helpers
# ---------------------------------------------------------------------------


def _rate_key_report(request: Request) -> str:
    """Return user ID if authenticated, else remote address for rate limiting."""
    auth = request.headers.get("authorization", "")
    token_query = request.query_params.get("token")
    if auth.startswith("Bearer ") or token_query:
        # Authenticated users get a per-user key; extract lazily from header
        # We prefix with "user:" to avoid collision with IP-based keys
        token = auth.removeprefix("Bearer ").strip() if auth.startswith("Bearer ") else token_query
        return f"user:{token}"
    from app.security.real_ip import get_real_ip
    return get_real_ip(request)


def _rate_key_geocode(request: Request) -> str:
    """Rate-limit key for the geocode endpoint."""
    from app.security.real_ip import get_real_ip
    return get_real_ip(request)


# ---------------------------------------------------------------------------
# POST /report -- create a new property risk report
# ---------------------------------------------------------------------------


class _ReportRateLimit:
    """Custom rate limit string based on authentication status."""


@router.post("/report", response_model=PropertyReportResponse)
@limiter.limit("20/hour", key_func=_rate_key_report)
async def create_report(
    request: Request,
    body: PropertyReportRequest,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    """Geocode an address, compute property-level risk, and save a report."""
    # 1. Geocode the address
    geo = await geocode_address(body.address, db)
    if geo is None:
        raise HTTPException(
            status_code=422,
            detail="Could not geocode the provided address. Please check the address and try again.",
        )

    # 2. Compute property-level risk
    risk = await compute_property_risk(geo.latitude, geo.longitude, geo.province_code, db)

    # 3. Generate report ID and timestamps
    report_id = str(uuid.uuid4())
    now = datetime.utcnow()
    expires = now + timedelta(days=30)

    # 4. Save to database
    report = PropertyReport(
        report_id=report_id,
        user_id=user.id if user else None,
        address_text=body.address,
        formatted_address=geo.formatted_address,
        latitude=geo.latitude,
        longitude=geo.longitude,
        province_code=geo.province_code,
        municipality_code=geo.municipality_code,
        flood_score=risk.flood.score,
        wildfire_score=risk.wildfire.score,
        drought_score=risk.drought.score,
        heatwave_score=risk.heatwave.score,
        seismic_score=risk.seismic.score,
        coldwave_score=risk.coldwave.score,
        windstorm_score=risk.windstorm.score,
        composite_score=risk.composite_score,
        dominant_hazard=risk.dominant_hazard,
        severity=risk.severity,
        flood_details={
            "in_flood_zone": risk.flood_zone.in_flood_zone,
            "zone_id": risk.flood_zone.zone_id,
            "zone_name": risk.flood_zone.zone_name,
            "zone_type": risk.flood_zone.zone_type,
            "return_period": risk.flood_zone.return_period,
            "risk_level": risk.flood_zone.risk_level,
            "distance_to_nearest_zone_m": risk.flood_zone.distance_to_nearest_zone_m,
        },
        wildfire_details={
            "modifier": risk.wildfire.modifier,
            "explanation": risk.wildfire.explanation,
        },
        terrain_details={
            "elevation_m": risk.terrain.elevation_m,
            "slope_pct": risk.terrain.slope_pct,
        },
        province_flood_score=risk.flood.province_score,
        province_wildfire_score=risk.wildfire.province_score,
        province_composite_score=0.0,
        province_severity="low",
        computed_at=now,
        expires_at=expires,
        access_count=0,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    # 5. Build and return response
    return _build_report_response(report, risk)


# ---------------------------------------------------------------------------
# GET /report/{report_id} -- public shareable link
# ---------------------------------------------------------------------------


@router.get("/report/{report_id}", response_model=PropertyReportResponse)
async def get_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a property risk report by its public ID."""
    result = await db.execute(
        select(PropertyReport).where(PropertyReport.report_id == report_id)
    )
    report = result.scalar_one_or_none()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    # Increment access count
    report.access_count = (report.access_count or 0) + 1
    await db.commit()
    await db.refresh(report)

    return _build_report_response_from_db(report)


# ---------------------------------------------------------------------------
# GET /reports -- authenticated paginated user history
# ---------------------------------------------------------------------------


@router.get("/reports", response_model=list[PropertyReportListItem])
async def list_reports(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List the current user's property risk reports (paginated, newest first)."""
    offset = (page - 1) * per_page
    result = await db.execute(
        select(PropertyReport)
        .where(PropertyReport.user_id == user.id)
        .order_by(PropertyReport.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    reports = result.scalars().all()

    return [
        PropertyReportListItem(
            report_id=r.report_id,
            address_text=r.address_text,
            formatted_address=r.formatted_address,
            composite_score=r.composite_score,
            severity=r.severity,
            dominant_hazard=r.dominant_hazard,
            computed_at=r.computed_at.isoformat(),
        )
        for r in reports
    ]


# ---------------------------------------------------------------------------
# POST /geocode -- address geocoding only
# ---------------------------------------------------------------------------


class GeocodeRequest(BaseModel):
    address: str


@router.post("/geocode", response_model=GeocodingResponse)
@limiter.limit("10/hour", key_func=_rate_key_geocode)
async def geocode(
    request: Request,
    body: GeocodeRequest,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    """Geocode a Spanish address without generating a risk report."""
    geo = await geocode_address(body.address, db)
    if geo is None:
        raise HTTPException(
            status_code=422,
            detail="Could not geocode the provided address.",
        )

    return GeocodingResponse(
        formatted_address=geo.formatted_address,
        latitude=geo.latitude,
        longitude=geo.longitude,
        province_code=geo.province_code,
        municipality_code=geo.municipality_code,
        confidence=geo.confidence,
    )


# ---------------------------------------------------------------------------
# GET /arpsi/check -- flood zone check by coordinates
# ---------------------------------------------------------------------------


@router.get("/arpsi/check", response_model=FloodZoneDetail)
async def arpsi_check(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    db: AsyncSession = Depends(get_db),
):
    """Check whether a coordinate falls inside an ARPSI flood zone."""
    result = await check_flood_zone(lat, lon, db)
    return FloodZoneDetail(
        in_arpsi_zone=result.in_flood_zone,
        zone_id=result.zone_id,
        zone_name=result.zone_name,
        zone_type=result.zone_type,
        return_period=result.return_period,
        risk_level=result.risk_level,
        distance_to_nearest_zone_m=result.distance_to_nearest_zone_m,
    )


# ---------------------------------------------------------------------------
# GET /report/{report_id}/pdf -- stub (501 Not Implemented)
# ---------------------------------------------------------------------------


@router.get("/report/{report_id}/pdf")
async def get_report_pdf(report_id: str):
    """Download a PDF report (not yet implemented)."""
    raise HTTPException(
        status_code=501,
        detail="PDF generation is not yet implemented.",
    )


# ---------------------------------------------------------------------------
# Response builders
# ---------------------------------------------------------------------------


def _build_report_response(
    report: PropertyReport,
    risk,
) -> PropertyReportResponse:
    """Build a PropertyReportResponse from a fresh report and risk result."""
    return PropertyReportResponse(
        report_id=report.report_id,
        address_text=report.address_text,
        formatted_address=report.formatted_address,
        latitude=report.latitude,
        longitude=report.longitude,
        province_code=report.province_code,
        province_name=PROVINCES.get(report.province_code, {}).get("name", "Unknown"),
        municipality_code=report.municipality_code,
        composite_score=risk.composite_score,
        dominant_hazard=risk.dominant_hazard,
        severity=risk.severity,
        flood=HazardScoreDetail(
            score=risk.flood.score,
            severity=risk.flood.severity,
            province_score=risk.flood.province_score,
            modifier=risk.flood.modifier,
            explanation=risk.flood.explanation,
        ),
        wildfire=HazardScoreDetail(
            score=risk.wildfire.score,
            severity=risk.wildfire.severity,
            province_score=risk.wildfire.province_score,
            modifier=risk.wildfire.modifier,
            explanation=risk.wildfire.explanation,
        ),
        heatwave=HazardScoreDetail(
            score=risk.heatwave.score,
            severity=risk.heatwave.severity,
            province_score=risk.heatwave.province_score,
            modifier=risk.heatwave.modifier,
            explanation=risk.heatwave.explanation,
        ),
        drought=HazardScoreDetail(
            score=risk.drought.score,
            severity=risk.drought.severity,
            province_score=risk.drought.province_score,
            modifier=risk.drought.modifier,
            explanation=risk.drought.explanation,
        ),
        coldwave=HazardScoreDetail(
            score=risk.coldwave.score,
            severity=risk.coldwave.severity,
            province_score=risk.coldwave.province_score,
            modifier=risk.coldwave.modifier,
            explanation=risk.coldwave.explanation,
        ),
        windstorm=HazardScoreDetail(
            score=risk.windstorm.score,
            severity=risk.windstorm.severity,
            province_score=risk.windstorm.province_score,
            modifier=risk.windstorm.modifier,
            explanation=risk.windstorm.explanation,
        ),
        seismic=HazardScoreDetail(
            score=risk.seismic.score,
            severity=risk.seismic.severity,
            province_score=risk.seismic.province_score,
            modifier=risk.seismic.modifier,
            explanation=risk.seismic.explanation,
        ),
        flood_zone=FloodZoneDetail(
            in_arpsi_zone=risk.flood_zone.in_flood_zone,
            zone_id=risk.flood_zone.zone_id,
            zone_name=risk.flood_zone.zone_name,
            zone_type=risk.flood_zone.zone_type,
            return_period=risk.flood_zone.return_period,
            risk_level=risk.flood_zone.risk_level,
            distance_to_nearest_zone_m=risk.flood_zone.distance_to_nearest_zone_m,
        ),
        wildfire_proximity=WildfireProximityDetail(
            elevation_m=risk.terrain.elevation_m,
            slope_pct=risk.terrain.slope_pct,
            modifier=risk.wildfire.modifier,
            explanation=risk.wildfire.explanation,
        ),
        terrain=TerrainDetail(
            elevation_m=risk.terrain.elevation_m,
            slope_pct=risk.terrain.slope_pct,
        ),
        computed_at=report.computed_at.isoformat(),
        expires_at=report.expires_at.isoformat() if report.expires_at else None,
        pdf_available=report.pdf_url is not None,
        share_url=f"/report/{report.report_id}",
    )


def _build_report_response_from_db(report: PropertyReport) -> PropertyReportResponse:
    """Build a PropertyReportResponse from a database-loaded report (no live risk data)."""
    from app.services.property_risk_service import severity_from_score

    flood_details = report.flood_details or {}
    wildfire_details = report.wildfire_details or {}
    terrain_details = report.terrain_details or {}

    elevation_m = terrain_details.get("elevation_m", 0.0)
    slope_pct = terrain_details.get("slope_pct", 0.0)

    return PropertyReportResponse(
        report_id=report.report_id,
        address_text=report.address_text,
        formatted_address=report.formatted_address,
        latitude=report.latitude,
        longitude=report.longitude,
        province_code=report.province_code,
        province_name=PROVINCES.get(report.province_code, {}).get("name", "Unknown"),
        municipality_code=report.municipality_code,
        composite_score=report.composite_score,
        dominant_hazard=report.dominant_hazard,
        severity=report.severity,
        flood=HazardScoreDetail(
            score=report.flood_score,
            severity=severity_from_score(report.flood_score),
            province_score=report.province_flood_score,
            modifier=0.0,
            explanation="",
        ),
        wildfire=HazardScoreDetail(
            score=report.wildfire_score,
            severity=severity_from_score(report.wildfire_score),
            province_score=report.province_wildfire_score,
            modifier=wildfire_details.get("modifier", 0.0),
            explanation=wildfire_details.get("explanation", ""),
        ),
        heatwave=HazardScoreDetail(
            score=report.heatwave_score,
            severity=severity_from_score(report.heatwave_score),
            province_score=0.0,
            modifier=0.0,
            explanation="",
        ),
        drought=HazardScoreDetail(
            score=report.drought_score,
            severity=severity_from_score(report.drought_score),
            province_score=0.0,
            modifier=1.0,
            explanation="Drought risk is province-wide (water infrastructure dependent)",
        ),
        coldwave=HazardScoreDetail(
            score=report.coldwave_score,
            severity=severity_from_score(report.coldwave_score),
            province_score=0.0,
            modifier=0.0,
            explanation="",
        ),
        windstorm=HazardScoreDetail(
            score=report.windstorm_score,
            severity=severity_from_score(report.windstorm_score),
            province_score=0.0,
            modifier=0.0,
            explanation="",
        ),
        seismic=HazardScoreDetail(
            score=report.seismic_score,
            severity=severity_from_score(report.seismic_score),
            province_score=0.0,
            modifier=1.0,
            explanation="Seismic risk is geology-based and does not vary within the province",
        ),
        flood_zone=FloodZoneDetail(
            in_arpsi_zone=flood_details.get("in_flood_zone", False),
            zone_id=flood_details.get("zone_id"),
            zone_name=flood_details.get("zone_name"),
            zone_type=flood_details.get("zone_type"),
            return_period=flood_details.get("return_period"),
            risk_level=flood_details.get("risk_level"),
            distance_to_nearest_zone_m=flood_details.get("distance_to_nearest_zone_m"),
        ),
        wildfire_proximity=WildfireProximityDetail(
            elevation_m=elevation_m,
            slope_pct=slope_pct,
            modifier=wildfire_details.get("modifier", 0.0),
            explanation=wildfire_details.get("explanation", ""),
        ),
        terrain=TerrainDetail(
            elevation_m=elevation_m,
            slope_pct=slope_pct,
        ),
        computed_at=report.computed_at.isoformat(),
        expires_at=report.expires_at.isoformat() if report.expires_at else None,
        pdf_available=report.pdf_url is not None,
        share_url=f"/report/{report.report_id}",
    )
