"""Tests for flash flood pipeline: process alerts, store readings, load thresholds."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.flash_flood_service import (
    FloodAlert,
    process_flash_flood_alerts,
    store_river_readings,
    _load_gauge_thresholds,
)


def _make_flood_alert(**overrides):
    defaults = {
        "gauge_id": "G001",
        "gauge_name": "Gauge One",
        "river_name": "Rio Test",
        "basin": "Tajo",
        "province_code": "28",
        "flow_m3s": 150.0,
        "threshold_exceeded": "P95",
        "severity": 4,
        "message": "WARNING: high flow",
    }
    defaults.update(overrides)
    return FloodAlert(**defaults)


# ---------------------------------------------------------------------------
# process_flash_flood_alerts
# ---------------------------------------------------------------------------

class TestProcessFlashFloodAlerts:
    @pytest.mark.asyncio
    @patch("app.services.flash_flood_service.check_flash_flood_conditions", new_callable=AsyncMock)
    async def test_creates_new(self, mock_check):
        mock_check.return_value = [_make_flood_alert()]

        db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        db.execute = AsyncMock(return_value=mock_result)
        db.add = MagicMock()
        db.commit = AsyncMock()

        count = await process_flash_flood_alerts(db)
        assert count == 1
        db.add.assert_called_once()
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    @patch("app.services.flash_flood_service.check_flash_flood_conditions", new_callable=AsyncMock)
    async def test_skips_duplicate(self, mock_check):
        mock_check.return_value = [_make_flood_alert()]

        db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = MagicMock()  # existing alert
        db.execute = AsyncMock(return_value=mock_result)
        db.add = MagicMock()
        db.commit = AsyncMock()

        count = await process_flash_flood_alerts(db)
        assert count == 0
        db.add.assert_not_called()

    @pytest.mark.asyncio
    @patch("app.services.flash_flood_service.check_flash_flood_conditions", new_callable=AsyncMock)
    async def test_no_conditions(self, mock_check):
        mock_check.return_value = []

        db = AsyncMock()
        db.add = MagicMock()
        db.commit = AsyncMock()

        count = await process_flash_flood_alerts(db)
        assert count == 0
        db.add.assert_not_called()
        db.commit.assert_not_awaited()


# ---------------------------------------------------------------------------
# store_river_readings
# ---------------------------------------------------------------------------

class TestStoreRiverReadings:
    @pytest.mark.asyncio
    @patch("app.services.flash_flood_service.fetch_all_basin_flows", new_callable=AsyncMock)
    async def test_stores_valid(self, mock_fetch):
        mock_fetch.return_value = [
            {"gauge_id": "G001", "flow_m3s": 50.0, "level_m": 2.1, "basin": "Tajo"},
            {"gauge_id": "G002", "flow_m3s": 30.0, "level_m": 1.5, "basin": "Duero"},
        ]

        db = AsyncMock()
        db.add = MagicMock()
        db.commit = AsyncMock()

        count = await store_river_readings(db)
        assert count == 2
        assert db.add.call_count == 2
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    @patch("app.services.flash_flood_service.fetch_all_basin_flows", new_callable=AsyncMock)
    async def test_skips_none_flow(self, mock_fetch):
        mock_fetch.return_value = [
            {"gauge_id": "G001", "flow_m3s": 50.0, "basin": "Tajo"},
            {"gauge_id": "G002", "flow_m3s": None, "basin": "Duero"},
            {"gauge_id": "G003", "basin": "Ebro"},
        ]

        db = AsyncMock()
        db.add = MagicMock()
        db.commit = AsyncMock()

        count = await store_river_readings(db)
        assert count == 1
        assert db.add.call_count == 1

    @pytest.mark.asyncio
    @patch("app.services.flash_flood_service.fetch_all_basin_flows", new_callable=AsyncMock)
    async def test_empty_flows(self, mock_fetch):
        mock_fetch.return_value = []

        db = AsyncMock()
        db.add = MagicMock()
        db.commit = AsyncMock()

        count = await store_river_readings(db)
        assert count == 0
        db.add.assert_not_called()
        db.commit.assert_not_awaited()


# ---------------------------------------------------------------------------
# _load_gauge_thresholds
# ---------------------------------------------------------------------------

def _make_fake_gauge(gauge_id, name, river_name, province_code, p90, p95, p99):
    gauge = MagicMock()
    gauge.gauge_id = gauge_id
    gauge.name = name
    gauge.river_name = river_name
    gauge.province_code = province_code
    gauge.threshold_p90 = p90
    gauge.threshold_p95 = p95
    gauge.threshold_p99 = p99
    gauge.is_active = True
    return gauge


class TestLoadGaugeThresholds:
    @pytest.mark.asyncio
    async def test_returns_dict(self):
        fake_gauges = [
            _make_fake_gauge("G001", "Gauge 1", "Rio A", "28", 100, 150, 200),
            _make_fake_gauge("G002", "Gauge 2", "Rio B", "08", 80, 120, 160),
        ]

        db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = fake_gauges
        db.execute = AsyncMock(return_value=mock_result)

        result = await _load_gauge_thresholds(db)
        assert isinstance(result, dict)
        assert "G001" in result
        assert "G002" in result
        assert result["G001"]["p90"] == 100
        assert result["G001"]["p95"] == 150
        assert result["G001"]["p99"] == 200
        assert result["G001"]["province_code"] == "28"
        assert result["G001"]["name"] == "Gauge 1"
        assert result["G001"]["river_name"] == "Rio A"

    @pytest.mark.asyncio
    async def test_empty_db(self):
        db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        db.execute = AsyncMock(return_value=mock_result)

        result = await _load_gauge_thresholds(db)
        assert result == {}
