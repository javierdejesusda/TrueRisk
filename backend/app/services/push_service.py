"""Push notification service -- Web Push delivery via pywebpush."""

from __future__ import annotations

import asyncio
import json
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.push_subscription import PushSubscription

logger = logging.getLogger(__name__)

try:
    from pywebpush import webpush, WebPushException
except ImportError:
    webpush = None  # type: ignore[assignment]
    WebPushException = Exception  # type: ignore[assignment, misc]
    logger.warning("pywebpush not installed -- push notifications disabled")


async def send_push(subscription_info: dict, payload: dict) -> bool:
    """Send a single Web Push notification. Returns True on success."""
    if webpush is None:
        logger.warning("pywebpush not available, skipping push")
        return False

    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload),
            vapid_private_key=settings.vapid_private_key,
            vapid_claims={"sub": settings.vapid_contact_email},
        )
        return True
    except Exception as exc:
        logger.error("Failed to send push notification: %s", exc)
        return False


async def notify_province(
    db: AsyncSession, province_code: str, alert_data: dict
) -> None:
    """Send push notifications to all active subscribers for a province."""
    result = await db.execute(
        select(PushSubscription).where(
            PushSubscription.province_code == province_code,
            PushSubscription.is_active == True,  # noqa: E712
        )
    )
    subscriptions = list(result.scalars().all())

    if not subscriptions:
        return

    async def _send_one(sub: PushSubscription) -> tuple[PushSubscription, bool | Exception]:
        subscription_info = {
            "endpoint": sub.endpoint,
            "keys": {
                "p256dh": sub.p256dh_key,
                "auth": sub.auth_key,
            },
        }
        try:
            success = await send_push(subscription_info, alert_data)
            return sub, success
        except Exception as exc:
            return sub, exc

    results = await asyncio.gather(
        *[_send_one(sub) for sub in subscriptions],
        return_exceptions=True,
    )

    for item in results:
        if isinstance(item, BaseException):
            logger.error("Unexpected error sending push: %s", item)
            continue
        sub, outcome = item
        if isinstance(outcome, Exception):
            # Check for 410 Gone -- subscription no longer valid
            if hasattr(outcome, "response") and getattr(outcome.response, "status_code", None) == 410:
                sub.is_active = False
                logger.info("Deactivated gone subscription %s", sub.id)
        elif not outcome:
            # send_push returned False -- could be a transient or permanent error
            pass

    await db.commit()


async def notify_user(
    db: AsyncSession, user_id: int, title: str, body: str
) -> int:
    """Send push notifications to all active subscriptions for a specific user.

    Returns number of notifications sent successfully.
    Uses concurrent delivery and retires 410-Gone subscriptions.
    """
    result = await db.execute(
        select(PushSubscription).where(
            PushSubscription.user_id == user_id,
            PushSubscription.is_active == True,  # noqa: E712
        )
    )
    subscriptions = list(result.scalars().all())

    if not subscriptions:
        return 0

    payload = {"title": title, "body": body}

    async def _send_one(sub: PushSubscription) -> tuple[PushSubscription, bool | Exception]:
        subscription_info = {
            "endpoint": sub.endpoint,
            "keys": {"p256dh": sub.p256dh_key, "auth": sub.auth_key},
        }
        try:
            success = await send_push(subscription_info, payload)
            return sub, success
        except Exception as exc:
            return sub, exc

    results = await asyncio.gather(
        *[_send_one(sub) for sub in subscriptions],
        return_exceptions=True,
    )

    sent = 0
    for item in results:
        if isinstance(item, BaseException):
            logger.error("Unexpected error in notify_user: %s", item)
            continue
        sub, outcome = item
        if isinstance(outcome, Exception):
            if hasattr(outcome, "response") and getattr(outcome.response, "status_code", None) == 410:
                sub.is_active = False
                logger.info("Deactivated gone subscription %s for user %s", sub.id, user_id)
        elif outcome:
            sent += 1

    await db.commit()
    return sent
