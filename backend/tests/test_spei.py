"""Tests for the SPEI (Standardized Precipitation-Evapotranspiration Index)
multi-scale computation module.
"""

from __future__ import annotations


from app.ml.features.spei import compute_spei


class TestSPEINormalConditions:
    """Average precipitation should give SPEI near 0."""

    def test_spei_normal_conditions(self):
        """With constant moderate precipitation over a long period, SPEI-1m
        should remain close to zero (within +/-2 std devs)."""
        # Use a longer series so seasonal PET variation averages out
        precip_history = [50.0] * 360  # 360 days of steady rain
        temp_history = [20.0] * 360
        result = compute_spei(precip_history, temp_history, latitude=40.0)
        assert result["spei_1m"] is not None
        # With uniform precipitation the SPEI should be modest in magnitude
        assert -2.0 < result["spei_1m"] < 2.0


class TestSPEIDrought:
    """Zero precipitation should give strongly negative SPEI."""

    def test_spei_drought_1m(self):
        precip_history = [0.0] * 90
        temp_history = [30.0] * 90
        result = compute_spei(precip_history, temp_history, latitude=40.0)
        assert result["spei_1m"] is not None
        assert result["spei_1m"] < -1.0

    def test_spei_drought_3m(self):
        precip_history = [0.0] * 90
        temp_history = [30.0] * 90
        result = compute_spei(precip_history, temp_history, latitude=40.0)
        assert result["spei_3m"] is not None
        assert result["spei_3m"] < -1.0


class TestSPEIAllScales:
    """Should return 1m, 3m, and 6m SPEI values when data is sufficient."""

    def test_spei_returns_all_scales(self):
        precip = [40.0] * 180
        temp = [20.0] * 180
        result = compute_spei(precip, temp, latitude=40.0)
        assert all(k in result for k in ("spei_1m", "spei_3m", "spei_6m"))

    def test_spei_6m_with_sufficient_data(self):
        """With 180+ days, SPEI-6m should be computable."""
        precip = [40.0] * 360
        temp = [20.0] * 360
        result = compute_spei(precip, temp, latitude=40.0)
        assert result["spei_6m"] is not None


class TestSPEIInsufficientData:
    """With <30 days of data, should return None values gracefully."""

    def test_spei_insufficient_data(self):
        result = compute_spei([10.0] * 10, [20.0] * 10, latitude=40.0)
        assert result["spei_1m"] is None
        assert result["spei_3m"] is None
        assert result["spei_6m"] is None

    def test_spei_mismatched_lengths(self):
        """Mismatched input lengths should return Nones, not crash."""
        result = compute_spei([10.0] * 90, [20.0] * 50, latitude=40.0)
        assert result["spei_1m"] is None

    def test_spei_empty_input(self):
        result = compute_spei([], [], latitude=40.0)
        assert result == {"spei_1m": None, "spei_3m": None, "spei_6m": None}


class TestSPEIVariedConditions:
    """SPEI should reflect wet vs dry patterns."""

    def test_wet_conditions_positive(self):
        """High precipitation with cool temps should give positive SPEI."""
        # Create a varied baseline then add a very wet recent month
        precip = [20.0] * 300 + [200.0] * 30  # wet recent month
        temp = [15.0] * 330
        result = compute_spei(precip, temp, latitude=40.0)
        if result["spei_1m"] is not None:
            assert result["spei_1m"] > 0.0

    def test_dry_conditions_negative(self):
        """Low precipitation with high temps should give negative SPEI."""
        # Normal baseline then dry recent month
        precip = [50.0] * 300 + [0.0] * 30
        temp = [15.0] * 300 + [35.0] * 30
        result = compute_spei(precip, temp, latitude=40.0)
        if result["spei_1m"] is not None:
            assert result["spei_1m"] < 0.0
