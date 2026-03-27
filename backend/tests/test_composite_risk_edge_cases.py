"""Edge case tests for composite risk: NaN, negatives, DANA, ties."""
import math
from app.ml.models.composite_risk import compute_composite_risk, score_to_severity


def test_nan_input_does_not_propagate():
    """NaN in any hazard must not produce NaN composite."""
    result = compute_composite_risk(float("nan"), 50, 0, 0, 0, 0, 0, 0)
    assert not math.isnan(result["composite_score"])
    assert 0 <= result["composite_score"] <= 100


def test_negative_input_clamped_to_zero():
    result = compute_composite_risk(-10, 50, 0, 0, 0, 0, 0, 0)
    assert result["flood_score"] >= 0
    assert result["composite_score"] >= 0


def test_inf_input_clamped_to_100():
    result = compute_composite_risk(float("inf"), 0, 0, 0, 0, 0, 0, 0)
    assert result["composite_score"] <= 100
    assert result["flood_score"] <= 100


def test_dana_eighth_hazard_contributes():
    """DANA (8th param) should contribute to composite."""
    without_dana = compute_composite_risk(50, 0, 0, 0, 0, 0, 0, 0)
    with_dana = compute_composite_risk(50, 0, 0, 0, 0, 0, 0, 40)
    assert with_dana["composite_score"] > without_dana["composite_score"]
    assert with_dana["dana_score"] == 40


def test_dana_can_be_dominant():
    result = compute_composite_risk(10, 10, 10, 10, 10, 10, 10, 90)
    assert result["dominant_hazard"] == "dana"


def test_tie_breaking_deterministic():
    """Two hazards tied at max => deterministic dominant hazard."""
    r1 = compute_composite_risk(50, 50, 0, 0, 0, 0, 0, 0)
    r2 = compute_composite_risk(50, 50, 0, 0, 0, 0, 0, 0)
    assert r1["dominant_hazard"] == r2["dominant_hazard"]


def test_all_equal_moderate():
    result = compute_composite_risk(30, 30, 30, 30, 30, 30, 30, 30)
    assert result["composite_score"] > 30  # secondary contributions
    assert result["composite_score"] < 50  # shouldn't inflate too much


def test_severity_boundary_20():
    assert score_to_severity(20) == "low"
    assert score_to_severity(20.01) == "moderate"


def test_severity_boundary_40():
    assert score_to_severity(40) == "moderate"
    assert score_to_severity(40.01) == "high"


def test_severity_boundary_60():
    assert score_to_severity(60) == "high"
    assert score_to_severity(60.01) == "very_high"


def test_severity_boundary_80():
    assert score_to_severity(80) == "very_high"
    assert score_to_severity(80.01) == "critical"


def test_single_extreme_score():
    """One hazard at 95, others at 5. Composite should be near 95."""
    result = compute_composite_risk(5, 5, 5, 5, 5, 5, 5, 95)
    assert result["composite_score"] >= 95
    assert result["severity"] == "critical"
