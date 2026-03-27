"""Integration tests for flash flood API endpoints."""
import pytest


@pytest.mark.asyncio
async def test_status_endpoint(client, mock_external_apis):
    r = await client.get("/api/v1/flash-flood/status")
    assert r.status_code == 200
    data = r.json()
    assert "basins_configured" in data
    assert "total_gauges_in_db" in data


@pytest.mark.asyncio
async def test_alerts_endpoint(client, mock_external_apis):
    r = await client.get("/api/v1/flash-flood/alerts")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_gauges_endpoint(client, mock_external_apis):
    r = await client.get("/api/v1/flash-flood/gauges")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_check_endpoint(client, mock_external_apis):
    r = await client.post("/api/v1/flash-flood/check")
    assert r.status_code == 200
    data = r.json()
    assert "readings_stored" in data
    assert "alerts_created" in data


@pytest.mark.asyncio
async def test_gauges_filter_by_basin(client, mock_external_apis):
    r = await client.get("/api/v1/flash-flood/gauges?basin=ebro")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_gauge_readings_endpoint(client, mock_external_apis):
    r = await client.get("/api/v1/flash-flood/gauges/nonexistent/readings")
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert len(r.json()) == 0


@pytest.mark.asyncio
async def test_gauge_readings_custom_hours(client, mock_external_apis):
    r = await client.get("/api/v1/flash-flood/gauges/test/readings?hours=48")
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_gauge_readings_max_hours(client, mock_external_apis):
    r = await client.get("/api/v1/flash-flood/gauges/test/readings?hours=168")
    assert r.status_code == 200
