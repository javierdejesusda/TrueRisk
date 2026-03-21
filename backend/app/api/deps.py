"""Shared FastAPI dependencies."""

from __future__ import annotations

from fastapi import Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.user import User
from app.services.auth_service import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    token_query: str | None = Query(default=None, alias="token"),
    db: AsyncSession = Depends(get_db),
) -> User:
    effective_token = token or token_query
    if not effective_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = decode_access_token(effective_token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_optional_user(
    token: str | None = Depends(oauth2_scheme),
    token_query: str | None = Query(default=None, alias="token"),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    effective_token = token or token_query
    if not effective_token:
        return None
    user_id = decode_access_token(effective_token)
    if user_id is None:
        return None
    return await db.get(User, user_id)
