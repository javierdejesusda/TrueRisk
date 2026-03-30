"""Gamification service — points, badges, streaks."""

from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gamification import Badge, UserBadge, UserPoints

logger = logging.getLogger(__name__)

# Point values per action
POINT_VALUES: dict[str, int] = {
    "checklist_item": 50,
    "community_report": 75,
    "report_verification": 25,
    "safety_checkin": 50,
    "onboarding_complete": 200,
}


async def _get_or_create_user_points(db: AsyncSession, user_id: int) -> UserPoints:
    """Return the UserPoints row for a user, creating it if absent."""
    result = await db.execute(
        select(UserPoints).where(UserPoints.user_id == user_id)
    )
    row = result.scalar_one_or_none()
    if row is None:
        row = UserPoints(user_id=user_id, total_points=0, current_streak_days=0, longest_streak_days=0)
        db.add(row)
        await db.flush()
    return row


def _update_streak(row: UserPoints, today: date) -> None:
    """Update streak counters based on today's date."""
    if row.last_active_date is None:
        row.current_streak_days = 1
    elif row.last_active_date == today:
        # Already active today — no change
        return
    elif row.last_active_date == today - timedelta(days=1):
        row.current_streak_days += 1
    else:
        # Streak broken
        row.current_streak_days = 1

    row.last_active_date = today
    if row.current_streak_days > row.longest_streak_days:
        row.longest_streak_days = row.current_streak_days


async def _build_badge_context(db: AsyncSession, user_id: int) -> dict[str, Any]:
    """Build context dict with user stats needed for badge condition evaluation."""
    from app.models.community_report import CommunityReport, ReportVerification
    from app.models.user import User

    user = await db.get(User, user_id)

    # Count community reports submitted by the user
    report_count_result = await db.execute(
        select(func.count()).select_from(CommunityReport).where(
            CommunityReport.reporter_user_id == user_id
        )
    )
    community_reports = report_count_result.scalar() or 0

    # Count verifications (reports verified by this user)
    verification_count_result = await db.execute(
        select(func.count()).select_from(ReportVerification).where(
            ReportVerification.user_id == user_id
        )
    )
    verifications = verification_count_result.scalar() or 0

    # Preparedness score from user profile
    preparedness_score = user.preparedness_score if user else 0.0

    # all_items_complete == preparedness_score reached 100
    all_items_complete = (preparedness_score or 0) >= 100

    # No has_seen_onboarding field on User model; treat onboarding_complete as
    # true when the user has been awarded the "onboarding_complete" action points
    # (i.e. total_points includes the 200-point onboarding award).  We track this
    # via the action string passed to award_points.
    onboarding_complete = False
    if user and hasattr(user, "has_seen_onboarding"):
        onboarding_complete = bool(user.has_seen_onboarding)

    return {
        "community_reports": community_reports,
        "preparedness_score": preparedness_score or 0,
        "verifications": verifications,
        "all_items_complete": all_items_complete,
        "onboarding_complete": onboarding_complete,
    }


async def _check_and_award_badges(
    db: AsyncSession,
    user_id: int,
    row: UserPoints,
    context: dict[str, Any] | None = None,
) -> list[str]:
    """Check badge conditions and award any newly earned badges. Returns list of newly awarded badge keys."""
    if context is None:
        context = await _build_badge_context(db, user_id)

    all_badges_result = await db.execute(select(Badge))
    all_badges = list(all_badges_result.scalars().all())

    earned_result = await db.execute(
        select(UserBadge.badge_id).where(UserBadge.user_id == user_id)
    )
    earned_ids = {r for r in earned_result.scalars().all()}

    newly_awarded: list[str] = []

    for badge in all_badges:
        if badge.id in earned_ids:
            continue

        if _evaluate_condition(badge.condition, row, context):
            db.add(UserBadge(user_id=user_id, badge_id=badge.id))
            newly_awarded.append(badge.key)

    return newly_awarded


def _evaluate_condition(
    condition: str,
    row: UserPoints,
    context: dict[str, Any] | None = None,
) -> bool:
    """Evaluate a badge condition string against user state.

    Supported conditions:
      - streak>=N          (from UserPoints row)
      - community_reports>=N  (from context)
      - preparedness_score>=N (from context)
      - verifications>=N      (from context)
      - all_items_complete    (from context)
      - onboarding_complete   (from context)
    """
    ctx = context or {}
    try:
        if condition.startswith("streak>="):
            threshold = int(condition.split(">=")[1])
            return row.current_streak_days >= threshold

        if condition.startswith("community_reports>="):
            threshold = int(condition.split(">=")[1])
            return ctx.get("community_reports", 0) >= threshold

        if condition.startswith("preparedness_score>="):
            threshold = int(condition.split(">=")[1])
            return ctx.get("preparedness_score", 0) >= threshold

        if condition.startswith("verifications>="):
            threshold = int(condition.split(">=")[1])
            return ctx.get("verifications", 0) >= threshold

        if condition == "all_items_complete":
            return bool(ctx.get("all_items_complete", False))

        if condition == "onboarding_complete":
            return bool(ctx.get("onboarding_complete", False))

    except (ValueError, IndexError):
        pass

    return False


async def award_points(
    db: AsyncSession,
    user_id: int,
    action: str,
    amount: int | None = None,
) -> None:
    """Award points for an action, update streak, and check badges."""
    pts = amount if amount is not None else POINT_VALUES.get(action, 0)
    if pts <= 0:
        return

    row = await _get_or_create_user_points(db, user_id)
    row.total_points += pts

    today = date.today()
    _update_streak(row, today)

    # Build context and enrich with the current action so badge evaluation
    # can account for events that just happened (e.g. onboarding_complete).
    context = await _build_badge_context(db, user_id)
    if action == "onboarding_complete":
        context["onboarding_complete"] = True
    await _check_and_award_badges(db, user_id, row, context)
    await db.flush()


async def check_badges(db: AsyncSession, user_id: int) -> list[str]:
    """Check and award any newly earned badges without adding points.

    Use this after events that may qualify the user for badges but don't
    themselves award points (e.g. preparedness score update, community actions
    that already called award_points separately).
    """
    row = await _get_or_create_user_points(db, user_id)
    context = await _build_badge_context(db, user_id)
    newly_awarded = await _check_and_award_badges(db, user_id, row, context)
    if newly_awarded:
        await db.flush()
    return newly_awarded


async def get_user_gamification(db: AsyncSession, user_id: int) -> dict:
    """Return full gamification status for a user."""
    row = await _get_or_create_user_points(db, user_id)

    # Fetch all badges + which ones user earned
    all_badges_result = await db.execute(select(Badge))
    all_badges = list(all_badges_result.scalars().all())

    earned_result = await db.execute(
        select(UserBadge).where(UserBadge.user_id == user_id)
    )
    earned_map = {ub.badge_id: ub.earned_at for ub in earned_result.scalars().all()}

    badges = []
    for badge in all_badges:
        earned_at = earned_map.get(badge.id)
        badges.append({
            "key": badge.key,
            "name_es": badge.name_es,
            "name_en": badge.name_en,
            "description_es": badge.description_es,
            "description_en": badge.description_en,
            "icon": badge.icon,
            "earned": earned_at is not None,
            "earned_at": earned_at.isoformat() if earned_at else None,
        })

    return {
        "total_points": row.total_points,
        "current_streak_days": row.current_streak_days,
        "longest_streak_days": row.longest_streak_days,
        "last_active_date": row.last_active_date.isoformat() if row.last_active_date else None,
        "badges": badges,
    }
