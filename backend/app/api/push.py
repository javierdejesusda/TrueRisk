"""Push notifications API router."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_optional_user, get_current_user
from app.models.push_subscription import PushSubscription
from app.models.user import User
from app.schemas.push import PushSubscribeRequest, PushSubscribeResponse

router = APIRouter()


@router.post("/subscribe", response_model=PushSubscribeResponse, status_code=201)
async def subscribe(
    body: PushSubscribeRequest,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    """Register or reactivate a push subscription (upsert by endpoint)."""
    result = await db.execute(
        select(PushSubscription).where(PushSubscription.endpoint == body.endpoint)
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.province_code = body.province_code
        existing.p256dh_key = body.keys.p256dh
        existing.auth_key = body.keys.auth
        existing.is_active = True
        if user:
            existing.user_id = user.id
        await db.commit()
        await db.refresh(existing)
        return existing

    subscription = PushSubscription(
        province_code=body.province_code,
        endpoint=body.endpoint,
        p256dh_key=body.keys.p256dh,
        auth_key=body.keys.auth,
        user_id=user.id if user else None,
    )
    db.add(subscription)
    await db.commit()
    await db.refresh(subscription)
    return subscription


@router.post("/unsubscribe", status_code=200)
async def unsubscribe(
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a push subscription by endpoint."""
    endpoint = body.get("endpoint")
    if not endpoint:
        raise HTTPException(status_code=400, detail="endpoint is required")

    result = await db.execute(
        select(PushSubscription).where(
            PushSubscription.endpoint == endpoint,
            PushSubscription.is_active == True,  # noqa: E712
        )
    )
    subscription = result.scalar_one_or_none()

    if subscription is None:
        raise HTTPException(status_code=404, detail="Subscription not found")

    subscription.is_active = False
    await db.commit()
    return {"status": "unsubscribed"}


@router.post("/test", status_code=200)
async def test_push(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a test push notification to the authenticated user."""
    from app.config import settings
    from app.services.push_service import notify_user

    if not settings.vapid_private_key:
        raise HTTPException(status_code=503, detail="VAPID keys not configured")

    sent = await notify_user(
        db, user.id,
        title="TrueRisk Test",
        body="Push notifications are working correctly!",
    )
    if sent == 0:
        raise HTTPException(status_code=404, detail="No active push subscriptions found")
    return {"sent": sent}
