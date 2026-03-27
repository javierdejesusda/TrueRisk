"""API key authentication dependency for B2B endpoints."""

import hashlib
from app.utils.time import utcnow

from fastapi import Depends, HTTPException, Security
from fastapi.security import APIKeyHeader
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.api_key import ApiKey

api_key_header = APIKeyHeader(name="X-API-Key")


def hash_key(key: str) -> str:
    """Return the SHA-256 hex digest of an API key."""
    return hashlib.sha256(key.encode()).hexdigest()


async def verify_api_key(
    key: str = Security(api_key_header),
    db: AsyncSession = Depends(get_db),
) -> ApiKey:
    """Verify API key and return the ApiKey record."""
    key_hash = hash_key(key)
    result = await db.scalar(
        select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.is_active == True)  # noqa: E712
    )
    if not result:
        raise HTTPException(status_code=403, detail="Invalid or inactive API key")

    # Update usage stats
    result.request_count += 1
    result.last_used_at = utcnow()
    await db.commit()
    return result
