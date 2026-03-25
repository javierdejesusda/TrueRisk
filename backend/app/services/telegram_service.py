"""Telegram bot notification service."""

from __future__ import annotations

import logging
import secrets

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_pending_links: dict[str, int] = {}  # code -> user_id


def generate_link_code(user_id: int) -> str:
    """Generate a one-time code for linking a Telegram account."""
    code = secrets.token_hex(4)
    _pending_links[code] = user_id
    return code


def resolve_link_code(code: str) -> int | None:
    """Resolve a link code to a user_id. Consumes the code."""
    return _pending_links.pop(code, None)


async def send_telegram(chat_id: str, text: str) -> bool:
    """Send a Telegram message. Returns True on success."""
    if not settings.telegram_bot_token:
        logger.warning("Telegram bot token not configured")
        return False
    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"})
            r.raise_for_status()
            logger.info("Telegram message sent to chat_id=%s", chat_id)
            return True
        except Exception:
            logger.exception("Telegram send failed to chat_id=%s", chat_id)
            return False
