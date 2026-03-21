"""Unit tests for the explainability service."""

from app.services.explainability_service import (
    explain_risk,
    explain_flood,
    explain_wildfire,
    explain_drought,
    explain_heatwave,
    explain_seismic,
    explain_coldwave,
    explain_windstorm,
)


def test_explain_flood_high_precip():
    contributions = explain_flood({"precip_24h": 120, "precip_6h": 55, "soil_moisture": 0.9})
    assert any(c["feature"] == "precip_24h" and c["contribution"] == 40 for c in contributions)
    assert any(c["feature"] == "precip_6h" and c["contribution"] == 20 for c in contributions)
    assert any(c["feature"] == "soil_moisture" and c["contribution"] == 15 for c in contributions)


def test_explain_flood_zero():
    contributions = explain_flood({})
    total = sum(c["contribution"] for c in contributions)
    assert total < 10  # mostly zeros with default river_basin_risk contribution


def test_explain_wildfire_dry():
    contributions = explain_wildfire({
        "fwi": 55, "consecutive_dry_days": 35, "humidity": 10, "temperature": 42
    })
    assert any(c["contribution"] == 60 for c in contributions)  # fwi > 50
    assert any(c["contribution"] == 15 for c in contributions)  # dry_days > 30


def test_explain_drought():
    contributions = explain_drought({"consecutive_dry_days": 50, "soil_moisture": 0.15})
    assert any(c["feature"] == "consecutive_dry_days" and c["contribution"] == 40 for c in contributions)
    assert any(c["feature"] == "soil_moisture" and c["contribution"] == 18 for c in contributions)


def test_explain_heatwave():
    contributions = explain_heatwave({"heat_index": 45, "consecutive_hot_days": 8})
    assert any(c["feature"] == "heat_index" and c["contribution"] == 60 for c in contributions)
    assert any(c["feature"] == "consecutive_hot_days" and c["contribution"] == 15 for c in contributions)


def test_explain_seismic():
    contributions = explain_seismic({
        "max_magnitude_30d": 4.5,
        "earthquake_count_30d": 12,
        "nearest_quake_distance_km": 80,
    })
    assert any(c["feature"] == "max_magnitude_30d" and c["contribution"] == 30 for c in contributions)
    assert any(c["feature"] == "earthquake_count_30d" and c["contribution"] == 10 for c in contributions)


def test_explain_coldwave():
    contributions = explain_coldwave({"wind_chill": -12, "temperature_min": -7})
    assert any(c["feature"] == "wind_chill" and c["contribution"] == 30 for c in contributions)
    assert any(c["feature"] == "temperature_min" and c["contribution"] == 15 for c in contributions)


def test_explain_windstorm():
    contributions = explain_windstorm({
        "wind_gusts": 105, "wind_speed": 65, "pressure_change_6h": -8
    })
    assert any(c["feature"] == "wind_gusts" and c["contribution"] == 40 for c in contributions)
    assert any(c["feature"] == "pressure_change_6h" and c["contribution"] == 10 for c in contributions)


def test_explain_risk_all_hazards():
    snapshot = {
        "flood": {"precip_24h": 50},
        "wildfire": {"fwi": 20},
        "drought": {"consecutive_dry_days": 10},
        "heatwave": {"heat_index": 30},
        "seismic": {"max_magnitude_30d": 2.5},
        "coldwave": {"wind_chill": 5},
        "windstorm": {"wind_gusts": 30},
    }
    result = explain_risk(snapshot)
    assert len(result) == 7
    for hazard in ["flood", "wildfire", "drought", "heatwave", "seismic", "coldwave", "windstorm"]:
        assert hazard in result
        assert isinstance(result[hazard], list)
        assert len(result[hazard]) > 0


def test_contributions_sorted_descending():
    explain_flood({"precip_24h": 70, "precip_6h": 35, "soil_moisture": 0.7})
    result = explain_risk({"flood": {"precip_24h": 70, "precip_6h": 35, "soil_moisture": 0.7}})
    flood = result["flood"]
    for i in range(len(flood) - 1):
        assert flood[i]["contribution"] >= flood[i + 1]["contribution"]


def test_contribution_has_all_fields():
    contributions = explain_flood({"precip_24h": 50})
    for c in contributions:
        assert "feature" in c
        assert "value" in c
        assert "contribution" in c
        assert "description" in c
