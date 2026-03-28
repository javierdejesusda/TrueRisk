"""Tests for prediction service upgrades C1-C11."""
from __future__ import annotations

import numpy as np

from app.services.prediction_service import (
    _bootstrap_ci,
    _ema_analysis,
    _gev_analysis,
    _gev_fallback,
    _knn_matches,
    _mann_kendall_test,
    _pot_gpd_analysis,
    _rule_based_classifier,
    _decision_tree,
    _zscore_analysis,
)


# ---------------------------------------------------------------------------
# C1: GEV fitting returns shape/loc/scale params
# ---------------------------------------------------------------------------

class TestGEVAnalysis:
    def test_gev_returns_shape_loc_scale(self):
        rng = np.random.default_rng(42)
        values = rng.gumbel(loc=20, scale=5, size=200).tolist()
        result = _gev_analysis(values, 25.0)
        params = result["params"]
        assert "shape" in params
        assert "loc" in params
        assert "scale" in params
        # Backward compat
        assert "mu" in params
        assert "beta" in params

    def test_gev_returns_pdf_curve(self):
        rng = np.random.default_rng(42)
        values = rng.gumbel(loc=20, scale=5, size=200).tolist()
        result = _gev_analysis(values, 25.0)
        assert len(result["pdfCurve"]) == 61
        assert all("x" in p and "y" in p for p in result["pdfCurve"])

    def test_gev_returns_return_levels(self):
        rng = np.random.default_rng(42)
        values = rng.gumbel(loc=20, scale=5, size=200).tolist()
        result = _gev_analysis(values, 25.0)
        periods = [rl["period"] for rl in result["returnLevels"]]
        assert periods == [2, 5, 10, 25, 50, 100]

    def test_gev_fallback_for_small_sample(self):
        result = _gev_analysis([1.0, 2.0, 3.0], 2.0)
        assert result["exceedanceProbability"] == 0.5
        assert result["pdfCurve"] == []

    def test_gev_fallback_function(self):
        result = _gev_fallback(15.0)
        assert result["currentValue"] == 15.0
        assert result["params"]["shape"] == 0

    def test_gev_degenerate_constant_data(self):
        """Constant values should return fallback, not crash."""
        result = _gev_analysis([5.0] * 100, 5.0)
        assert "params" in result
        assert result["currentValue"] == 5.0

    def test_gev_handles_none_as_nan(self):
        """Values with NaN should be filtered gracefully."""
        values = [1.0, 2.0, float("nan")] * 10
        result = _gev_analysis(values, 2.0)
        assert "params" in result


# ---------------------------------------------------------------------------
# C2: Return period capping
# ---------------------------------------------------------------------------

class TestReturnPeriodCapping:
    def test_max_credible_return_period_present(self):
        rng = np.random.default_rng(42)
        values = rng.gumbel(loc=20, scale=5, size=200).tolist()
        result = _gev_analysis(values, 25.0)
        assert "maxCredibleReturnPeriod" in result
        assert "returnPeriodCapped" in result
        assert result["maxCredibleReturnPeriod"] > 0

    def test_low_confidence_on_extreme_return_levels(self):
        rng = np.random.default_rng(42)
        # 100 daily observations ~ 0.27 years -> max credible ~ 0.55 years
        values = rng.gumbel(loc=20, scale=5, size=100).tolist()
        result = _gev_analysis(values, 25.0)
        # 100-year return level should be marked low confidence
        rl_100 = [rl for rl in result["returnLevels"] if rl["period"] == 100][0]
        assert rl_100["lowConfidence"] is True


# ---------------------------------------------------------------------------
# C3: Distribution-appropriate anomaly detection
# ---------------------------------------------------------------------------

