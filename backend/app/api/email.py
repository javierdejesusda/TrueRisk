"""Email notifications API router."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User

router = APIRouter()


@router.post("/test", status_code=200)
async def test_email(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a test email to the authenticated user."""
    from app.config import settings
    from app.services.email_service import send_alert_email

    if not settings.resend_api_key:
        # Return directly instead of raising HTTPException so Sentry
        # does not capture this expected 503 as an error.
        from starlette.responses import JSONResponse
        return JSONResponse(status_code=503, content={"detail": "Email not configured"})

    if not user.email:
        raise HTTPException(status_code=400, detail="No email address on your account")

    email_id = await send_alert_email(
        user.email,
        title="Test de Notificaciones",
        description="Las notificaciones por email de TrueRisk funcionan correctamente. Recibiras alertas de riesgos naturales directamente en tu bandeja de entrada cuando esten activadas.",
        severity=3,
        hazard_type="flood",
        province_name="Madrid",
    )
    if not email_id:
        raise HTTPException(status_code=502, detail="Failed to send test email")
    return {"email_id": email_id}
