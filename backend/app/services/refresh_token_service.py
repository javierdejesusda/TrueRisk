"""Refresh token lifecycle -- create, rotate, revoke with theft detection."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.refresh_token import RefreshToken
from app.services.auth_service import (
    create_access_token,
    create_refresh_token_pair,
    hash_refresh_token,
)

logger = logging.getLogger(__name__)


async def create_token(db: AsyncSession, user_id: int) -> str:
    """Create a new refresh token for *user_id*, enforcing max-per-user.

    Returns the **raw** token string (the caller sends it to the client).
    """
    raw, hashed, family_id = create_refresh_token_pair()
    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )

    # Enforce max tokens per user -- delete oldest active ones beyond the limit
    result = await db.execute(
        select(RefreshToken)
        .where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
        )
        .order_by(RefreshToken.created_at.asc())
    )
    active_tokens = list(result.scalars().all())
    # Keep room for the new one
    excess = len(active_tokens) - (settings.refresh_token_max_per_user - 1)
    if excess > 0:
        for old_token in active_tokens[:excess]:
            old_token.revoked_at = datetime.now(timezone.utc)

    token_row = RefreshToken(
        user_id=user_id,
        token_hash=hashed,
        expires_at=expires_at,
        family_id=family_id,
    )
    db.add(token_row)
    await db.flush()
    return raw


async def rotate_token(
    db: AsyncSession, raw_token: str
) -> tuple[str, str]:
    """Validate *raw_token*, revoke it, and issue a new pair in the same family.

    Returns ``(new_raw_refresh, new_access_token)``.

    If the token was already revoked (replay / theft), revoke the **entire
    family** and raise 401.
    """
    hashed = hash_refresh_token(raw_token)

    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == hashed)
    )
    token_row = result.scalar_one_or_none()

    if token_row is None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # Theft detection: token already used
    if token_row.revoked_at is not None:
        logger.warning(
            "Refresh token reuse detected for family %s (user %s) -- "
            "revoking entire family",
            token_row.family_id,
            token_row.user_id,
        )
        await db.execute(
            update(RefreshToken)
            .where(
                RefreshToken.family_id == token_row.family_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=datetime.now(timezone.utc))
        )
        await db.commit()
        raise HTTPException(
            status_code=401,
            detail="Refresh token reuse detected -- all sessions revoked",
        )

    # Expired?
    if token_row.expires_at < datetime.now(timezone.utc):
        token_row.revoked_at = datetime.now(timezone.utc)
        await db.commit()
        raise HTTPException(status_code=401, detail="Refresh token expired")

    # Issue new pair in the same family
    new_raw, new_hashed, _ = create_refresh_token_pair()
    new_expires = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )

    # Revoke old, link to new
    token_row.revoked_at = datetime.now(timezone.utc)
    token_row.replaced_by_hash = new_hashed

    new_row = RefreshToken(
        user_id=token_row.user_id,
        token_hash=new_hashed,
        expires_at=new_expires,
        family_id=token_row.family_id,  # same family
    )
    db.add(new_row)

    new_access = create_access_token(token_row.user_id)
    await db.commit()

    return new_raw, new_access


async def revoke_all_for_user(db: AsyncSession, user_id: int) -> None:
    """Revoke every active refresh token for *user_id* (logout)."""
    await db.execute(
        update(RefreshToken)
        .where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
        )
        .values(revoked_at=datetime.now(timezone.utc))
    )
    await db.commit()


async def cleanup_expired(db: AsyncSession) -> int:
    """Delete tokens that expired more than 1 day ago. Returns count deleted."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=1)
    result = await db.execute(
        delete(RefreshToken).where(RefreshToken.expires_at < cutoff)
    )
    await db.commit()
    return result.rowcount or 0  # type: ignore[return-value, union-attr]
