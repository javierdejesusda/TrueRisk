"""Personalized safety suggestions streaming endpoint."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.api.deps import get_db, get_optional_user
from app.config import settings
from app.models.user import User
from app.rate_limit import limiter
from app.security.real_ip import get_real_ip
from app.services.personalized_suggestions_service import stream_personalized_suggestions

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/stream/{province_code}")
@limiter.limit("3/minute", key_func=get_real_ip)
async def stream_suggestions(
    request: Request,
    province_code: str,
    locale: str = Query(default="es", pattern="^(es|en)$"),
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    """SSE stream of personalized safety suggestions. Requires authentication."""
    from app.demo import is_demo_mode
    if is_demo_mode():
        from app.demo.mock_ai_streaming import stream_mock_suggestions

        async def demo_generator():
            async for chunk in stream_mock_suggestions(province_code, locale):
                yield {"event": "delta", "data": chunk}
            yield {"event": "done", "data": ""}

        return EventSourceResponse(demo_generator())

    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="AI service not configured")

    from app.api.advisor import get_advisor_context

    context = await get_advisor_context(province_code, db)

    async def event_generator():
        try:
            async for chunk in stream_personalized_suggestions(user, context, locale):
                if await request.is_disconnected():
                    break
                yield {"event": "delta", "data": chunk}
            yield {"event": "done", "data": ""}
        except Exception:
            logger.exception("Error streaming suggestions for %s", province_code)
            yield {"event": "error", "data": "Failed to generate suggestions"}

    return EventSourceResponse(event_generator())
