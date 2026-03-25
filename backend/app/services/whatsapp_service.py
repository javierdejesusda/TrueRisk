"""WhatsApp notification service via Twilio."""

from __future__ import annotations

import logging

from app.config import settings

logger = logging.getLogger(__name__)

_client = None
_http_client = None


async def _get_client():
    global _client, _http_client
    if _client is not None:
        return _client
    try:
        from twilio.http.async_http_client import AsyncTwilioHttpClient
        from twilio.rest import Client
    except ImportError:
        logger.warning("twilio not installed -- WhatsApp disabled")
        return None
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        logger.warning("Twilio credentials not configured -- WhatsApp disabled")
        return None
    _http_client = AsyncTwilioHttpClient()
    _client = Client(
        settings.twilio_account_sid,
        settings.twilio_auth_token,
        http_client=_http_client,
    )
    return _client


async def send_whatsapp(to_phone: str, body: str) -> str | None:
    """Send a WhatsApp message via Twilio. Returns SID on success."""
    client = await _get_client()
    if client is None:
        return None
    try:
        message = await client.messages.create_async(
            body=body[:1600],
            from_=f"whatsapp:{settings.twilio_from_phone}",
            to=f"whatsapp:{to_phone}",
        )
        logger.info("WhatsApp sent to %s: SID=%s", to_phone, message.sid)
        return message.sid
    except Exception:
        logger.exception("Failed to send WhatsApp to %s", to_phone)
        return None
