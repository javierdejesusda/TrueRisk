"""Multi-channel alert delivery with failover and escalation.

Implements the zero-bottleneck alert delivery that the Valencia DANA
disaster proved is necessary. When a severity 5 event is detected,
alerts go out within minutes across all available channels.
"""
from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

CHANNEL_PRIORITY = ["push", "sms", "telegram", "whatsapp"]


async def deliver_alert_multi_channel(
    db: AsyncSession,
    user_id: int,
    title: str,
    body: str,
    phone: str | None = None,
    telegram_chat_id: str | None = None,
) -> str:
    """Try each channel in priority order until delivery succeeds.

    Returns the name of the channel that succeeded, or "none".
    """
    # Push notification
    try:
        from app.services.push_service import notify_user
        result = await notify_user(db, user_id, title, body)
        if result:
            return "push"
    except Exception:
        logger.debug("Push delivery failed for user %d", user_id)

    # SMS
    if phone:
        try:
            from app.services.sms_service import send_sms
            sid = await send_sms(phone, f"{title}: {body}")
            if sid:
                return "sms"
        except Exception:
            logger.debug("SMS delivery failed for user %d", user_id)

    # Telegram
    if telegram_chat_id:
        try:
            from app.services.telegram_service import send_telegram
            ok = await send_telegram(telegram_chat_id, f"{title}\n{body}")
            if ok:
                return "telegram"
        except Exception:
            logger.debug("Telegram delivery failed for user %d", user_id)

    # WhatsApp
    if phone:
        try:
            from app.services.whatsapp_service import send_whatsapp
            sid = await send_whatsapp(phone, f"{title}: {body}")
            if sid:
                return "whatsapp"
        except Exception:
            logger.debug("WhatsApp delivery failed for user %d", user_id)

    return "none"


def should_escalate(
    alert_severity: int, minutes_since_delivery: int, acknowledged: bool
) -> bool:
    """Determine if an alert should be re-sent via alternate channel.

    Severity 5 alerts are re-sent after 30 minutes if unacknowledged.
    Severity 4 alerts are re-sent after 60 minutes.
    """
    if acknowledged:
        return False
    if alert_severity >= 5 and minutes_since_delivery >= 30:
        return True
    if alert_severity >= 4 and minutes_since_delivery >= 60:
        return True
    return False


def determine_delivery_channels(
    severity: int, prefs: dict[str, Any], hour: int
) -> list[str]:
    """Determine which channels to use based on severity and user preferences.

    Severity 5 overrides quiet hours (the emergency_override field).
    """
    quiet_start = int((prefs.get("quiet_hours_start") or "23:00").split(":")[0])
    quiet_end = int((prefs.get("quiet_hours_end") or "07:00").split(":")[0])
    emergency_override = prefs.get("emergency_override", True)

    is_quiet = (
        (quiet_start <= hour or hour < quiet_end)
        if quiet_start > quiet_end
        else (quiet_start <= hour < quiet_end)
    )

    if is_quiet and severity < 5:
        return []
    if is_quiet and severity >= 5 and emergency_override:
        return CHANNEL_PRIORITY
    if is_quiet:
        return []

    return CHANNEL_PRIORITY
