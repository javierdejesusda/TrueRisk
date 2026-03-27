"""Alerts API router."""

from __future__ import annotations

import asyncio
import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.api.deps import get_current_user, get_db
from app.models.alert import Alert
from app.models.province import Province
from app.models.user import User
from app.schemas.alert import (
    AemetAlertResponse,
    AlertCreate,
    AlertResponse,
    AlertUpdate,
)
from app.schemas.alert_preference import (
    AlertExplanation,
    AlertPreferenceResponse,
    AlertPreferenceUpdate,
)
from app.services import alert_service
from app.services import alert_intelligence_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=list[AlertResponse])
async def list_alerts(
    active: bool | None = Query(default=None),
    province: str | None = Query(default=None),
    hazard: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """List alerts with optional filters."""
    return await alert_service.get_alerts(
        db, active=active, province=province, hazard_type=hazard
    )


@router.get("/aemet", response_model=list[AemetAlertResponse])
async def aemet_alerts():
    """Get live AEMET CAP alerts."""
    return await alert_service.get_aemet_alerts()


@router.post("", response_model=AlertResponse, status_code=201)
async def create_alert(
    body: AlertCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new alert."""
    return await alert_service.create_alert(db, body)


@router.patch("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: int,
    body: AlertUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing alert."""
    alert = await alert_service.update_alert(db, alert_id, body)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.delete("/{alert_id}", status_code=204)
async def delete_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete an alert."""
    deleted = await alert_service.delete_alert(db, alert_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Alert not found")
    return None


@router.get("/stream")
async def alert_stream(db: AsyncSession = Depends(get_db)):
    """SSE stream that pushes new alerts every 10 seconds."""

    async def event_generator():
        last_count = 0
        while True:
            try:
                alerts = await alert_service.get_alerts(db, active=True)
                current_count = len(alerts)
                if current_count != last_count:
                    data = [
                        AlertResponse.model_validate(a).model_dump(mode="json")
                        for a in alerts
                    ]
                    yield {"event": "alerts", "data": json.dumps(data)}
                    last_count = current_count
                else:
                    yield {"event": "ping", "data": ""}
            except Exception:
                logger.exception("Error in alert SSE stream")
                yield {"event": "error", "data": "internal error"}
            await asyncio.sleep(10)

    return EventSourceResponse(event_generator())


# --- Alert Intelligence Endpoints ---


@router.get("/preferences", response_model=AlertPreferenceResponse)
async def get_alert_preferences(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get the user's alert delivery preferences."""
    prefs = await alert_intelligence_service.get_or_create_preferences(db, user.id)
    return AlertPreferenceResponse(
        quiet_hours_start=prefs.quiet_hours_start,
        quiet_hours_end=prefs.quiet_hours_end,
        emergency_override=prefs.emergency_override,
        batch_interval_minutes=prefs.batch_interval_minutes,
        escalation_enabled=prefs.escalation_enabled,
        snoozed_hazards=prefs.snoozed_hazards or {},
    )


@router.put("/preferences", response_model=AlertPreferenceResponse)
async def update_alert_preferences(
    body: AlertPreferenceUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update the user's alert delivery preferences."""
    return await alert_intelligence_service.update_preferences(db, user.id, body)


@router.post("/{alert_id}/read", status_code=204)
async def mark_alert_read(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Mark an alert as read by the current user."""
    alert = await db.get(Alert, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    await alert_intelligence_service.mark_alert_read(db, user.id, alert_id)
    return None


@router.get("/{alert_id}/explain", response_model=AlertExplanation)
async def explain_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Explain why this alert is relevant to the user."""
    alert = await db.get(Alert, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    province = await db.get(Province, user.province_code) if user.province_code else None
    return alert_intelligence_service.explain_alert(alert, user, province)
