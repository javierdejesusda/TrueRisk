"""Community reports service -- CRUD for citizen-submitted hazard reports."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.community_report import CommunityReport
from app.schemas.community import CommunityReportCreate

logger = logging.getLogger(__name__)


async def create_report(
    db: AsyncSession, data: CommunityReportCreate
) -> CommunityReport:
    """Create a new community report with auto-expiry."""
    now = datetime.now(timezone.utc)

    if data.hazard_type == "structural_damage":
        expires_at = now + timedelta(hours=24)
    else:
        expires_at = now + timedelta(hours=6)

    report = CommunityReport(
        province_code=data.province_code,
        hazard_type=data.hazard_type,
        severity=data.severity,
        latitude=data.latitude,
        longitude=data.longitude,
        description=data.description,
        expires_at=expires_at,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report


async def get_reports(
    db: AsyncSession,
    province_code: str | None = None,
    bbox: tuple | None = None,
) -> list[CommunityReport]:
    """Return non-expired community reports, optionally filtered by province or bounding box."""
    now = datetime.now(timezone.utc)
    stmt = (
        select(CommunityReport)
        .where(CommunityReport.expires_at > now)
        .order_by(CommunityReport.created_at.desc())
    )

    if province_code is not None:
        stmt = stmt.where(CommunityReport.province_code == province_code)

    if bbox is not None:
        min_lat, max_lat, min_lon, max_lon = bbox
        stmt = stmt.where(
            CommunityReport.latitude >= min_lat,
            CommunityReport.latitude <= max_lat,
            CommunityReport.longitude >= min_lon,
            CommunityReport.longitude <= max_lon,
        )

    result = await db.execute(stmt)
    return list(result.scalars().all())


async def upvote_report(
    db: AsyncSession, report_id: int
) -> CommunityReport | None:
    """Increment upvotes for a report. Returns None if not found."""
    report = await db.get(CommunityReport, report_id)
    if report is None:
        return None

    report.upvotes += 1
    await db.commit()
    await db.refresh(report)
    return report
