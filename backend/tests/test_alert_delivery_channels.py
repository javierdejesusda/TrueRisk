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
