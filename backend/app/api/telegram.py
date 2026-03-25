"""Telegram bot linking API."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.telegram_service import generate_link_code, resolve_link_code

router = APIRouter()


@router.post("/link")
async def create_link_code(user: User = Depends(get_current_user)):
    """Generate a one-time code for linking Telegram."""
    code = generate_link_code(user.id)
    return {"code": code, "instructions": f"Send /start {code} to the TrueRisk bot on Telegram"}


@router.post("/webhook")
async def telegram_webhook(body: dict, db: AsyncSession = Depends(get_db)):
    """Handle Telegram bot updates (message with /start code)."""
    message = body.get("message", {})
    text = message.get("text", "")
    chat_id = str(message.get("chat", {}).get("id", ""))

    if text.startswith("/start "):
        code = text.split(" ", 1)[1].strip()
        user_id = resolve_link_code(code)
        if user_id is None:
            return {"ok": False, "error": "Invalid or expired code"}
        user = await db.get(User, user_id)
        if user:
            user.telegram_chat_id = chat_id
            await db.commit()
            return {"ok": True}
    return {"ok": False}
