"""Safety check service -- check-in, family links, and status queries."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta

from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.safety_check import SafetyCheckIn, FamilyLink
from app.models.user import User
from app.models.push_subscription import PushSubscription
from app.schemas.safety_check import SafetyCheckInCreate
from app.services.push_service import send_push

logger = logging.getLogger(__name__)


async def _send_push_to_user(db: AsyncSession, user_id: int, payload: dict) -> None:
    """Send push notifications to all active subscriptions for a given user's province."""
    user = await db.get(User, user_id)
    if not user:
        return
    result = await db.execute(
        select(PushSubscription).where(
            PushSubscription.province_code == user.province_code,
            PushSubscription.is_active == True,  # noqa: E712
        )
    )
    subs = list(result.scalars().all())
    for sub in subs:
        subscription_info = {
            "endpoint": sub.endpoint,
            "keys": {"p256dh": sub.p256dh_key, "auth": sub.auth_key},
        }
        await send_push(subscription_info, payload)


async def check_in(
    db: AsyncSession, user_id: int, data: SafetyCheckInCreate
) -> SafetyCheckIn:
    """Create a safety check-in and notify linked family members."""
    user = await db.get(User, user_id)
    now = datetime.utcnow()
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

    # Notify all accepted linked users
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

    nickname = user.nickname if user else "Usuario"
    payload = {
        "title": "Estoy a salvo",
        "body": f"{nickname} se ha marcado como {data.status}",
        "tag": f"safety-{user_id}",
        "url": "/safety",
    }

    for link in links:
        target_id = link.linked_user_id if link.user_id == user_id else link.user_id
        await _send_push_to_user(db, target_id, payload)

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

    now = datetime.utcnow()
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
    db: AsyncSession, user_id: int, target_nickname: str
) -> FamilyLink:
    """Create a pending family link by target nickname."""
    result = await db.execute(
        select(User).where(User.nickname == target_nickname)
    )
    target = result.scalar_one_or_none()
    if not target:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="User not found")

    link = FamilyLink(
        user_id=user_id,
        linked_user_id=target.id,
        relationship="family",
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
    """Request a linked user to check in."""
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

    payload = {
        "title": "Tu familia quiere saber que estas bien",
        "body": "Marca tu estado de seguridad",
        "tag": "safety-request",
        "url": "/safety",
    }
    await _send_push_to_user(db, target_user_id, payload)


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
