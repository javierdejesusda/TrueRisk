"""Emergency plan API router."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.api.deps import get_current_user, get_db
from app.models.province import Province
from app.models.user import User
from app.rate_limit import limiter
from app.schemas.emergency_plan import EmergencyPlanResponse, EmergencyPlanUpdate
from app.security.real_ip import get_real_ip
from app.services import emergency_plan_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/",
    response_model=EmergencyPlanResponse,
    summary="Get emergency plan",
)
async def get_plan(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get or create the user's emergency plan."""
    return await emergency_plan_service.get_plan(db, user.id)


@router.put(
    "/",
    response_model=EmergencyPlanResponse,
    summary="Update emergency plan",
)
async def update_plan(
    body: EmergencyPlanUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Save or update the user's emergency plan. Partial updates supported."""
    return await emergency_plan_service.update_plan(db, user.id, body)


@router.get("/kit-recommendations", summary="AI kit recommendations")
@limiter.limit("3/minute", key_func=get_real_ip)
async def stream_kit_recommendations(
    request: Request,
    locale: str = Query(default="es", pattern="^(es|en)$"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """SSE stream of AI-generated personalized emergency kit recommendations."""
    province = await db.get(Province, user.province_code) if user.province_code else None

    async def event_generator():
        try:
            async for chunk in emergency_plan_service.stream_kit_recommendations(
                user, province, locale
            ):
                if await request.is_disconnected():
                    break
                yield {"event": "delta", "data": chunk}
            yield {"event": "done", "data": ""}
        except Exception:
            logger.exception("Error streaming kit recommendations")
            yield {"event": "error", "data": "Failed to generate recommendations"}

    return EventSourceResponse(event_generator())
