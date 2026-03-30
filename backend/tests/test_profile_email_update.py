import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_update_email(client: AsyncClient):
    """User can add/update their email."""
    reg = await client.post("/api/v1/auth/register", json={
        "nickname": "emailuser", "password": "Test1234!@ab", "province_code": "28",
    })
    token = reg.json()["access_token"]
    resp = await client.patch(
        "/api/v1/auth/me",
        json={"email": "new@example.com"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["email"] == "new@example.com"


@pytest.mark.asyncio
async def test_update_email_duplicate_rejected(client: AsyncClient):
    """Cannot update email to one already in use."""
    # Register user 1 with email
    await client.post("/api/v1/auth/register", json={
        "nickname": "user1email", "password": "Test1234!@ab",
        "email": "taken@example.com", "province_code": "28",
    })
    # Register user 2 without email
    reg2 = await client.post("/api/v1/auth/register", json={
        "nickname": "user2email", "password": "Test1234!@ab", "province_code": "28",
    })
    token2 = reg2.json()["access_token"]
    # User 2 tries to use user 1's email
    resp = await client.patch(
        "/api/v1/auth/me",
        json={"email": "taken@example.com"},
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert resp.status_code == 409
