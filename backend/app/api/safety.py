"""Family safety check API router."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.safety_check import (
    FamilyLinkCreate,
    FamilyLinkResponse,
    FamilyStatusResponse,
    SafetyCheckInCreate,
    SafetyCheckInResponse,
)
from app.services import safety_check_service

router = APIRouter()


@router.post(
    "/check-in",
    response_model=SafetyCheckInResponse,
    status_code=201,
    summary="Mark yourself as safe",
    description="Create a safety check-in record and notify linked family members.",
)
async def check_in(
    body: SafetyCheckInCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a safety check-in."""
    record = await safety_check_service.check_in(db, user.id, body)
    return record


@router.get(
    "/family-status",
    response_model=list[FamilyStatusResponse],
    summary="Get family members status",
    description="Return all linked family members with their latest check-in status.",
)
async def family_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get status of all linked family members."""
    return await safety_check_service.get_family_status(db, user.id)


@router.post(
    "/links",
    response_model=FamilyLinkResponse,
    status_code=201,
    summary="Create family link",
    description="Send a family link request to another user by nickname.",
)
async def create_link(
    body: FamilyLinkCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a pending family link."""
    link = await safety_check_service.create_link(db, user.id, body.nickname)
    # Fetch linked user for response enrichment
    linked_user = await db.get(User, link.linked_user_id)
    return FamilyLinkResponse(
        id=link.id,
        user_id=link.user_id,
        linked_user_id=link.linked_user_id,
        relationship=link.relationship,
        status=link.status,
        created_at=link.created_at,
        linked_user_nickname=linked_user.nickname or "" if linked_user else "",
        linked_user_display_name=linked_user.display_name if linked_user else None,
    )


@router.patch(
    "/links/{link_id}/accept",
    response_model=FamilyLinkResponse,
    summary="Accept family link",
    description="Accept a pending family link request.",
)
async def accept_link(
    link_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept a pending family link."""
    link = await safety_check_service.accept_link(db, user.id, link_id)
    linked_user = await db.get(User, link.user_id)
    return FamilyLinkResponse(
        id=link.id,
        user_id=link.user_id,
        linked_user_id=link.linked_user_id,
        relationship=link.relationship,
        status=link.status,
        created_at=link.created_at,
        linked_user_nickname=linked_user.nickname or "" if linked_user else "",
        linked_user_display_name=linked_user.display_name if linked_user else None,
    )


@router.delete(
    "/links/{link_id}",
    status_code=204,
    summary="Delete family link",
    description="Remove a family link (either party can delete).",
)
async def delete_link(
    link_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a family link."""
    await safety_check_service.delete_link(db, user.id, link_id)


@router.post(
    "/request/{target_user_id}",
    summary="Request check-in from family member",
    description="Send a push notification asking a linked user to check in.",
)
async def request_check_in(
    target_user_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Request a linked user to check in."""
    await safety_check_service.request_check_in(db, user.id, target_user_id)
    return {"status": "sent"}


@router.get(
    "/check-ins",
    response_model=list[SafetyCheckInResponse],
    summary="Check-in history",
    description="Return your check-in history, most recent first.",
)
async def check_in_history(
    limit: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get check-in history for the current user."""
    return await safety_check_service.get_check_in_history(db, user.id, limit)