class TestDistributionZScores:
    def test_gamma_zscore_for_precipitation(self):
        rng = np.random.default_rng(42)
        # Gamma-distributed precipitation (always >= 0)
        values = rng.gamma(shape=2, scale=5, size=100).tolist()
        records = [{"precipitation": v} for v in values]
        latest = {"precipitation": 30.0}  # extreme value
        results = _zscore_analysis(records, latest)
        precip_result = [r for r in results if r["field"] == "precipitation"][0]
        assert precip_result["distribution"] == "gamma"
        assert precip_result["zScore"] > 0  # extreme high value

    def test_weibull_zscore_for_wind(self):
        rng = np.random.default_rng(42)
        # Weibull-distributed wind
        values = rng.weibull(a=2, size=100).tolist()
        values = [v * 20 for v in values]  # scale to realistic wind
        records = [{"wind_speed": v} for v in values]
        latest = {"wind_speed": 80.0}  # extreme value
        results = _zscore_analysis(records, latest)
        wind_result = [r for r in results if r["field"] == "windSpeed"][0]
        assert wind_result["distribution"] == "weibull"
        assert wind_result["zScore"] > 0

    def test_gaussian_zscore_for_temperature(self):
        rng = np.random.default_rng(42)
        values = rng.normal(loc=20, scale=5, size=100).tolist()
        records = [{"temperature": v} for v in values]
        latest = {"temperature": 35.0}
        results = _zscore_analysis(records, latest)
        temp_result = [r for r in results if r["field"] == "temperature"][0]
        assert temp_result["distribution"] == "gaussian"
        assert temp_result["zScore"] > 2  # should be anomaly

    def test_distribution_field_present_in_all(self):
        records = [
            {"temperature": 20, "humidity": 50, "precipitation": 5,
             "wind_speed": 15, "pressure": 1013}
            for _ in range(50)
        ]
        latest = records[-1]
        results = _zscore_analysis(records, latest)
        for r in results:
            assert "distribution" in r


# ---------------------------------------------------------------------------
# C5: Rule-based classifier rename
# ---------------------------------------------------------------------------

class TestRuleBasedClassifier:
    def test_rule_based_classifier_exists(self):
        result = _rule_based_classifier({"temperature": 40, "precipitation": 0,
                                         "wind_speed": 10, "humidity": 20})
        assert result["type"] == "heat_wave"
        assert result["confidence"] > 0

    def test_backward_compat_alias(self):
        result = _decision_tree({"temperature": 40, "precipitation": 0,
                                 "wind_speed": 10, "humidity": 20})
        assert result["type"] == "heat_wave"


# ---------------------------------------------------------------------------
# C6: KNN normalization (6D)
# ---------------------------------------------------------------------------

class TestKNNNormalization:
    def test_knn_uses_6d(self):
        latest = {
            "temperature": 22, "precipitation": 80, "wind_speed": 65,
            "humidity": 92, "pressure": 1003, "soil_moisture": 0.55,
        }
        matches = _knn_matches(latest, k=3)
        assert len(matches) == 3
        # The closest match should be Valencia DANA (very similar conditions)
        assert "DANA" in matches[0]["event"] or "Valencia" in matches[0]["event"]

    def test_knn_returns_normalized_distances(self):
        latest = {
            "temperature": 22, "precipitation": 80, "wind_speed": 65,
            "humidity": 92, "pressure": 1003, "soil_moisture": 0.55,
        }
        matches = _knn_matches(latest, k=5)
        # Distances should be based on z-normalized features
        for m in matches:
            assert "distance" in m
            assert m["distance"] >= 0

    def test_knn_fallback_to_historical_when_events_empty(self):
        """When events list is empty/falsy, falls back to _HISTORICAL_EVENTS."""
        latest = {"temperature": 20, "precipitation": 5, "wind_speed": 10,
                   "humidity": 50, "pressure": 1013, "soil_moisture": 0.3}
        matches = _knn_matches(latest, k=5, events=[])
        assert len(matches) == 5  # falls back to _HISTORICAL_EVENTS


# ---------------------------------------------------------------------------
# C8: Mann-Kendall trend test
# ---------------------------------------------------------------------------

