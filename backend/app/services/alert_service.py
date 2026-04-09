"""Alert service -- database operations and AEMET integration."""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.data import aemet_client
from app.models.alert import Alert
from app.schemas.alert import AlertCreate, AlertUpdate

logger = logging.getLogger(__name__)


async def get_alerts(
    db: AsyncSession,
    *,
    active: bool | None = None,
    province: str | None = None,
    hazard_type: str | None = None,
) -> list[Alert]:
    """Query alerts with optional filters."""
    stmt = select(Alert).order_by(Alert.created_at.desc())

    if active is not None:
        stmt = stmt.where(Alert.is_active == active)
    if province is not None:
        stmt = stmt.where(Alert.province_code == province)
    if hazard_type is not None:
        stmt = stmt.where(Alert.hazard_type == hazard_type)

    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_aemet_alerts() -> list[dict[str, Any]]:
    """Fetch live CAP alerts from the AEMET API.

    Drops "green" (Minor/Unknown) severity entries server-side: they
    represent *no actual hazard* and are filtered out on the client
    anyway, but they dominate the raw AEMET payload and pushed the
    response past Sentry's large-payload threshold (TRUERISK-FRONTEND-C).
    """
    api_key = settings.aemet_api_key
    if not api_key:
        logger.warning("AEMET API key is not configured")
        return []
    alerts = await aemet_client.fetch_alerts(api_key)
    return [a for a in alerts if a.get("severity") != "green"]


async def create_alert(db: AsyncSession, data: AlertCreate) -> Alert:
    """Create a new alert record.

    Raises ``ValueError`` if *province_code* is not a valid INE code.
    """
    from app.data.province_data import is_valid_province_code

    if data.province_code and not is_valid_province_code(data.province_code):
        raise ValueError(
            f"Invalid province_code '{data.province_code}': "
            "not a known INE province code"
        )

    alert = Alert(
        severity=data.severity,
        hazard_type=data.hazard_type,
        province_code=data.province_code,
        title=data.title,
        description=data.description,
        source="backoffice",
        onset=data.onset,
        expires=data.expires,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert


async def update_alert(
    db: AsyncSession, alert_id: int, data: AlertUpdate
) -> Alert | None:
    """Update an existing alert. Returns None if not found."""
    alert = await db.get(Alert, alert_id)
    if alert is None:
        return None

    update_fields = data.model_dump(exclude_none=True)
    for field, value in update_fields.items():
        setattr(alert, field, value)

    await db.commit()
    await db.refresh(alert)
    return alert


async def delete_alert(db: AsyncSession, alert_id: int) -> bool:
    """Delete an alert. Returns False if not found."""
    alert = await db.get(Alert, alert_id)
    if alert is None:
        return False

    await db.delete(alert)
    await db.commit()
    return True
