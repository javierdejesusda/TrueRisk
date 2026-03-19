"""Push notifications API router."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.push_subscription import PushSubscription
from app.schemas.push import PushSubscribeRequest, PushSubscribeResponse

router = APIRouter()


@router.post("/subscribe", response_model=PushSubscribeResponse, status_code=201)
async def subscribe(
    body: PushSubscribeRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new push subscription."""
    subscription = PushSubscription(
        province_code=body.province_code,
        endpoint=body.endpoint,
        p256dh_key=body.keys.p256dh,
        auth_key=body.keys.auth,
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
