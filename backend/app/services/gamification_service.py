"""Gamification service — points, badges, streaks."""

from __future__ import annotations

import logging
from datetime import date, timedelta

from sqlalchemy import select
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


async def _check_and_award_badges(db: AsyncSession, user_id: int, row: UserPoints) -> list[str]:
    """Check badge conditions and award any newly earned badges. Returns list of newly awarded badge keys."""
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

        if _evaluate_condition(badge.condition, row):
            db.add(UserBadge(user_id=user_id, badge_id=badge.id))
            newly_awarded.append(badge.key)

    return newly_awarded


def _evaluate_condition(condition: str, row: UserPoints) -> bool:
    """Evaluate a badge condition string against user state.

    Supported conditions:
      - streak>=N
      - (others are checked externally, return False here to avoid premature award)
    """
    try:
        if condition.startswith("streak>="):
            threshold = int(condition.split(">=")[1])
            return row.current_streak_days >= threshold
    except (ValueError, IndexError):
        pass

    # Conditions like community_reports>=1, preparedness_score>=80, etc.
    # are checked externally when those events occur; skip here.
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

    await _check_and_award_badges(db, user_id, row)
    await db.flush()


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
