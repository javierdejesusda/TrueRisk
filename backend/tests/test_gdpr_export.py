import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_export_requires_auth(client: AsyncClient):
    resp = await client.get("/api/v1/account/me/export")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_export_returns_user_data(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "nickname": "exportuser",
        "password": "Test1234!@ab",
        "email": "export@example.com",
        "province_code": "28",
    })
    token = reg.json()["access_token"]
    resp = await client.get(
        "/api/v1/account/me/export",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["profile"]["nickname"] == "exportuser"
    assert "property_reports" in data
    assert "community_reports" in data
    assert "alert_preferences" in data
    assert "exported_at" in data
