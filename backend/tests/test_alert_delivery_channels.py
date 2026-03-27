"""Tests for alert delivery channel selection and quiet hours edge cases."""
import pytest
from app.services.alert_escalation_service import (
    should_escalate,
    determine_delivery_channels,
    CHANNEL_PRIORITY,
)


def test_malformed_quiet_hours_start_does_not_crash():
    """Malformed quiet_hours_start should fall back to default, not crash."""
    prefs = {"quiet_hours_start": "abc", "quiet_hours_end": "07:00"}
    channels = determine_delivery_channels(severity=3, prefs=prefs, hour=14)
    assert channels == CHANNEL_PRIORITY


def test_empty_quiet_hours_start_does_not_crash():
    prefs = {"quiet_hours_start": "", "quiet_hours_end": "07:00"}
    channels = determine_delivery_channels(severity=3, prefs=prefs, hour=14)
    assert channels == CHANNEL_PRIORITY


def test_quiet_hours_missing_colon_does_not_crash():
    prefs = {"quiet_hours_start": "23", "quiet_hours_end": "7"}
    channels = determine_delivery_channels(severity=3, prefs=prefs, hour=2)
    assert channels == []  # Should still detect quiet hours


def test_quiet_hours_out_of_range_clamps():
    """Hour values like 25 should not crash."""
    prefs = {"quiet_hours_start": "25:00", "quiet_hours_end": "07:00"}
    channels = determine_delivery_channels(severity=3, prefs=prefs, hour=14)
    assert isinstance(channels, list)


# --- should_escalate edge cases ---

def test_escalate_severity_1_never():
    assert should_escalate(1, 999, acknowledged=False) is False


def test_escalate_severity_0_never():
    assert should_escalate(0, 999, acknowledged=False) is False


def test_escalate_negative_minutes():
    assert should_escalate(5, -1, acknowledged=False) is False


def test_escalate_severity_4_at_exactly_60():
    assert should_escalate(4, 60, acknowledged=False) is True


def test_escalate_severity_4_at_59():
    assert should_escalate(4, 59, acknowledged=False) is False


def test_escalate_severity_5_at_exactly_30():
    assert should_escalate(5, 30, acknowledged=False) is True


def test_escalate_severity_5_at_29():
    assert should_escalate(5, 29, acknowledged=False) is False


def test_escalate_severity_6_uses_severity_5_threshold():
    """Severity >= 5, so 30-minute threshold applies."""
    assert should_escalate(6, 35, acknowledged=False) is True


def test_escalate_acknowledged_always_false():
    for sev in range(1, 6):
        assert should_escalate(sev, 999, acknowledged=True) is False


# --- determine_delivery_channels edge cases ---

def test_channels_empty_prefs_defaults():
    """Empty prefs should use defaults (23:00-07:00)."""
    channels = determine_delivery_channels(severity=3, prefs={}, hour=14)
    assert channels == CHANNEL_PRIORITY


def test_channels_none_prefs_values():
    prefs = {"quiet_hours_start": None, "quiet_hours_end": None}
    channels = determine_delivery_channels(severity=3, prefs=prefs, hour=14)
    assert channels == CHANNEL_PRIORITY


def test_channels_quiet_at_23():
    prefs = {"quiet_hours_start": "23:00", "quiet_hours_end": "07:00"}
    channels = determine_delivery_channels(severity=3, prefs=prefs, hour=23)
    assert channels == []


def test_channels_not_quiet_at_07():
    """07:00 is end of quiet, should NOT be quiet."""
    prefs = {"quiet_hours_start": "23:00", "quiet_hours_end": "07:00"}
    channels = determine_delivery_channels(severity=3, prefs=prefs, hour=7)
    assert channels == CHANNEL_PRIORITY


def test_channels_quiet_at_midnight():
    prefs = {"quiet_hours_start": "23:00", "quiet_hours_end": "07:00"}
    channels = determine_delivery_channels(severity=3, prefs=prefs, hour=0)
    assert channels == []


def test_channels_same_day_quiet_hours():
    """Quiet hours within same day (e.g., 13:00-15:00 siesta)."""
    prefs = {"quiet_hours_start": "13:00", "quiet_hours_end": "15:00"}
    channels = determine_delivery_channels(severity=3, prefs=prefs, hour=14)
    assert channels == []


def test_channels_same_day_not_quiet():
    prefs = {"quiet_hours_start": "13:00", "quiet_hours_end": "15:00"}
    channels = determine_delivery_channels(severity=3, prefs=prefs, hour=16)
    assert channels == CHANNEL_PRIORITY


def test_channels_severity_5_emergency_override_default_true():
    """emergency_override defaults to True when missing."""
    prefs = {"quiet_hours_start": "23:00", "quiet_hours_end": "07:00"}
    channels = determine_delivery_channels(severity=5, prefs=prefs, hour=2)
    assert channels == CHANNEL_PRIORITY
