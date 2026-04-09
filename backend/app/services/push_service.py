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
    """Send a single Web Push notification.

    Returns True on success. Raises WebPushException (with .response.status_code)
    on HTTP errors so callers can decide whether to deactivate the subscription.
    Runs the blocking ``webpush()`` call in a thread executor to avoid stalling
    the event loop when notifying many subscribers concurrently.
    """
    if webpush is None:
        logger.warning("pywebpush not available, skipping push")
        return False

    def _blocking_send() -> None:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload),
            vapid_private_key=settings.vapid_private_key,
            vapid_claims={"sub": settings.vapid_contact_email},
        )

    await asyncio.get_running_loop().run_in_executor(None, _blocking_send)
    return True


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

    async def _send_one(sub: PushSubscription) -> tuple[PushSubscription, BaseException | None]:
        subscription_info = {
            "endpoint": sub.endpoint,
            "keys": {
                "p256dh": sub.p256dh_key,
                "auth": sub.auth_key,
            },
        }
        try:
            await send_push(subscription_info, alert_data)
            return sub, None
        except BaseException as exc:  # noqa: BLE001 — surfaces WebPushException w/ response
            return sub, exc

    results = await asyncio.gather(*[_send_one(sub) for sub in subscriptions])

    for sub, outcome in results:
        if outcome is None:
            continue
        if isinstance(outcome, WebPushException):
            _maybe_deactivate(sub, outcome)
        else:
            logger.error("Unexpected error sending push to sub %s: %s", sub.id, outcome)

    await db.commit()


def _maybe_deactivate(sub: PushSubscription, exc: BaseException) -> None:
    """Deactivate a subscription if the push endpoint returned a permanent error.

    On 400/404/410 the subscription is permanently invalid and must not be
    retried — repeated failures would otherwise flood Sentry with the same
    "WebPushException: Push failed: 400" error.
    """
    status = None
    response = getattr(exc, "response", None)
    if response is not None:
        status = getattr(response, "status_code", None)
    if status in (400, 404, 410):
        sub.is_active = False
        logger.info("Deactivated push subscription %s (HTTP %s)", sub.id, status)
    else:
        # Transient error (network, 5xx, etc.) — keep subscription active and log.
        logger.warning(
            "Transient push failure for sub %s (HTTP %s): %s",
            sub.id, status or "?", exc,
        )


async def notify_user(
    db: AsyncSession, user_id: int, title: str, body: str
) -> int:
    """Send push notifications to all active subscriptions for a specific user.

    Returns number of notifications sent successfully.
    Uses concurrent delivery and retires invalid subscriptions.
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

    async def _send_one(sub: PushSubscription) -> tuple[PushSubscription, BaseException | None]:
        subscription_info = {
            "endpoint": sub.endpoint,
            "keys": {"p256dh": sub.p256dh_key, "auth": sub.auth_key},
        }
        try:
            await send_push(subscription_info, payload)
            return sub, None
        except BaseException as exc:  # noqa: BLE001 — surfaces WebPushException w/ response
            return sub, exc

    results = await asyncio.gather(*[_send_one(sub) for sub in subscriptions])

    sent = 0
    for sub, outcome in results:
        if outcome is None:
            sent += 1
            continue
        if isinstance(outcome, WebPushException):
            _maybe_deactivate(sub, outcome)
        else:
            logger.error("Unexpected error notifying user %s sub %s: %s", user_id, sub.id, outcome)

    await db.commit()
    return sent
