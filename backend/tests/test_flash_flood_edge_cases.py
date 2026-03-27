"""Edge case tests for flash flood detection service."""
from app.services.flash_flood_service import (
    detect_rapid_flow_increase,
    FloodAlert,
)


class TestDetectRapidFlowIncrease:
    def test_50_percent_increase_triggers_severity_4(self):
        prev = {"gauge_id": "g1", "flow_m3s": 100}
        curr = {"gauge_id": "g1", "flow_m3s": 150}
        alert = detect_rapid_flow_increase(prev, curr)
        assert alert is not None
        assert alert.severity == 4

    def test_100_percent_increase_triggers_severity_5(self):
        prev = {"gauge_id": "g1", "flow_m3s": 100}
        curr = {"gauge_id": "g1", "flow_m3s": 200}
        alert = detect_rapid_flow_increase(prev, curr)
        assert alert is not None
        assert alert.severity == 5

    def test_49_percent_increase_no_alert(self):
        prev = {"gauge_id": "g1", "flow_m3s": 100}
        curr = {"gauge_id": "g1", "flow_m3s": 149}
        alert = detect_rapid_flow_increase(prev, curr)
        assert alert is None

    def test_zero_previous_flow(self):
        prev = {"gauge_id": "g1", "flow_m3s": 0}
        curr = {"gauge_id": "g1", "flow_m3s": 100}
        alert = detect_rapid_flow_increase(prev, curr)
        assert alert is None

    def test_negative_previous_flow(self):
        prev = {"gauge_id": "g1", "flow_m3s": -5}
        curr = {"gauge_id": "g1", "flow_m3s": 50}
        alert = detect_rapid_flow_increase(prev, curr)
        assert alert is None

    def test_decreasing_flow_no_alert(self):
        prev = {"gauge_id": "g1", "flow_m3s": 200}
        curr = {"gauge_id": "g1", "flow_m3s": 100}
        alert = detect_rapid_flow_increase(prev, curr)
        assert alert is None

    def test_equal_flow_no_alert(self):
        prev = {"gauge_id": "g1", "flow_m3s": 100}
        curr = {"gauge_id": "g1", "flow_m3s": 100}
        alert = detect_rapid_flow_increase(prev, curr)
        assert alert is None

    def test_very_small_baseline_high_percent(self):
        prev = {"gauge_id": "g1", "flow_m3s": 0.01}
        curr = {"gauge_id": "g1", "flow_m3s": 1.0}
        alert = detect_rapid_flow_increase(prev, curr)
        assert alert is not None
        assert alert.severity == 5

    def test_alert_contains_correct_gauge_id(self):
        prev = {"gauge_id": "ebro_001", "flow_m3s": 100}
        curr = {"gauge_id": "ebro_001", "flow_m3s": 200}
        alert = detect_rapid_flow_increase(prev, curr)
        assert alert.gauge_id == "ebro_001"

    def test_alert_message_contains_flow_values(self):
        prev = {"gauge_id": "g1", "flow_m3s": 100}
        curr = {"gauge_id": "g1", "flow_m3s": 250}
        alert = detect_rapid_flow_increase(prev, curr)
        assert "100.0" in alert.message
        assert "250.0" in alert.message

    def test_missing_flow_key_in_current(self):
        prev = {"gauge_id": "g1", "flow_m3s": 100}
        curr = {"gauge_id": "g1"}
        alert = detect_rapid_flow_increase(prev, curr)
        assert alert is None

    def test_missing_flow_key_in_previous(self):
        prev = {"gauge_id": "g1"}
        curr = {"gauge_id": "g1", "flow_m3s": 200}
        alert = detect_rapid_flow_increase(prev, curr)
        assert alert is None

    def test_exactly_50_percent_triggers(self):
        prev = {"gauge_id": "g1", "flow_m3s": 100}
        curr = {"gauge_id": "g1", "flow_m3s": 150}
        alert = detect_rapid_flow_increase(prev, curr)
        assert alert is not None
        assert alert.severity == 4

    def test_exactly_100_percent_triggers_severity_5(self):
        prev = {"gauge_id": "g1", "flow_m3s": 100}
        curr = {"gauge_id": "g1", "flow_m3s": 200}
        alert = detect_rapid_flow_increase(prev, curr)
        assert alert is not None
        assert alert.severity == 5


class TestFloodAlertDataclass:
    def test_flood_alert_fields(self):
        fa = FloodAlert(
            gauge_id="test", gauge_name="Test Gauge",
            river_name="Tajo", basin="tajo",
            province_code="28", flow_m3s=150.5,
            threshold_exceeded="P95", severity=4,
            message="Warning",
        )
        assert fa.gauge_id == "test"
        assert fa.severity == 4
        assert fa.threshold_exceeded == "P95"
        assert fa.flow_m3s == 150.5

    def test_flood_alert_p90_severity_3(self):
        fa = FloodAlert(
            gauge_id="g1", gauge_name="G1", river_name="R",
            basin="b", province_code="28", flow_m3s=100.0,
            threshold_exceeded="P90", severity=3, message="Alert",
        )
        assert fa.severity == 3
        assert fa.threshold_exceeded == "P90"
