"""Tests for DataHealthTracker."""

from app.services.data_health_service import DataHealthTracker


def test_record_success():
    tracker = DataHealthTracker()
    tracker.record_success("open_meteo", records_count=52)
    status = tracker.get_status("open_meteo")
    assert status["consecutive_failures"] == 0
    assert status["last_success"] is not None


def test_record_failure_increments():
    tracker = DataHealthTracker()
    tracker.record_failure("aemet", "API returned 503")
    tracker.record_failure("aemet", "API returned 503")
    status = tracker.get_status("aemet")
    assert status["consecutive_failures"] == 2


def test_all_sources_summary():
    tracker = DataHealthTracker()
    tracker.record_success("open_meteo", records_count=52)
    tracker.record_failure("aemet", "timeout")
    summary = tracker.get_all_statuses()
    assert len(summary) == 2


def test_success_resets_consecutive_failures():
    tracker = DataHealthTracker()
    tracker.record_failure("usgs", "connection error")
    tracker.record_failure("usgs", "connection error")
    tracker.record_success("usgs", records_count=10)
    status = tracker.get_status("usgs")
    assert status["consecutive_failures"] == 0


def test_get_status_unknown_source_returns_none():
    tracker = DataHealthTracker()
    status = tracker.get_status("nonexistent_source")
    assert status is None


def test_last_error_message_stored():
    tracker = DataHealthTracker()
    tracker.record_failure("nasa_firms", "HTTP 429 Too Many Requests")
    status = tracker.get_status("nasa_firms")
    assert status["last_error_message"] == "HTTP 429 Too Many Requests"


def test_total_records_last_fetch_stored():
    tracker = DataHealthTracker()
    tracker.record_success("open_meteo", records_count=47)
    status = tracker.get_status("open_meteo")
    assert status["total_records_last_fetch"] == 47


def test_last_failure_at_populated_on_failure():
    tracker = DataHealthTracker()
    tracker.record_failure("ree", "timeout")
    status = tracker.get_status("ree")
    assert status["last_failure"] is not None


def test_multiple_sources_tracked_independently():
    tracker = DataHealthTracker()
    tracker.record_failure("aemet", "error")
    tracker.record_failure("aemet", "error")
    tracker.record_success("open_meteo", records_count=52)
    assert tracker.get_status("aemet")["consecutive_failures"] == 2
    assert tracker.get_status("open_meteo")["consecutive_failures"] == 0