class TestMannKendall:
    def test_trending_data(self):
        # Clear upward trend
        values = [float(i) + np.random.default_rng(42).normal(0, 0.5) for i in range(50)]
        result = _mann_kendall_test(values)
        assert result["trend"] == "increasing"
        assert result["p_value"] < 0.05
        assert result["slope"] > 0
        assert result["significanceLevel"] in ("very_significant", "significant")

    def test_no_trend_data(self):
        rng = np.random.default_rng(42)
        values = rng.normal(loc=20, scale=1, size=50).tolist()
        result = _mann_kendall_test(values)
        assert result["trend"] == "no trend"
        assert result["significanceLevel"] == "not_significant"

    def test_insufficient_data(self):
        result = _mann_kendall_test([1.0, 2.0, 3.0])
        assert result["trend"] == "no data"
        assert result["p_value"] == 1.0


# ---------------------------------------------------------------------------
# C9: POT+GPD
# ---------------------------------------------------------------------------

class TestPOTGPD:
    def test_pot_returns_valid_results(self):
        rng = np.random.default_rng(42)
        values = rng.exponential(scale=10, size=500).tolist()
        result = _pot_gpd_analysis(values, 30.0)
        assert result["threshold"] > 0
        assert result["nExceedances"] > 0
        assert len(result["returnLevels"]) == 5
        # Return levels should increase with period
        levels = [rl["value"] for rl in result["returnLevels"]]
        for i in range(1, len(levels)):
            assert levels[i] >= levels[i - 1]

    def test_pot_insufficient_data(self):
        result = _pot_gpd_analysis([1.0, 2.0, 3.0], 2.0)
        assert result["nExceedances"] == 0
        assert result["returnLevels"] == []

    def test_pot_shape_and_scale_present(self):
        rng = np.random.default_rng(42)
        values = rng.exponential(scale=10, size=500).tolist()
        result = _pot_gpd_analysis(values, 30.0)
        assert "shape" in result
        assert "scale" in result


# ---------------------------------------------------------------------------
# C10: Bootstrap CI
# ---------------------------------------------------------------------------

class TestBootstrapCI:
    def test_bootstrap_returns_valid_interval(self):
        rng = np.random.default_rng(42)
        values = rng.normal(loc=20, scale=5, size=100).tolist()

        def mean_func(vals):
            return sum(vals) / len(vals) if vals else 0

        lo, hi = _bootstrap_ci(values, mean_func, n_boot=200)
        assert lo <= hi
        # The true mean (20) should be within the CI
        assert lo < 22
        assert hi > 18

    def test_bootstrap_small_sample(self):
        values = [1.0, 2.0, 3.0]

        def mean_func(vals):
            return sum(vals) / len(vals)

        lo, hi = _bootstrap_ci(values, mean_func)
        assert lo == hi  # degenerate case

    def test_gev_return_levels_have_ci(self):
        rng = np.random.default_rng(42)
        values = rng.gumbel(loc=20, scale=5, size=200).tolist()
        result = _gev_analysis(values, 25.0)
        # Non-lowConfidence return levels should have CI
        for rl in result["returnLevels"]:
            if not rl.get("lowConfidence"):
                assert "ci" in rl
                assert len(rl["ci"]) == 2
                assert rl["ci"][0] <= rl["ci"][1]


# ---------------------------------------------------------------------------
# C11: EWMA control charts
# ---------------------------------------------------------------------------

class TestEWMAControlCharts:
    def test_control_limits_present(self):
        values = [20 + 0.5 * i for i in range(50)]
        result = _ema_analysis(values)
        assert "controlLimits" in result
        cl = result["controlLimits"]
        assert "ucl" in cl
        assert "lcl" in cl
        assert "sigma" in cl
        assert cl["ucl"] > cl["lcl"]

    def test_out_of_control_flag(self):
        result = _ema_analysis([20.0] * 50)
        assert "outOfControl" in result
        assert isinstance(result["outOfControl"], bool)

    def test_empty_values(self):
        result = _ema_analysis([])
        assert result["controlLimits"]["ucl"] == 0
        assert result["controlLimits"]["lcl"] == 0
        assert result["outOfControl"] is False

    def test_stable_series_not_out_of_control(self):
        rng = np.random.default_rng(42)
        values = rng.normal(loc=20, scale=0.1, size=100).tolist()
        result = _ema_analysis(values)
        # A very stable series should not be out of control
        assert result["outOfControl"] is False
