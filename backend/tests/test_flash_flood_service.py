"""Tests for flash flood detection service and API endpoints."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.flash_flood_service import FloodAlert, check_flash_flood_conditions


def _mock_db_with_gauges(gauges):
    """Create a mock async session returning the given gauges from execute()."""
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = gauges
    mock_db.execute.return_value = mock_result
    return mock_db


@pytest.mark.asyncio
async def test_flash_flood_status_endpoint(client, mock_external_apis):
    response = await client.get("/api/v1/flash-flood/status")
    assert response.status_code == 200
    if response.status_code == 200:
        data = response.json()
        assert "basins_configured" in data
        assert data["basins_configured"] == 9
        assert isinstance(data["basins_active"], list)
        assert "total_gauges_in_db" in data
        assert "active_flood_alerts" in data


@pytest.mark.asyncio
async def test_flash_flood_alerts_endpoint(client, mock_external_apis):
    response = await client.get("/api/v1/flash-flood/alerts")
    assert response.status_code == 200
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_flash_flood_gauges_endpoint(client, mock_external_apis):
    response = await client.get("/api/v1/flash-flood/gauges")
    assert response.status_code == 200
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_flash_flood_gauges_filter_by_basin(client, mock_external_apis):
    response = await client.get("/api/v1/flash-flood/gauges?basin=ebro")
    assert response.status_code == 200
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_flash_flood_gauge_readings(client, mock_external_apis):
    response = await client.get("/api/v1/flash-flood/gauges/ebro_test/readings")
    assert response.status_code == 200
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_flash_flood_check_endpoint(client, mock_external_apis):
    response = await client.post("/api/v1/flash-flood/check")
    assert response.status_code == 200
    if response.status_code == 200:
        data = response.json()
        assert "readings_stored" in data
        assert "alerts_created" in data
        assert "flood_conditions" in data
        assert isinstance(data["flood_conditions"], list)


def test_flood_alert_dataclass():
    alert = FloodAlert(
        gauge_id="ebro_001",
        gauge_name="Test Gauge",
        river_name="Ebro",
        basin="Ebro",
        province_code="50",
        flow_m3s=150.0,
        threshold_exceeded="P95",
        severity=4,
        message="WARNING: Flow exceeded P95 threshold.",
    )
    assert alert.gauge_id == "ebro_001"
    assert alert.severity == 4
    assert alert.threshold_exceeded == "P95"


@pytest.mark.asyncio
async def test_check_flash_flood_no_gauges():
    """With no gauges in DB and no live flows, check returns empty list."""
    mock_db = _mock_db_with_gauges([])

    with patch(
        "app.services.flash_flood_service.fetch_all_basin_flows",
        return_value=[],
    ):
        alerts = await check_flash_flood_conditions(mock_db)
        assert alerts == []


class _FakeGauge:
    def __init__(self, gauge_id, name, river_name, province_code="50",
                 p90=50.0, p95=80.0, p99=120.0):
        self.gauge_id = gauge_id
        self.name = name
        self.river_name = river_name
        self.province_code = province_code
        self.threshold_p90 = p90
        self.threshold_p95 = p95
        self.threshold_p99 = p99


@pytest.mark.asyncio
async def test_check_flash_flood_with_exceedance():
    """When flow exceeds P95 threshold, returns a severity-4 alert."""
    gauge = _FakeGauge("ebro_001", "Zaragoza", "Ebro")
    mock_db = _mock_db_with_gauges([gauge])

    live_flows = [
        {
            "gauge_id": "ebro_001",
            "name": "Zaragoza",
            "river": "Ebro",
            "flow_m3s": 95.0,
            "level_m": 3.2,
            "basin": "Ebro",
        }
    ]

    with patch(
        "app.services.flash_flood_service.fetch_all_basin_flows",
        return_value=live_flows,
    ):
        alerts = await check_flash_flood_conditions(mock_db)
        assert len(alerts) == 1
        assert alerts[0].severity == 4
        assert alerts[0].threshold_exceeded == "P95"
        assert alerts[0].flow_m3s == 95.0


@pytest.mark.asyncio
async def test_check_flash_flood_p99_critical():
    """P99 exceedance produces severity-5 critical alert."""
    gauge = _FakeGauge("ebro_002", "Miranda de Ebro", "Ebro")
    mock_db = _mock_db_with_gauges([gauge])

    live_flows = [
        {
            "gauge_id": "ebro_002",
            "name": "Miranda de Ebro",
            "river": "Ebro",
            "flow_m3s": 150.0,
            "level_m": 5.1,
            "basin": "Ebro",
        }
    ]

    with patch(
        "app.services.flash_flood_service.fetch_all_basin_flows",
        return_value=live_flows,
    ):
        alerts = await check_flash_flood_conditions(mock_db)
        assert len(alerts) == 1
        assert alerts[0].severity == 5
        assert alerts[0].threshold_exceeded == "P99"


@pytest.mark.asyncio
async def test_check_flash_flood_below_threshold():
    """Flow below all thresholds produces no alerts."""
    gauge = _FakeGauge("ebro_003", "Tortosa", "Ebro")
    mock_db = _mock_db_with_gauges([gauge])

    live_flows = [
        {
            "gauge_id": "ebro_003",
            "name": "Tortosa",
            "river": "Ebro",
            "flow_m3s": 30.0,
            "level_m": 1.5,
            "basin": "Ebro",
        }
    ]

    with patch(
        "app.services.flash_flood_service.fetch_all_basin_flows",
        return_value=live_flows,
    ):
        alerts = await check_flash_flood_conditions(mock_db)
        assert len(alerts) == 0
