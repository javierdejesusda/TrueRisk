"""Tests for alert escalation and multi-channel delivery."""
import pytest
from app.services.alert_escalation_service import (
    should_escalate,
    determine_delivery_channels,
    CHANNEL_PRIORITY,
)


def test_severity_5_triggers_escalation_after_30_min():
    assert should_escalate(5, 35, acknowledged=False) is True


def test_severity_4_triggers_escalation_after_60_min():
    assert should_escalate(4, 65, acknowledged=False) is True


def test_no_escalation_when_acknowledged():
    assert should_escalate(5, 60, acknowledged=True) is False


def test_severity_3_no_escalation():
    assert should_escalate(3, 120, acknowledged=False) is False


def test_severity_5_too_soon():
    assert should_escalate(5, 10, acknowledged=False) is False


def test_severity_5_skips_quiet_hours():
    prefs = {"quiet_hours_start": "23:00", "quiet_hours_end": "07:00", "emergency_override": True}
    channels = determine_delivery_channels(severity=5, prefs=prefs, hour=2)
    assert len(channels) > 0
    assert channels == CHANNEL_PRIORITY


def test_severity_3_blocked_during_quiet():
    prefs = {"quiet_hours_start": "23:00", "quiet_hours_end": "07:00", "emergency_override": True}
    channels = determine_delivery_channels(severity=3, prefs=prefs, hour=2)
    assert channels == []


def test_severity_5_blocked_when_no_override():
    prefs = {"quiet_hours_start": "23:00", "quiet_hours_end": "07:00", "emergency_override": False}
    channels = determine_delivery_channels(severity=5, prefs=prefs, hour=2)
    assert channels == []


def test_normal_hours_all_channels():
    prefs = {"quiet_hours_start": "23:00", "quiet_hours_end": "07:00"}
    channels = determine_delivery_channels(severity=2, prefs=prefs, hour=14)
    assert channels == CHANNEL_PRIORITY
