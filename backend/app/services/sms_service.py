"""Twilio SMS service -- sends critical alert notifications."""

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
        logger.warning("twilio not installed -- SMS disabled")
        return None
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        logger.warning("Twilio credentials not configured -- SMS disabled")
        return None
    _http_client = AsyncTwilioHttpClient()
    _client = Client(
        settings.twilio_account_sid,
        settings.twilio_auth_token,
        http_client=_http_client,
    )
    return _client


async def send_sms(to: str, body: str) -> str | None:
    """Send an SMS via Twilio. Returns message SID on success."""
    client = await _get_client()
    if client is None:
        return None
    try:
        message = await client.messages.create_async(
            to=to,
            messaging_service_sid=settings.twilio_messaging_service_sid,
            body=body[:1600],
        )
        logger.info("SMS sent to %s: SID=%s", to, message.sid)
        return message.sid
    except Exception:
        logger.exception("Failed to send SMS to %s", to)
        return None


async def send_critical_alert_sms(
    province_name: str, hazard_type: str, severity: int, score: float
) -> list[str]:
    """Send critical alert SMS to all admin phones. Returns list of SIDs."""
    level = "CRITICO" if severity == 5 else "ALTO"
    body = (
        f"ALERTA TrueRisk: Riesgo {level} de {hazard_type} "
        f"en {province_name}. "
        f"Puntuacion: {score:.0f}/100. "
        f"Consulta https://truerisk.cloud"
    )
    sids = []
    for phone in settings.twilio_admin_phones:
        sid = await send_sms(phone, body)
        if sid:
            sids.append(sid)
    return sids
