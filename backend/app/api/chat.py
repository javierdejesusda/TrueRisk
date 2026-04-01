"""Chat router — streaming SSE, usage, conversation management, history."""

from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.api.deps import get_current_user, get_db
from app.models.chat import ChatMessage
from app.models.user import User
from app.rate_limit import limiter
from app.schemas.chat import ChatSendRequest, ChatUsageResponse
from app.security.real_ip import get_real_ip
from app.services.chat_service import get_usage, stream_chat_response

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/send")
@limiter.limit("30/minute", key_func=get_real_ip)
async def send_message(
    request: Request,
    body: ChatSendRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Stream a chat response via SSE. Rate limited to 10/minute per real IP."""

    async def event_generator():
        try:
            async for event in stream_chat_response(
                message=body.message,
                conversation_id=body.conversation_id,
                locale=body.locale,
                user=user,
                db=db,
            ):
                if await request.is_disconnected():
                    break
                yield event
        except Exception:
            logger.exception("Chat stream failed")
            yield {"event": "error", "data": "stream_error"}

    return EventSourceResponse(event_generator())


@router.get("/usage", response_model=ChatUsageResponse)
async def usage(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return current chat usage stats for the authenticated user."""
    data = await get_usage(user.id, db)
    return ChatUsageResponse(**data)


@router.post("/new-conversation")
async def new_conversation(
    user: User = Depends(get_current_user),
):
    """Generate a fresh conversation UUID."""
    return {"conversation_id": str(uuid.uuid4())}


@router.get("/history/{conversation_id}")
async def get_history(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return messages for a conversation, ordered by created_at ascending.

    Only returns messages that belong to the authenticated user.
    """
    result = await db.execute(
        select(ChatMessage)
        .where(
            ChatMessage.conversation_id == conversation_id,
            ChatMessage.user_id == user.id,
        )
        .order_by(ChatMessage.created_at.asc())
    )
    rows = result.scalars().all()
    messages = [
        {
            "id": row.id,
            "role": row.role,
            "content": row.content,
            "created_at": row.created_at.isoformat(),
        }
        for row in rows
    ]
    return {"conversation_id": conversation_id, "messages": messages, "message_count": len(messages)}
