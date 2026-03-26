"""Tests for climate projection service."""
from app.services.climate_projection_service import (
    get_province_projections,
    get_all_projections,
    get_risk_trend,
    _PROVINCE_ZONE,
)


def test_all_52_provinces_have_zones():
    assert len(_PROVINCE_ZONE) == 52


def test_province_projections_structure():
    result = get_province_projections("28")  # Madrid
    assert result["province_code"] == "28"
    assert result["climate_zone"] == "continental"
    assert "2030s" in result["decades"]
    assert "2050s" in result["decades"]
    assert "ssp245" in result["decades"]["2030s"]
    assert "ssp585" in result["decades"]["2030s"]


def test_projection_values_reasonable():
    result = get_province_projections("29")  # Malaga (mediterranean)
    ssp585_2050 = result["decades"]["2050s"]["ssp585"]
    assert 1.0 < ssp585_2050["temp_anomaly_c"] < 5.0
    assert ssp585_2050["extreme_heat_days"] > 0
    assert ssp585_2050["drought_risk_change_pct"] > 0


def test_all_projections_returns_52():
    result = get_all_projections()
    assert len(result) == 52


def test_risk_trend_returns_3_decades():
    trend = get_risk_trend("46", "heatwave", "ssp585")  # Valencia
    assert len(trend) == 3
    assert trend[0]["decade"] == "2030s"
    assert trend[2]["decade"] == "2050s"
    # Trend should be increasing
    assert trend[2]["change_pct"] >= trend[0]["change_pct"]


def test_unknown_province_defaults_to_continental():
    result = get_province_projections("99")
    assert result["climate_zone"] == "continental"
