"""Unit tests for the composite risk engine."""

from app.ml.models.composite_risk import compute_composite_risk, score_to_severity


def test_single_dominant_hazard():
    result = compute_composite_risk(80, 10, 5, 3, 2, 1, 0)
    assert result["dominant_hazard"] == "flood"
    # New INFORM formula: active=[80,10], geo_mean=(80*10)^0.5≈28.28
    # composite = 0.6*80 + 0.4*28.28 ≈ 59.31
    assert result["composite_score"] >= 55
    assert result["composite_score"] <= 65


def test_all_zero():
    result = compute_composite_risk(0, 0, 0, 0, 0, 0, 0)
    assert result["composite_score"] == 0
    assert result["severity"] == "low"


def test_max_score_capped():
    result = compute_composite_risk(100, 100, 100, 100, 100, 100, 100)
    assert result["composite_score"] <= 100


def test_severity_labels():
    assert score_to_severity(0) == "low"
    assert score_to_severity(20) == "low"
    assert score_to_severity(21) == "moderate"
    assert score_to_severity(40) == "moderate"
    assert score_to_severity(41) == "high"
    assert score_to_severity(60) == "high"
    assert score_to_severity(61) == "very_high"
    assert score_to_severity(80) == "very_high"
    assert score_to_severity(81) == "critical"
    assert score_to_severity(100) == "critical"


def test_secondary_hazards_contribute():
    """Multi-hazard scenario scores higher than single hazard with lower max."""
    single = compute_composite_risk(50, 0, 0, 0, 0, 0, 0)
    multi = compute_composite_risk(60, 50, 40, 30, 20, 10, 6)
    assert multi["composite_score"] > single["composite_score"]


def test_result_contains_all_scores():
    result = compute_composite_risk(10, 20, 30, 40, 50, 60, 70)
    assert result["flood_score"] == 10
    assert result["wildfire_score"] == 20
    assert result["drought_score"] == 30
    assert result["heatwave_score"] == 40
    assert result["seismic_score"] == 50
    assert result["coldwave_score"] == 60
    assert result["windstorm_score"] == 70
    assert result["dominant_hazard"] == "windstorm"


def test_composite_is_rounded():
    result = compute_composite_risk(33.333, 22.222, 11.111, 0, 0, 0, 0)
    assert result["composite_score"] == round(result["composite_score"], 2)
