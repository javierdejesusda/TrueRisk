"""Integration tests for the authentication flow.

Covers: register, login, get current user, profile update,
invalid login, and duplicate registration.
"""

import pytest
import uuid


def _unique_nickname() -> str:
    """Return a nickname unlikely to collide across test runs."""
    return f"testuser_{uuid.uuid4().hex[:8]}"


@pytest.mark.asyncio
async def test_register_returns_token(client):
    nickname = _unique_nickname()
    response = await client.post(
        "/api/v1/auth/register",
        json={"nickname": nickname, "password": "Secur3Pass!x"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["nickname"] == nickname
    assert data["user"]["auth_provider"] == "credentials"


@pytest.mark.asyncio
async def test_login_returns_token(client):
    nickname = _unique_nickname()
    # Register first
    await client.post(
        "/api/v1/auth/register",
        json={"nickname": nickname, "password": "Secur3Pass!x"},
    )
    # Login
    response = await client.post(
        "/api/v1/auth/login",
        json={"nickname": nickname, "password": "Secur3Pass!x"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["nickname"] == nickname


@pytest.mark.asyncio
async def test_get_me_with_token(client):
    nickname = _unique_nickname()
    reg = await client.post(
        "/api/v1/auth/register",
        json={"nickname": nickname, "password": "Secur3Pass!x"},
    )
    token = reg.json()["access_token"]

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["nickname"] == nickname
    assert data["role"] == "citizen"
    assert data["province_code"] == "28"


@pytest.mark.asyncio
async def test_update_profile(client):
    nickname = _unique_nickname()
    reg = await client.post(
        "/api/v1/auth/register",
        json={"nickname": nickname, "password": "Secur3Pass!x"},
    )
    token = reg.json()["access_token"]

    response = await client.patch(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "display_name": "Test Display Name",
            "province_code": "08",
            "has_vehicle": True,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["display_name"] == "Test Display Name"
    assert data["province_code"] == "08"
    assert data["has_vehicle"] is True


@pytest.mark.asyncio
async def test_invalid_login_returns_401(client):
    nickname = _unique_nickname()
    await client.post(
        "/api/v1/auth/register",
        json={"nickname": nickname, "password": "Secur3Pass!x"},
    )

    response = await client.post(
        "/api/v1/auth/login",
        json={"nickname": nickname, "password": "Wr0ng!Passw"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_duplicate_registration_returns_409(client):
    nickname = _unique_nickname()
    await client.post(
        "/api/v1/auth/register",
        json={"nickname": nickname, "password": "Secur3Pass!x"},
    )

    response = await client.post(
        "/api/v1/auth/register",
        json={"nickname": nickname, "password": "An0ther!Pass"},
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_get_me_without_token_returns_401(client):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user_returns_401(client):
    response = await client.post(
        "/api/v1/auth/login",
        json={"nickname": "nobody_here_999", "password": "Wh4tever!xx"},
    )
    assert response.status_code == 401
