"""Tests for high-frequency flash flood polling and rate-of-change detection."""

from app.services.flash_flood_service import detect_rapid_flow_increase


def test_rapid_increase_triggers_alert():
    """50%+ flow increase in 10 min should trigger alert."""
    previous = {"gauge_id": "jucar_001", "flow_m3s": 100.0}
    current = {"gauge_id": "jucar_001", "flow_m3s": 160.0}
    result = detect_rapid_flow_increase(previous, current)
    assert result is not None
    assert result.severity >= 4


def test_doubling_flow_triggers_severity_5():
    """100%+ flow increase should trigger severity 5."""
    previous = {"gauge_id": "jucar_001", "flow_m3s": 100.0}
    current = {"gauge_id": "jucar_001", "flow_m3s": 210.0}
    result = detect_rapid_flow_increase(previous, current)
    assert result is not None
    assert result.severity == 5


def test_normal_variation_no_alert():
    """Small flow changes should not trigger."""
    previous = {"gauge_id": "jucar_001", "flow_m3s": 100.0}
    current = {"gauge_id": "jucar_001", "flow_m3s": 110.0}
    result = detect_rapid_flow_increase(previous, current)
    assert result is None


def test_decreasing_flow_no_alert():
    """Decreasing flow should not trigger."""
    previous = {"gauge_id": "jucar_001", "flow_m3s": 200.0}
    current = {"gauge_id": "jucar_001", "flow_m3s": 150.0}
    result = detect_rapid_flow_increase(previous, current)
    assert result is None


def test_zero_previous_flow_no_alert():
    """Zero previous flow should not trigger (avoid division by zero)."""
    previous = {"gauge_id": "jucar_001", "flow_m3s": 0.0}
    current = {"gauge_id": "jucar_001", "flow_m3s": 50.0}
    result = detect_rapid_flow_increase(previous, current)
    assert result is None


def test_exactly_50_percent_triggers():
    """Exactly 50% increase should trigger severity 4."""
    previous = {"gauge_id": "jucar_001", "flow_m3s": 100.0}
    current = {"gauge_id": "jucar_001", "flow_m3s": 150.0}
    result = detect_rapid_flow_increase(previous, current)
    assert result is not None
    assert result.severity == 4


def test_exactly_100_percent_triggers_severity_5():
    """Exactly 100% increase should trigger severity 5."""
    previous = {"gauge_id": "jucar_001", "flow_m3s": 100.0}
    current = {"gauge_id": "jucar_001", "flow_m3s": 200.0}
    result = detect_rapid_flow_increase(previous, current)
    assert result is not None
    assert result.severity == 5


def test_alert_contains_gauge_id():
    """Alert should contain the gauge_id from the reading."""
    previous = {"gauge_id": "ebro_007", "flow_m3s": 50.0}
    current = {"gauge_id": "ebro_007", "flow_m3s": 80.0}
    result = detect_rapid_flow_increase(previous, current)
    assert result is not None
    assert result.gauge_id == "ebro_007"
