"""Community reports API router."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user, get_optional_user
from app.models.user import User
from app.schemas.community import CommunityReportCreate, CommunityReportResponse
from app.services import community_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/reports",
    response_model=CommunityReportResponse,
    status_code=201,
    summary="Submit hazard report",
    description="Submit a new community-sourced hazard observation report.",
)
async def create_report(
    body: CommunityReportCreate,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    """Submit a new community hazard report."""
    user_id = user.id if user else None
    try:
        report = await community_service.create_report(db, body, user_id=user_id)
    except Exception:
        await db.rollback()
        logger.exception("Failed to create community report")
        raise HTTPException(status_code=500, detail="Failed to create report")
    return report


@router.get(
    "/reports",
    response_model=list[CommunityReportResponse],
    summary="List community reports",
    description="List active community reports with optional province or bounding box filter.",
)
async def list_reports(
    province: str | None = Query(default=None),
    min_lat: float | None = Query(default=None),
    max_lat: float | None = Query(default=None),
    min_lon: float | None = Query(default=None),
    max_lon: float | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """List active community reports with optional province or bounding box filter."""
    bbox = None
    if all(v is not None for v in [min_lat, max_lat, min_lon, max_lon]):
        bbox = (min_lat, max_lat, min_lon, max_lon)

    try:
        reports = await community_service.get_reports(db, province_code=province, bbox=bbox)
    except Exception:
        logger.exception("Failed to list community reports")
        return []
    return reports


@router.post("/reports/{report_id}/upvote", response_model=CommunityReportResponse)
async def upvote_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Upvote a community report."""
    try:
        report = await community_service.upvote_report(db, report_id)
    except Exception:
        await db.rollback()
        logger.exception("Failed to upvote report %d", report_id)
        raise HTTPException(status_code=500, detail="Failed to upvote report")
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.post("/reports/{report_id}/verify", response_model=CommunityReportResponse)
async def verify_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Verify a community report. Requires authentication."""
    try:
        report = await community_service.verify_report(db, report_id, user.id)
    except HTTPException:
        raise
    except Exception:
        await db.rollback()
        logger.exception("Failed to verify report %d", report_id)
        raise HTTPException(status_code=500, detail="Failed to verify report")
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
