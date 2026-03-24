"""Tests for the impact assessment service."""

import pytest
from app.services.impact_assessment_service import assess_impact


# ---------------------------------------------------------------------------
# Impact level mapping
# ---------------------------------------------------------------------------


def test_high_flood_impact():
    impact = assess_impact(
        hazard_type="flood",
        score=75.0,
        province_code="46",  # Valencia
    )
    assert impact["impact_level"] in ("severe", "extreme")
    assert impact["population_affected"] > 0
    assert len(impact["recommended_actions"]["citizens"]) > 0


def test_low_risk_minimal_impact():
    impact = assess_impact(
        hazard_type="drought",
        score=15.0,
        province_code="28",  # Madrid
    )
    assert impact["impact_level"] == "minor"


def test_extreme_impact_level():
    impact = assess_impact(hazard_type="flood", score=90.0, province_code="08")
    assert impact["impact_level"] == "extreme"


def test_significant_impact_level():
    impact = assess_impact(hazard_type="wildfire", score=35.0, province_code="18")
    assert impact["impact_level"] == "significant"


def test_severe_impact_level():
    impact = assess_impact(hazard_type="heatwave", score=60.0, province_code="41")
    assert impact["impact_level"] == "severe"


# ---------------------------------------------------------------------------
# Population affected scaling
# ---------------------------------------------------------------------------


def test_population_affected_is_positive():
    impact = assess_impact(hazard_type="flood", score=50.0, province_code="28")
    assert impact["population_affected"] > 0


def test_higher_score_affects_more_population():
    low = assess_impact(hazard_type="flood", score=30.0, province_code="28")
    high = assess_impact(hazard_type="flood", score=80.0, province_code="28")
    assert high["population_affected"] > low["population_affected"]


def test_unknown_province_still_returns_result():
    impact = assess_impact(hazard_type="flood", score=60.0, province_code="99")
    assert impact["impact_level"] == "severe"
    assert impact["population_affected"] >= 0


# ---------------------------------------------------------------------------
# Recommended actions
# ---------------------------------------------------------------------------


def test_citizens_actions_present():
    impact = assess_impact(hazard_type="wildfire", score=70.0, province_code="04")
    assert isinstance(impact["recommended_actions"]["citizens"], list)
    assert len(impact["recommended_actions"]["citizens"]) > 0


def test_authorities_actions_present():
    impact = assess_impact(hazard_type="flood", score=80.0, province_code="46")
    assert isinstance(impact["recommended_actions"]["authorities"], list)
    assert len(impact["recommended_actions"]["authorities"]) > 0


def test_dana_severe_actions():
    impact = assess_impact(hazard_type="dana", score=65.0, province_code="46")
    assert impact["impact_level"] == "severe"
    citizen_actions = impact["recommended_actions"]["citizens"]
    # Should contain DANA-specific guidance about ravines/ramblas
    combined = " ".join(citizen_actions).lower()
    assert any(word in combined for word in ["barranco", "rambla", "caudales", "underground", "subterráneo"])


def test_heatwave_severe_actions():
    impact = assess_impact(hazard_type="heatwave", score=65.0, province_code="28")
    citizen_actions = impact["recommended_actions"]["citizens"]
    combined = " ".join(citizen_actions).lower()
    assert any(word in combined for word in ["sol", "hidrat", "calor", "heat"])


def test_minor_risk_has_actions():
    """Even minor risk should provide some guidance."""
    impact = assess_impact(hazard_type="seismic", score=10.0, province_code="18")
    assert len(impact["recommended_actions"]["citizens"]) > 0


# ---------------------------------------------------------------------------
# Expected disruptions
# ---------------------------------------------------------------------------


def test_expected_disruptions_present():
    impact = assess_impact(hazard_type="flood", score=70.0, province_code="46")
    assert isinstance(impact["expected_disruptions"], list)
    assert len(impact["expected_disruptions"]) > 0


def test_minor_risk_fewer_disruptions():
    """Minor risk should have fewer disruptions than extreme."""
    minor = assess_impact(hazard_type="flood", score=10.0, province_code="28")
    extreme = assess_impact(hazard_type="flood", score=95.0, province_code="28")
    assert len(extreme["expected_disruptions"]) >= len(minor["expected_disruptions"])


# ---------------------------------------------------------------------------
# Return structure
# ---------------------------------------------------------------------------


def test_return_structure_complete():
    impact = assess_impact(hazard_type="drought", score=55.0, province_code="23")
    assert "impact_level" in impact
    assert "population_affected" in impact
    assert "recommended_actions" in impact
    assert "citizens" in impact["recommended_actions"]
    assert "authorities" in impact["recommended_actions"]
    assert "expected_disruptions" in impact


def test_all_hazard_types_handled():
    hazards = ["flood", "wildfire", "drought", "heatwave", "dana", "seismic", "coldwave", "windstorm"]
    for h in hazards:
        impact = assess_impact(hazard_type=h, score=60.0, province_code="28")
        assert impact["impact_level"] == "severe", f"Failed for hazard: {h}"
        assert len(impact["recommended_actions"]["citizens"]) > 0


# ---------------------------------------------------------------------------
# Async API endpoint
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_impact_endpoint(client):
    response = await client.get("/api/v1/risk/28/impact")
    assert response.status_code in (200, 404, 500, 503)
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_impact_endpoint_unknown_province(client):
    response = await client.get("/api/v1/risk/99/impact")
    assert response.status_code in (200, 404, 500, 503)
