"""Email notification service via Resend."""

from __future__ import annotations

import logging

from app.config import settings

logger = logging.getLogger(__name__)

try:
    import resend
except ImportError:
    resend = None  # type: ignore[assignment]
    logger.warning("resend not installed -- email notifications disabled")

HAZARD_CONFIG = {
    "flood": {"icon": "&#x1F30A;", "color": "#3B82F6", "label_es": "Inundacion", "label_en": "Flood"},
    "wildfire": {"icon": "&#x1F525;", "color": "#EF4444", "label_es": "Incendio", "label_en": "Wildfire"},
    "drought": {"icon": "&#x2600;&#xFE0F;", "color": "#F59E0B", "label_es": "Sequia", "label_en": "Drought"},
    "heatwave": {"icon": "&#x1F321;&#xFE0F;", "color": "#F97316", "label_es": "Ola de calor", "label_en": "Heatwave"},
    "dana": {"icon": "&#x26C8;&#xFE0F;", "color": "#7C3AED", "label_es": "DANA", "label_en": "DANA"},
    "windstorm": {"icon": "&#x1F32A;&#xFE0F;", "color": "#6366F1", "label_es": "Vendaval", "label_en": "Windstorm"},
    "coldwave": {"icon": "&#x2744;&#xFE0F;", "color": "#06B6D4", "label_es": "Ola de frio", "label_en": "Cold Wave"},
    "seismic": {"icon": "&#x1F30D;", "color": "#84CC16", "label_es": "Sismo", "label_en": "Seismic"},
}

SEVERITY_CONFIG = {
    1: {"label": "Low", "label_es": "Bajo", "color": "#22C55E", "bg": "#F0FDF4"},
    2: {"label": "Moderate", "label_es": "Moderado", "color": "#EAB308", "bg": "#FEFCE8"},
    3: {"label": "High", "label_es": "Alto", "color": "#F97316", "bg": "#FFF7ED"},
    4: {"label": "Very High", "label_es": "Muy alto", "color": "#EF4444", "bg": "#FEF2F2"},
    5: {"label": "Critical", "label_es": "Critico", "color": "#DC2626", "bg": "#FEF2F2"},
}


def _build_severity_dots(severity: int, color: str) -> str:
    dots = ""
    for i in range(1, 6):
        if i <= severity:
            dots += f'<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:{color};margin-right:3px;"></span>'
        else:
            dots += '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#374151;margin-right:3px;"></span>'
    return dots


