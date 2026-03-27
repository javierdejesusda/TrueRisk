"""Tests for alert CRUD operations, validation, and edge cases."""
import pytest


VALID_HAZARD_TYPES = [
    "flood", "flash_flood", "wildfire", "drought",
    "heatwave", "seismic", "coldwave", "windstorm",
]


def _alert_payload(*, severity=3, hazard_type="flood", province_code="28",
                   title="Test Alert", description="Test description."):
    return {
        "severity": severity,
        "hazard_type": hazard_type,
        "province_code": province_code,
        "title": title,
        "description": description,
    }


@pytest.mark.asyncio
async def test_create_alert_happy_path(client, mock_external_apis):
    r = await client.post("/api/v1/alerts", json=_alert_payload())
    assert r.status_code == 201
    data = r.json()
    assert data["severity"] == 3
    assert data["hazard_type"] == "flood"
    assert data["province_code"] == "28"
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_create_alert_severity_zero_rejected(client, mock_external_apis):
    r = await client.post("/api/v1/alerts", json=_alert_payload(severity=0))
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_create_alert_severity_six_rejected(client, mock_external_apis):
    r = await client.post("/api/v1/alerts", json=_alert_payload(severity=6))
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_create_alert_invalid_hazard_type(client, mock_external_apis):
    r = await client.post("/api/v1/alerts", json=_alert_payload(hazard_type="tsunami"))
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_update_alert_severity(client, mock_external_apis):
    r = await client.post("/api/v1/alerts", json=_alert_payload())
    assert r.status_code == 201
    alert_id = r.json()["id"]

    r2 = await client.patch(f"/api/v1/alerts/{alert_id}", json={"severity": 4})
    assert r2.status_code == 200
    assert r2.json()["severity"] == 4


@pytest.mark.asyncio
async def test_update_nonexistent_alert(client, mock_external_apis):
    r = await client.patch("/api/v1/alerts/99999", json={"severity": 2})
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_delete_alert(client, mock_external_apis):
    r = await client.post("/api/v1/alerts", json=_alert_payload())
    assert r.status_code == 201
    alert_id = r.json()["id"]

    r2 = await client.delete(f"/api/v1/alerts/{alert_id}")
    assert r2.status_code == 204


@pytest.mark.asyncio
async def test_delete_nonexistent_alert(client, mock_external_apis):
    r = await client.delete("/api/v1/alerts/99999")
    assert r.status_code == 404


@pytest.mark.asyncio
@pytest.mark.parametrize("hazard_type", VALID_HAZARD_TYPES)
async def test_create_all_valid_hazard_types(client, mock_external_apis, hazard_type):
    r = await client.post("/api/v1/alerts", json=_alert_payload(hazard_type=hazard_type))
    assert r.status_code == 201, f"Failed for hazard_type={hazard_type}: {r.text}"


@pytest.mark.asyncio
async def test_filter_alerts_by_hazard_type(client, mock_external_apis):
    for ht in ("flood", "wildfire"):
        await client.post("/api/v1/alerts", json=_alert_payload(
            hazard_type=ht, title=f"{ht} alert",
        ))

    r = await client.get("/api/v1/alerts?hazard=flood")
    assert r.status_code == 200
    data = r.json()
    assert all(a["hazard_type"] == "flood" for a in data)


@pytest.mark.asyncio
async def test_create_alert_severity_minimum_boundary(client, mock_external_apis):
    r = await client.post("/api/v1/alerts", json=_alert_payload(severity=1))
    assert r.status_code == 201


@pytest.mark.asyncio
async def test_create_alert_severity_maximum_boundary(client, mock_external_apis):
    r = await client.post("/api/v1/alerts", json=_alert_payload(severity=5))
    assert r.status_code == 201
