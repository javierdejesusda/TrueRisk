"""Gamification API router — points, badges, streaks."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services import gamification_service

router = APIRouter()


@router.get(
    "/status",
    summary="Get gamification status",
    description="Return points, streak, and badge status for the authenticated user.",
)
async def get_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return full gamification status for the current user."""
    return await gamification_service.get_user_gamification(db, user.id)
