"""Proactive staleness alerting for external data sources."""
from __future__ import annotations

import logging
import time
from datetime import datetime, timezone

from app.services.data_health_service import health_tracker, STALENESS_THRESHOLDS

logger = logging.getLogger(__name__)

_last_alerted: dict[str, float] = {}
_ALERT_COOLDOWN = 7200  # 2 hours


def get_stale_sources(tracker=None) -> list[dict]:
    """Return sources that haven't reported success within their threshold."""
    tracker = tracker or health_tracker
    now = datetime.now(tz=timezone.utc)
    stale = []
    for source, status in tracker.get_all_statuses().items():
        threshold = STALENESS_THRESHOLDS.get(source, 60)
        last_success = status.get("last_success")
        if not last_success:
            stale.append({
                "source": source,
                "last_success": None,
                "threshold_minutes": threshold,
                "stale_minutes": None,
                "consecutive_failures": status.get("consecutive_failures", 0),
            })
            continue
        last_dt = datetime.fromisoformat(last_success)
        if last_dt.tzinfo is None:
            last_dt = last_dt.replace(tzinfo=timezone.utc)
        age_minutes = (now - last_dt).total_seconds() / 60
        if age_minutes > threshold:
            stale.append({
                "source": source,
                "last_success": last_success,
                "threshold_minutes": threshold,
                "stale_minutes": round(age_minutes, 1),
                "consecutive_failures": status.get("consecutive_failures", 0),
            })
    return stale


def get_health_summary(tracker=None) -> dict:
    """Return summary counts: total, healthy, stale, never_fetched."""
    tracker = tracker or health_tracker
    statuses = tracker.get_all_statuses()
    stale_list = get_stale_sources(tracker)
    never = sum(1 for s in stale_list if s["last_success"] is None)
    return {
        "total": len(statuses),
        "healthy": len(statuses) - len(stale_list),
        "stale": len(stale_list) - never,
        "never_fetched": never,
        "stale_sources": stale_list,
    }


def _should_alert(source: str) -> bool:
    last = _last_alerted.get(source, 0)
    return time.time() - last > _ALERT_COOLDOWN


async def check_and_alert_stale_sources() -> int:
    """Check all sources for staleness and alert admins. Returns count of newly-alerted."""
    stale = get_stale_sources()
    if not stale:
        logger.debug("Staleness check: all sources healthy")
        return 0

    new_alerts = [s for s in stale if _should_alert(s["source"])]
    if not new_alerts:
        logger.debug("Staleness check: %d stale but all within cooldown", len(stale))
        return 0

    for s in new_alerts:
        age = s["stale_minutes"] or "never"
        msg = (
            f"STALE DATA: {s['source']} last succeeded {age}m ago "
            f"(threshold: {s['threshold_minutes']}m). "
            f"Consecutive failures: {s['consecutive_failures']}"
        )
        logger.warning(msg)
        _last_alerted[s["source"]] = time.time()

    # Telegram notification (best-effort)
    try:
        from app.config import settings
        if settings.telegram_bot_token and settings.telegram_admin_chat_id:
            from app.services.telegram_service import send_telegram
            summary = f"TrueRisk Staleness Alert: {len(new_alerts)} source(s) stale\n"
            summary += "\n".join(f"- {s['source']}: {s['stale_minutes'] or 'never'}m" for s in new_alerts)
            await send_telegram(settings.telegram_admin_chat_id, summary)
    except Exception:
        logger.debug("Telegram staleness notification failed")

    # SMS escalation for high-failure sources
    try:
        from app.config import settings
        critical = [s for s in new_alerts if s["consecutive_failures"] >= 5]
        if critical and settings.twilio_account_sid and settings.twilio_admin_phones:
            from app.services.sms_service import send_sms
            msg = f"TrueRisk CRITICAL: {len(critical)} data source(s) down 5+ times"
            for phone in settings.twilio_admin_phones:
                await send_sms(phone, msg)
    except Exception:
        logger.debug("SMS staleness escalation failed")

    return len(new_alerts)
