"""Community reports API router."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas.community import CommunityReportCreate, CommunityReportResponse
from app.services import community_service

router = APIRouter()


@router.post(
    "/reports",
    response_model=CommunityReportResponse,
    status_code=201,
    summary="Submit hazard report",
    description="Submit a new community-sourced hazard observation report.",
)
async def create_report(
    request: Request,
    body: CommunityReportCreate,
    db: AsyncSession = Depends(get_db),
):
    """Submit a new community hazard report."""
    report = await community_service.create_report(db, body)
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

    reports = await community_service.get_reports(db, province_code=province, bbox=bbox)
    return reports


@router.post("/reports/{report_id}/upvote", response_model=CommunityReportResponse)
async def upvote_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Upvote a community report."""
    report = await community_service.upvote_report(db, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
