"""Preparedness score API router."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, get_optional_user
from app.models.user import User
from app.schemas.preparedness import (
    ChecklistResponse,
    ItemToggle,
    PreparednessHistoryEntry,
    PreparednessScoreResponse,
)
from app.services import preparedness_service

router = APIRouter()


@router.get(
    "/checklist",
    response_model=ChecklistResponse,
    summary="Get personalized checklist",
)
async def get_checklist(
    locale: str = Query(default="es", pattern="^(es|en)$"),
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    """Return the user's personalized preparedness checklist based on province and profile."""
    return await preparedness_service.get_personalized_checklist(db, user, locale)


@router.get(
    "/score",
    response_model=PreparednessScoreResponse,
    summary="Get preparedness score",
)
async def get_score(
    locale: str = Query(default="es", pattern="^(es|en)$"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return the user's current preparedness score with category breakdown and next actions."""
    return await preparedness_service.get_score(db, user, locale)


@router.patch(
    "/items/{item_key}",
    summary="Toggle checklist item",
)
async def toggle_item(
    item_key: str,
    body: ItemToggle,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Toggle a checklist item's completion state. Recomputes the score."""
    completed = await preparedness_service.toggle_item(
        db, user.id, item_key, body.completed, body.notes
    )
    return {"item_key": item_key, "completed": completed}


@router.get(
    "/history",
    response_model=list[PreparednessHistoryEntry],
    summary="Score history",
)
async def get_history(
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return preparedness score snapshots for the last N days."""
    return await preparedness_service.get_score_history(db, user.id, days)
