"""Telegram bot notification service."""

from __future__ import annotations

import logging
import secrets
from datetime import datetime, timezone, timedelta

import httpx
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.telegram_link_code import TelegramLinkCode

logger = logging.getLogger(__name__)

LINK_CODE_TTL = timedelta(minutes=10)


async def generate_link_code(db: AsyncSession, user_id: int) -> str:
    """Generate a one-time code for linking a Telegram account.

    Stored in the database with a 10-minute TTL. Old codes for the
    same user are deleted first.
    """
    await db.execute(
        delete(TelegramLinkCode).where(TelegramLinkCode.user_id == user_id)
    )
    code = secrets.token_hex(4)
    db.add(TelegramLinkCode(code=code, user_id=user_id))
    await db.flush()
    return code


async def resolve_link_code(db: AsyncSession, code: str) -> int | None:
    """Resolve a link code to a user_id. Consumes the code.

    Returns None if the code doesn't exist or has expired (>10 min).
    """
    row = await db.scalar(
        select(TelegramLinkCode).where(TelegramLinkCode.code == code)
    )
    if not row:
        return None
    # Delete the code (one-time use)
    await db.delete(row)
    await db.flush()
    # Check TTL
    cutoff = datetime.now(timezone.utc) - LINK_CODE_TTL
    created = row.created_at.replace(tzinfo=timezone.utc) if row.created_at.tzinfo is None else row.created_at
    if created < cutoff:
        return None
    return row.user_id


async def register_webhook() -> bool:
    """Register the Telegram webhook URL with the Telegram Bot API.

    Called once at app startup.
    """
    if not settings.telegram_bot_token or not settings.telegram_webhook_url:
        logger.info("Telegram bot token or webhook URL not configured -- skipping webhook registration")
        return False
    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/setWebhook"
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.post(url, json={"url": settings.telegram_webhook_url})
            r.raise_for_status()
            data = r.json()
            if data.get("ok"):
                logger.info("Telegram webhook registered: %s", settings.telegram_webhook_url)
                return True
            logger.error("Telegram setWebhook returned ok=false: %s", data)
            return False
        except Exception:
            logger.exception("Failed to register Telegram webhook")
            return False


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