def build_alert_email_html(
    *,
    title: str,
    description: str,
    severity: int,
    hazard_type: str,
    province_name: str | None = None,
) -> str:
    """Build a styled HTML email for an alert notification."""
    sev = SEVERITY_CONFIG.get(severity, SEVERITY_CONFIG[3])
    hazard = HAZARD_CONFIG.get(hazard_type, {"icon": "&#x26A0;&#xFE0F;", "color": "#6B7280", "label_es": hazard_type, "label_en": hazard_type})

    severity_dots = _build_severity_dots(severity, sev["color"])
    location_row = ""
    if province_name:
        location_row = f"""
            <tr>
              <td style="padding:6px 12px;color:#9CA3AF;font-size:13px;width:100px;">Ubicacion</td>
              <td style="padding:6px 12px;color:#E5E7EB;font-size:13px;">{province_name}</td>
            </tr>"""

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>TrueRisk Alert</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0F1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0F1A;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="padding:24px 28px 20px;background:linear-gradient(135deg,#111827 0%,#1F2937 100%);border-radius:16px 16px 0 0;border-bottom:1px solid rgba(255,255,255,0.06);">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:22px;font-weight:700;color:#F9FAFB;letter-spacing:-0.3px;">True</span><span style="font-size:22px;font-weight:700;color:#4ADE80;letter-spacing:-0.3px;">Risk</span>
                </td>
                <td align="right">
                  <span style="display:inline-block;background:{sev['color']}22;border:1px solid {sev['color']}44;border-radius:20px;padding:4px 14px;font-size:12px;font-weight:600;color:{sev['color']};text-transform:uppercase;letter-spacing:0.5px;">
                    {sev['label_es']}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Alert Banner -->
        <tr>
          <td style="background:{hazard['color']}15;border-left:4px solid {hazard['color']};padding:20px 28px;border-bottom:1px solid rgba(255,255,255,0.04);">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="48" valign="top">
                  <div style="width:44px;height:44px;border-radius:12px;background:{hazard['color']}20;text-align:center;line-height:44px;font-size:22px;">
                    {hazard['icon']}
                  </div>
                </td>
                <td style="padding-left:14px;" valign="middle">
                  <div style="font-size:11px;font-weight:600;color:{hazard['color']};text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">
                    Alerta de {hazard['label_es']}
                  </div>
                  <div style="font-size:18px;font-weight:700;color:#F9FAFB;line-height:1.3;">
                    {title}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#111827;padding:24px 28px;">
            <p style="margin:0 0 20px;color:#D1D5DB;font-size:15px;line-height:1.65;">
              {description}
            </p>

            <!-- Details Table -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0D1117;border-radius:10px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
              <tr>
                <td style="padding:6px 12px;color:#9CA3AF;font-size:13px;width:100px;">Severidad</td>
                <td style="padding:6px 12px;">
                  {severity_dots}
                  <span style="color:#E5E7EB;font-size:13px;margin-left:6px;">{severity}/5</span>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 12px;color:#9CA3AF;font-size:13px;">Tipo</td>
                <td style="padding:6px 12px;color:#E5E7EB;font-size:13px;">{hazard['icon']} {hazard['label_es']}</td>
              </tr>{location_row}
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="background:#111827;padding:0 28px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-top:8px;">
                  <a href="https://truerisk.cloud" style="display:inline-block;background:linear-gradient(135deg,#4ADE80 0%,#22C55E 100%);color:#0A0F1A;font-size:14px;font-weight:700;text-decoration:none;padding:12px 32px;border-radius:10px;letter-spacing:0.3px;">
                    Ver en TrueRisk
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0D1117;border-radius:0 0 16px 16px;padding:20px 28px;border-top:1px solid rgba(255,255,255,0.04);">
            <p style="margin:0;color:#6B7280;font-size:12px;line-height:1.5;text-align:center;">
              Recibes este email porque tienes las alertas por email activadas en
              <a href="https://truerisk.cloud/profile" style="color:#4ADE80;text-decoration:none;">tu perfil de TrueRisk</a>.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>"""


async def send_email(to: str, subject: str, html: str) -> str | None:
    """Send an email via Resend. Returns the email ID on success."""
    if resend is None:
        logger.warning("resend not available, skipping email")
        return None
    if not settings.resend_api_key:
        logger.warning("Resend API key not configured -- email disabled")
        return None

    resend.api_key = settings.resend_api_key

    try:
        result = resend.Emails.send({
            "from": settings.resend_from_email,
            "to": [to],
            "subject": subject,
            "html": html,
        })
        email_id = result.get("id") if isinstance(result, dict) else getattr(result, "id", None)
        logger.info("Email sent to %s: id=%s", to, email_id)
        return email_id
    except Exception:
        logger.exception("Failed to send email to %s", to)
        return None


async def send_alert_email(
    to: str,
    *,
    title: str,
    description: str,
    severity: int,
    hazard_type: str,
    province_name: str | None = None,
) -> str | None:
    """Send a styled alert notification email. Returns the email ID on success."""
    hazard = HAZARD_CONFIG.get(hazard_type, {"label_es": hazard_type})
    subject = f"{'[CRITICO] ' if severity >= 5 else ''}Alerta de {hazard.get('label_es', hazard_type)}: {title}"
    html = build_alert_email_html(
        title=title,
        description=description,
        severity=severity,
        hazard_type=hazard_type,
        province_name=province_name,
    )
    return await send_email(to, subject, html)


async def notify_user_email(
    email: str,
    title: str,
    body: str,
) -> bool:
    """Send a simple alert email to a user. Used by the escalation service."""
    html = build_alert_email_html(
        title=title,
        description=body,
        severity=3,
        hazard_type="flood",
    )
    result = await send_email(email, f"TrueRisk: {title}", html)
    return result is not None


async def send_password_reset_email(to_email: str, token: str) -> None:
    """Send a password reset email with a one-time link."""
    import os

    base_url = os.environ.get("NEXTAUTH_URL", "http://localhost:3000")
    reset_url = f"{base_url}/reset-password?token={token}"
    html = f"""
    <div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#0a0a0a;color:#e5e5e5;border-radius:12px;">
        <h2 style="color:#fff;margin:0 0 16px;">Password Reset</h2>
        <p style="line-height:1.6;">You requested a password reset for your TrueRisk account. Click the button below to set a new password:</p>
        <a href="{reset_url}" style="display:inline-block;padding:12px 24px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0;">Reset Password</a>
        <p style="font-size:13px;color:#737373;margin-top:24px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>
    """
    await send_email(to=to_email, subject="Reset your TrueRisk password", html=html)
