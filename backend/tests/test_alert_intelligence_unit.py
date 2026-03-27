"""Unit tests for alert intelligence service: should_deliver, compute_relevance, explain_alert."""

import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

from app.services.alert_intelligence_service import (
    should_deliver,
    compute_relevance,
    explain_alert,
)


def _make_alert(severity=3, province_code="28", hazard_type="flood", is_active=True):
    alert = MagicMock()
    alert.id = 1
    alert.severity = severity
    alert.province_code = province_code
    alert.hazard_type = hazard_type
    alert.is_active = is_active
    return alert


def _make_user(province_code="28", threshold=2, hazard_preferences=None):
    user = MagicMock(spec=["province_code", "alert_severity_threshold", "hazard_preferences"])
    user.province_code = province_code
    user.alert_severity_threshold = threshold
    user.hazard_preferences = hazard_preferences if hazard_preferences is not None else []
    return user


def _make_prefs(
    emergency_override=True,
    quiet_hours_start=None,
    quiet_hours_end=None,
    snoozed_hazards=None,
):
    prefs = MagicMock()
    prefs.emergency_override = emergency_override
    prefs.quiet_hours_start = quiet_hours_start
    prefs.quiet_hours_end = quiet_hours_end
    prefs.snoozed_hazards = snoozed_hazards
    return prefs


def _make_province(name="Madrid", province_code="28"):
    province = MagicMock()
    province.name = name
    province.flood_risk_weight = 0.7
    province.wildfire_risk_weight = 0.4
    province.drought_risk_weight = 0.5
    province.heatwave_risk_weight = 0.6
    province.seismic_risk_weight = 0.2
    province.coldwave_risk_weight = 0.3
    province.windstorm_risk_weight = 0.3
    return province


# ---------------------------------------------------------------------------
# should_deliver
# ---------------------------------------------------------------------------

class TestShouldDeliver:
    def test_no_prefs_above_threshold(self):
        alert = _make_alert(severity=3)
        user = _make_user(threshold=2)
        assert should_deliver(alert, user, None) is True

    def test_no_prefs_below_threshold(self):
        alert = _make_alert(severity=1)
        user = _make_user(threshold=3)
        assert should_deliver(alert, user, None) is False

    def test_emergency_override(self):
        alert = _make_alert(severity=4)
        user = _make_user(threshold=5)
        prefs = _make_prefs(emergency_override=True)
        assert should_deliver(alert, user, prefs) is True

    def test_below_threshold_with_prefs(self):
        alert = _make_alert(severity=1)
        user = _make_user(threshold=3)
        prefs = _make_prefs(emergency_override=False)
        assert should_deliver(alert, user, prefs) is False

    def test_snoozed_blocks(self):
        future = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
        alert = _make_alert(severity=3, hazard_type="flood")
        user = _make_user(threshold=2)
        prefs = _make_prefs(snoozed_hazards={"flood": future})
        assert should_deliver(alert, user, prefs) is False

    def test_expired_snooze_allows(self):
        past = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
        alert = _make_alert(severity=3, hazard_type="flood")
        user = _make_user(threshold=2)
        prefs = _make_prefs(snoozed_hazards={"flood": past})
        assert should_deliver(alert, user, prefs) is True

    def test_severity_equals_threshold(self):
        alert = _make_alert(severity=3)
        user = _make_user(threshold=3)
        assert should_deliver(alert, user, None) is True


# ---------------------------------------------------------------------------
# compute_relevance
# ---------------------------------------------------------------------------

class TestComputeRelevance:
    def test_same_province_high(self):
        alert = _make_alert(severity=4, province_code="28")
        user = _make_user(province_code="28")
        score = compute_relevance(alert, user, None)
        assert score >= 0.5

    def test_different_province_lower(self):
        alert = _make_alert(severity=3, province_code="08")
        user = _make_user(province_code="28")
        province = _make_province()
        score = compute_relevance(alert, user, province)
        assert score < 0.5

    def test_matching_hazard_boosts(self):
        alert = _make_alert(severity=3, province_code="28", hazard_type="flood")
        user = _make_user(province_code="28", hazard_preferences=["flood"])
        score_with = compute_relevance(alert, user, None)

        user2 = _make_user(province_code="28", hazard_preferences=["wildfire"])
        score_without = compute_relevance(alert, user2, None)

        assert score_with > score_without

    def test_active_bonus(self):
        alert_active = _make_alert(severity=3, is_active=True)
        alert_inactive = _make_alert(severity=3, is_active=False)
        user = _make_user()
        score_active = compute_relevance(alert_active, user, None)
        score_inactive = compute_relevance(alert_inactive, user, None)
        assert score_active > score_inactive

    def test_clamped_to_1(self):
        alert = _make_alert(severity=5, province_code="28", is_active=True)
        user = _make_user(province_code="28", hazard_preferences=["flood"])
        score = compute_relevance(alert, user, _make_province())
        assert score <= 1.0


# ---------------------------------------------------------------------------
# explain_alert
# ---------------------------------------------------------------------------

class TestExplainAlert:
    def test_same_province(self):
        alert = _make_alert(province_code="28", hazard_type="flood")
        user = _make_user(province_code="28")
        province = _make_province(name="Madrid")

        explanation = explain_alert(alert, user, province)
        assert "Affects your province (Madrid)" in explanation.factors
        assert explanation.relevance_score >= 0

    def test_different_province(self):
        alert = _make_alert(province_code="08", hazard_type="flood")
        user = _make_user(province_code="28")
        province = _make_province(name="Madrid")

        explanation = explain_alert(alert, user, province)
        assert any("Nearby province" in f for f in explanation.factors)

    def test_tracked_hazard(self):
        alert = _make_alert(province_code="28", hazard_type="flood")
        user = _make_user(province_code="28", hazard_preferences=["flood"])
        province = _make_province()

        explanation = explain_alert(alert, user, province)
        assert any("Matches your tracked hazard: flood" in f for f in explanation.factors)
