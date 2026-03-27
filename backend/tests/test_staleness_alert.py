"""Tests for data staleness detection and alerting."""
import pytest
from unittest.mock import patch
from datetime import datetime, timezone, timedelta

from app.services.data_health_service import DataHealthTracker, KNOWN_SOURCES


class TestGetStaleSources:
    def test_no_stale_when_all_fresh(self):
        tracker = DataHealthTracker()
        tracker.register_sources(KNOWN_SOURCES)
        for src in KNOWN_SOURCES:
            tracker.record_success(src, 10)
        from app.services.staleness_alert_service import get_stale_sources
        stale = get_stale_sources(tracker)
        assert len(stale) == 0

    def test_stale_when_never_fetched(self):
        tracker = DataHealthTracker()
        tracker.register_sources(["open_meteo"])
        from app.services.staleness_alert_service import get_stale_sources
        stale = get_stale_sources(tracker)
        assert len(stale) == 1
        assert stale[0]["source"] == "open_meteo"
        assert stale[0]["last_success"] is None

    def test_stale_when_old_success(self):
        tracker = DataHealthTracker()
        tracker.register_sources(["open_meteo"])
        tracker.record_success("open_meteo", 10)
        two_hours_ago = (datetime.now(tz=timezone.utc) - timedelta(hours=2)).isoformat()
        tracker._sources["open_meteo"]["last_success"] = two_hours_ago
        from app.services.staleness_alert_service import get_stale_sources
        stale = get_stale_sources(tracker)
        assert len(stale) == 1
        assert stale[0]["stale_minutes"] > 60

    def test_fresh_source_not_stale(self):
        tracker = DataHealthTracker()
        tracker.register_sources(["ine_demographics"])  # 2880 min threshold
        tracker.record_success("ine_demographics", 5)
        from app.services.staleness_alert_service import get_stale_sources
        stale = get_stale_sources(tracker)
        assert len(stale) == 0


class TestHealthSummary:
    def test_counts_correct(self):
        tracker = DataHealthTracker()
        tracker.register_sources(["open_meteo", "aemet", "usgs"])
        tracker.record_success("open_meteo", 5)
        tracker.record_success("aemet", 3)
        from app.services.staleness_alert_service import get_health_summary
        summary = get_health_summary(tracker)
        assert summary["total"] == 3
        assert summary["never_fetched"] == 1
        assert summary["healthy"] + summary["stale"] + summary["never_fetched"] == 3


@pytest.mark.asyncio
class TestCheckAndAlert:
    async def test_no_stale_returns_zero(self):
        from app.services.staleness_alert_service import check_and_alert_stale_sources
        tracker = DataHealthTracker()
        tracker.register_sources(KNOWN_SOURCES)
        for src in KNOWN_SOURCES:
            tracker.record_success(src, 10)
        with patch("app.services.staleness_alert_service.health_tracker", tracker):
            count = await check_and_alert_stale_sources()
        assert count == 0

    async def test_stale_triggers_warning(self):
        from app.services.staleness_alert_service import check_and_alert_stale_sources, _last_alerted
        _last_alerted.clear()
        tracker = DataHealthTracker()
        tracker.register_sources(["open_meteo"])
        with patch("app.services.staleness_alert_service.health_tracker", tracker), \
             patch("app.services.staleness_alert_service.logger") as mock_logger:
            count = await check_and_alert_stale_sources()
        assert count >= 1
        mock_logger.warning.assert_called()

    async def test_cooldown_prevents_re_alert(self):
        from app.services.staleness_alert_service import check_and_alert_stale_sources, _last_alerted
        _last_alerted.clear()
        tracker = DataHealthTracker()
        tracker.register_sources(["open_meteo"])
        with patch("app.services.staleness_alert_service.health_tracker", tracker):
            count1 = await check_and_alert_stale_sources()
            count2 = await check_and_alert_stale_sources()
        assert count1 >= 1
        assert count2 == 0  # within cooldown
