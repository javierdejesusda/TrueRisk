from fastapi import APIRouter, Depends, HTTPException, Response
from jose import jwt
from passlib.hash import bcrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    ProfileUpdate,
    RegisterRequest,
    SessionResponse,
    UserResponse,
)
from app.api.deps import get_current_user, get_db

router = APIRouter()


def _create_token(user: User) -> str:
    payload = {"id": user.id, "nickname": user.nickname, "role": user.role}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _set_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="session",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=86400,
        secure=False,
    )


@router.post("/register", response_model=SessionResponse)
async def register(
    body: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    existing = await db.scalar(select(User).where(User.nickname == body.nickname))
    if existing:
        raise HTTPException(status_code=409, detail="Nickname already taken")

    user = User(
        nickname=body.nickname,
        password_hash=bcrypt.hash(body.password),
        province_code=body.province_code,
        residence_type=body.residence_type,
        special_needs=body.special_needs,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = _create_token(user)
    _set_cookie(response, token)

    return SessionResponse(user=UserResponse.model_validate(user))


@router.post("/login", response_model=SessionResponse)
async def login(
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    user = await db.scalar(select(User).where(User.nickname == body.nickname))
    if not user or not bcrypt.verify(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = _create_token(user)
    _set_cookie(response, token)

    return SessionResponse(user=UserResponse.model_validate(user))


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="session")
    return {"detail": "Logged out"}


@router.get("/session", response_model=SessionResponse)
async def session(user: User = Depends(get_current_user)):
    return SessionResponse(user=UserResponse.model_validate(user))


@router.patch("/profile", response_model=SessionResponse)
async def update_profile(
    body: ProfileUpdate,
    response: Response,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    update_data = body.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)

    return SessionResponse(user=UserResponse.model_validate(user))
