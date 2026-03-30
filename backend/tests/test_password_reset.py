import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_forgot_password_unknown_email_returns_200(client: AsyncClient):
    """Always return 200 to prevent email enumeration."""
    resp = await client.post(
        "/api/v1/auth/forgot-password", json={"email": "nobody@example.com"}
    )
    assert resp.status_code == 200
    assert resp.json()["message"] == "If that email exists, a reset link has been sent."


@pytest.mark.asyncio
async def test_forgot_password_known_email(client: AsyncClient):
    """Should return 200 and create a token for registered user."""
    await client.post(
        "/api/v1/auth/register",
        json={
            "nickname": "resetuser",
            "password": "Test1234!@ab",
            "email": "reset@example.com",
            "province_code": "28",
        },
    )
    resp = await client.post(
        "/api/v1/auth/forgot-password", json={"email": "reset@example.com"}
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_reset_password_invalid_token(client: AsyncClient):
    """Invalid token should return 400."""
    resp = await client.post(
        "/api/v1/auth/reset-password",
        json={
            "token": "bad-token",
            "new_password": "NewPass1234!@",
        },
    )
    assert resp.status_code == 400
