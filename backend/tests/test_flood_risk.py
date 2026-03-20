"""Unit tests for the flood risk model (rule-based fallback)."""

from app.ml.models.flood_risk import predict_flood_risk, _rule_based_flood, FEATURE_NAMES


def test_feature_names_defined():
    assert len(FEATURE_NAMES) == 23
    assert "precip_24h" in FEATURE_NAMES
    assert "soil_moisture" in FEATURE_NAMES


def test_zero_inputs():
    score = _rule_based_flood({})
    assert 0 <= score <= 100


def test_extreme_precipitation():
    score = _rule_based_flood({"precip_24h": 120})
    assert score >= 40


def test_moderate_precipitation():
    score = _rule_based_flood({"precip_24h": 35})
    assert 10 <= score <= 100


def test_saturated_soil():
    score = _rule_based_flood({"soil_moisture": 0.9})
    assert score >= 15


def test_combined_high_risk():
    score = _rule_based_flood({
        "precip_24h": 110,
        "precip_6h": 55,
        "soil_moisture": 0.85,
        "river_basin_risk": 0.8,
        "is_mediterranean": True,
        "humidity": 95,
    })
    assert score >= 70


def test_score_capped_at_100():
    score = _rule_based_flood({
        "precip_24h": 200,
        "precip_6h": 100,
        "soil_moisture": 1.0,
        "river_basin_risk": 1.0,
        "is_mediterranean": True,
        "humidity": 99,
    })
    assert score <= 100


def test_predict_uses_rule_fallback():
    """Without trained model files, predict_flood_risk should use rule-based."""
    score = predict_flood_risk({"precip_24h": 70, "soil_moisture": 0.7})
    assert 0 <= score <= 100
    assert score > 0
