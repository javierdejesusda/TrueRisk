"""Authentication and user profile API router."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.rate_limit import limiter
from app.models.user import User
from app.services.profile_completion_service import compute_profile_completion
from app.schemas.auth import (
    LoginRequest,
    OAuthLinkRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import (
    create_access_token,
    hash_password,
    verify_password,
)

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
@limiter.limit("10/minute")
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
