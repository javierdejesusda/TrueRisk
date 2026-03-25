"""Community reports service -- CRUD for citizen-submitted hazard reports."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.community_report import CommunityReport, ReportVerification
from app.schemas.community import CommunityReportCreate

logger = logging.getLogger(__name__)


async def create_report(
    db: AsyncSession, data: CommunityReportCreate, user_id: int | None = None
) -> CommunityReport:
    """Create a new community report with auto-expiry."""
    now = datetime.utcnow()

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
        urgency=data.urgency,
        photo_url=data.photo_url,
        reporter_user_id=user_id,
        expires_at=expires_at,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    # Award gamification points for submitting a report
    if user_id is not None:
        try:
            from app.services.gamification_service import award_points
            await award_points(db, user_id, "community_report")
            await db.commit()
        except Exception:
            logger.exception("Failed to award gamification points for community report")

    return report


async def get_reports(
    db: AsyncSession,
    province_code: str | None = None,
    bbox: tuple | None = None,
) -> list[CommunityReport]:
    """Return non-expired community reports, optionally filtered by province or bounding box."""
    now = datetime.utcnow()
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


async def verify_report(
    db: AsyncSession, report_id: int, user_id: int
) -> CommunityReport | None:
    """Increment verified_count for a report. Auto-verifies at 3+. Returns None if not found."""
    report = await db.get(CommunityReport, report_id)
    if report is None:
        return None

    # Prevent self-verification
    if report.reporter_user_id == user_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Cannot verify your own report")

    # Prevent duplicate verification by the same user
    existing = (
        await db.execute(
            select(ReportVerification).where(
                ReportVerification.report_id == report_id,
                ReportVerification.user_id == user_id,
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        from fastapi import HTTPException
        raise HTTPException(status_code=409, detail="Already verified by this user")

    db.add(ReportVerification(report_id=report_id, user_id=user_id))
    report.verified_count += 1
    if report.verified_count >= 3:
        report.is_verified = True

    await db.commit()
    await db.refresh(report)

    # Award gamification points for verifying a report
    try:
        from app.services.gamification_service import award_points
        await award_points(db, user_id, "report_verification")
        await db.commit()
    except Exception:
        logger.exception("Failed to award gamification points for report verification")

    return report
