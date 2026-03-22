"""Safety check service -- check-in, family links, and status queries."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.safety_check import SafetyCheckIn, FamilyLink
from app.models.user import User
from app.schemas.safety_check import SafetyCheckInCreate

logger = logging.getLogger(__name__)


async def check_in(
    db: AsyncSession, user_id: int, data: SafetyCheckInCreate
) -> SafetyCheckIn:
    """Create a safety check-in record.

    TODO: Notify linked family members via push once PushSubscription has a
    user_id column for per-user targeting.
    """
    user = await db.get(User, user_id)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=12)

    record = SafetyCheckIn(
        user_id=user_id,
        province_code=user.province_code if user else "28",
        latitude=data.latitude,
        longitude=data.longitude,
        status=data.status,
        message=data.message,
        expires_at=expires_at,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    return record


async def get_family_status(db: AsyncSession, user_id: int) -> list[dict]:
    """Return linked users with their latest non-expired check-in."""
    links_result = await db.execute(
        select(FamilyLink).where(
            FamilyLink.status == "accepted",
            or_(
                FamilyLink.user_id == user_id,
                FamilyLink.linked_user_id == user_id,
            ),
        )
    )
    links = list(links_result.scalars().all())

    now = datetime.now(timezone.utc)
    statuses = []

    for link in links:
        other_id = link.linked_user_id if link.user_id == user_id else link.user_id
        other_user = await db.get(User, other_id)
        if not other_user:
            continue

        # Get latest non-expired check-in for this linked user
        checkin_result = await db.execute(
            select(SafetyCheckIn)
            .where(
                SafetyCheckIn.user_id == other_id,
                SafetyCheckIn.expires_at > now,
            )
            .order_by(SafetyCheckIn.checked_in_at.desc())
            .limit(1)
        )
        latest = checkin_result.scalar_one_or_none()

        statuses.append(
            {
                "user_id": other_user.id,
                "nickname": other_user.nickname or "",
                "display_name": other_user.display_name,
                "latest_check_in": latest,
                "relationship": link.relationship,
            }
        )

    return statuses


async def create_link(
    db: AsyncSession,
    user_id: int,
    target_nickname: str,
    relationship: str = "family",
) -> FamilyLink:
    """Create a pending family link by target nickname."""
    from fastapi import HTTPException

    result = await db.execute(
        select(User).where(User.nickname == target_nickname)
    )
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if target.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot link to yourself")

    existing = await db.execute(
        select(FamilyLink).where(
            or_(
                and_(FamilyLink.user_id == user_id, FamilyLink.linked_user_id == target.id),
                and_(FamilyLink.user_id == target.id, FamilyLink.linked_user_id == user_id),
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Link already exists")

    link = FamilyLink(
        user_id=user_id,
        linked_user_id=target.id,
        relationship=relationship,
        status="pending",
    )
    db.add(link)
    await db.commit()
    await db.refresh(link)
    return link


async def accept_link(db: AsyncSession, user_id: int, link_id: int) -> FamilyLink:
    """Accept a pending family link (only the linked_user can accept)."""
    result = await db.execute(
        select(FamilyLink).where(
            FamilyLink.id == link_id,
            FamilyLink.linked_user_id == user_id,
            FamilyLink.status == "pending",
        )
    )
    link = result.scalar_one_or_none()
    if not link:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Link not found")

    link.status = "accepted"
    await db.commit()
    await db.refresh(link)
    return link


async def delete_link(db: AsyncSession, user_id: int, link_id: int) -> None:
    """Delete a family link (either party can delete)."""
    result = await db.execute(
        select(FamilyLink).where(
            FamilyLink.id == link_id,
            or_(
                FamilyLink.user_id == user_id,
                FamilyLink.linked_user_id == user_id,
            ),
        )
    )
    link = result.scalar_one_or_none()
    if not link:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Link not found")

    await db.delete(link)
    await db.commit()


async def request_check_in(
    db: AsyncSession, user_id: int, target_user_id: int
) -> None:
    """Request a linked user to check in.

    TODO: Send push notification once PushSubscription has a user_id column
    for per-user targeting.
    """
    result = await db.execute(
        select(FamilyLink).where(
            FamilyLink.status == "accepted",
            or_(
                and_(
                    FamilyLink.user_id == user_id,
                    FamilyLink.linked_user_id == target_user_id,
                ),
                and_(
                    FamilyLink.user_id == target_user_id,
                    FamilyLink.linked_user_id == user_id,
                ),
            ),
        )
    )
    link = result.scalar_one_or_none()
    if not link:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="No accepted link with this user")


async def get_check_in_history(
    db: AsyncSession, user_id: int, limit: int = 20
) -> list[SafetyCheckIn]:
    """Return latest check-ins for the user."""
    result = await db.execute(
        select(SafetyCheckIn)
        .where(SafetyCheckIn.user_id == user_id)
        .order_by(SafetyCheckIn.checked_in_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())
