"""Telegram bot linking API."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.config import settings
from app.models.user import User
from app.services.telegram_service import generate_link_code, resolve_link_code

router = APIRouter()


@router.post("/link")
async def create_link_code(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a one-time code for linking Telegram."""
    code = await generate_link_code(db, user.id)
    bot_username = settings.telegram_bot_username
    deep_link = f"https://t.me/{bot_username}?start={code}" if bot_username else None
    return {
        "code": code,
        "deep_link": deep_link,
        "instructions": f"Send /start {code} to the TrueRisk bot on Telegram",
    }


@router.post("/webhook")
async def telegram_webhook(body: dict, db: AsyncSession = Depends(get_db)):
    """Handle Telegram bot updates (message with /start code)."""
    message = body.get("message", {})
    text = message.get("text", "")
    chat_id = str(message.get("chat", {}).get("id", ""))

    if text.startswith("/start "):
        code = text.split(" ", 1)[1].strip()
        user_id = await resolve_link_code(db, code)
        if user_id is None:
            return {"ok": False, "error": "Invalid or expired code"}
        user = await db.get(User, user_id)
        if user:
            user.telegram_chat_id = chat_id
            await db.commit()
            return {"ok": True}
    return {"ok": False}
