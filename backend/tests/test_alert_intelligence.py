"""Tests for alert intelligence service: preferences, mark read, auth."""
import pytest


@pytest.mark.asyncio
async def test_get_or_create_preferences_creates_default(client, mock_external_apis):
    r = await client.post("/api/v1/auth/register", json={
        "nickname": "prefs_test_user",
        "password": "SecureP@ss1",
        "email": "prefs@test.com",
    })
    assert r.status_code in (200, 201)
    token = r.json()["access_token"]

    r2 = await client.get(
        "/api/v1/alerts/preferences",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r2.status_code == 200
    data = r2.json()
    assert "emergency_override" in data


@pytest.mark.asyncio
async def test_update_preferences(client, mock_external_apis):
    r = await client.post("/api/v1/auth/register", json={
        "nickname": "prefs_update_user",
        "password": "SecureP@ss2",
        "email": "update@test.com",
    })
    token = r.json()["access_token"]

    r2 = await client.put(
        "/api/v1/alerts/preferences",
        headers={"Authorization": f"Bearer {token}"},
        json={"emergency_override": False, "quiet_hours_start": "22:00", "quiet_hours_end": "08:00"},
    )
    assert r2.status_code == 200
    assert r2.json()["emergency_override"] is False


@pytest.mark.asyncio
async def test_mark_alert_read(client, mock_external_apis):
    r = await client.post("/api/v1/auth/register", json={
        "nickname": "read_alert_user",
        "password": "SecureP@ss3",
        "email": "read@test.com",
    })
    token = r.json()["access_token"]

    r2 = await client.post("/api/v1/alerts", json={
        "severity": 3, "hazard_type": "flood",
        "province_code": "28", "title": "Flood", "description": "test alert",
    })
    alert_id = r2.json()["id"]

    r3 = await client.post(
        f"/api/v1/alerts/{alert_id}/read",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r3.status_code == 204


@pytest.mark.asyncio
async def test_preferences_require_auth(client, mock_external_apis):
    r = await client.get("/api/v1/alerts/preferences")
    assert r.status_code == 401
