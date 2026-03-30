"""Authentication and user profile API router."""

from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.rate_limit import limiter
from app.models.alert_preference import AlertPreference
from app.models.community_report import CommunityReport
from app.models.password_reset_token import PasswordResetToken
from app.models.property_report import PropertyReport
from app.models.user import User
from app.services.profile_completion_service import compute_profile_completion
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    OAuthLinkRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import (
    create_access_token,
    generate_reset_token,
    hash_password,
    verify_password,
)

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
@limiter.limit("30/minute")
async def register(request: Request, body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.nickname == body.nickname))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Nickname already taken")
    if body.email:
        existing_email = await db.execute(select(User).where(User.email == body.email))
        if existing_email.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        nickname=body.nickname,
        password_hash=hash_password(body.password),
        email=body.email,
        province_code=body.province_code,
        auth_provider="credentials",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return TokenResponse(
        access_token=create_access_token(user.id),
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.nickname == body.nickname))
    user = result.scalar_one_or_none()
    if (
        not user
        or not user.password_hash
        or not verify_password(body.password, user.password_hash)
    ):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(
        access_token=create_access_token(user.id),
        user=UserResponse.model_validate(user),
    )


@router.post("/oauth", response_model=TokenResponse)
@limiter.limit("10/minute")
async def oauth_link(request: Request, body: OAuthLinkRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(
            User.auth_provider == body.provider,
            User.provider_account_id == body.provider_account_id,
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            email=body.email,
            display_name=body.display_name,
            avatar_url=body.avatar_url,
            auth_provider=body.provider,
            provider_account_id=body.provider_account_id,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        user.display_name = body.display_name or user.display_name
        user.avatar_url = body.avatar_url or user.avatar_url
        await db.commit()
        await db.refresh(user)
    return TokenResponse(
        access_token=create_access_token(user.id),
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)


@router.get("/me/completion")
async def get_profile_completion(user: User = Depends(get_current_user)):
    user_dict = {c.key: getattr(user, c.key) for c in User.__table__.columns}
    return compute_profile_completion(user_dict)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    db_user = await db.get(User, user.id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    updates = body.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(db_user, field, value)
    await db.commit()
    await db.refresh(db_user)
    return UserResponse.model_validate(db_user)


@router.delete("/me", status_code=204)
async def delete_me(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """GDPR account deletion -- permanently removes the authenticated user."""
    db_user = await db.get(User, user.id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(db_user)
    await db.commit()


@router.post("/forgot-password")
@limiter.limit("5/minute")
async def forgot_password(
    request: Request, body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)
):
    """Request a password reset link. Always returns 200 to prevent email enumeration."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user and user.password_hash:
        plain_token, hashed_token = generate_reset_token()
        token = PasswordResetToken(
            user_id=user.id,
            token_hash=hashed_token,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        )
        db.add(token)
        await db.commit()
        try:
            from app.services.email_service import send_password_reset_email

            await send_password_reset_email(str(user.email), plain_token)
        except Exception:
            import logging

            logging.getLogger(__name__).exception("Failed to send password reset email")
    return {"message": "If that email exists, a reset link has been sent."}


@router.post("/reset-password")
@limiter.limit("10/minute")
async def reset_password(
    request: Request, body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)
):
    """Reset password using a valid token."""
    token_hash = hashlib.sha256(body.token.encode()).hexdigest()
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > datetime.now(timezone.utc),
        )
    )
    reset_token = result.scalar_one_or_none()
    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    user = await db.get(User, reset_token.user_id)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    user.password_hash = hash_password(body.new_password)
    reset_token.used_at = datetime.now(timezone.utc)  # type: ignore[assignment]
    await db.commit()
    return {"message": "Password has been reset successfully."}


@router.get("/me/export")
async def export_my_data(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """GDPR data portability -- export all user data as JSON."""
    reports = (await db.execute(
        select(PropertyReport).where(PropertyReport.user_id == user.id)
    )).scalars().all()

    community = (await db.execute(
        select(CommunityReport).where(CommunityReport.reporter_user_id == user.id)
    )).scalars().all()

    prefs = (await db.execute(
        select(AlertPreference).where(AlertPreference.user_id == user.id)
    )).scalars().all()

    return {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "profile": UserResponse.model_validate(user).model_dump(),
        "property_reports": [
            {
                "address": r.address_text,
                "composite_score": r.composite_score,
                "created_at": str(r.created_at),
            }
            for r in reports
        ],
        "community_reports": [
            {
                "hazard_type": r.hazard_type,
                "description": r.description,
                "created_at": str(r.created_at),
            }
            for r in community
        ],
        "alert_preferences": [
            {
                "quiet_hours_start": p.quiet_hours_start,
                "quiet_hours_end": p.quiet_hours_end,
                "emergency_override": p.emergency_override,
                "batch_interval_minutes": p.batch_interval_minutes,
                "escalation_enabled": p.escalation_enabled,
                "snoozed_hazards": p.snoozed_hazards,
            }
            for p in prefs
        ],
    }
