"""Unit tests for risk_service helper functions."""
import math
from app.services.risk_service import (
    _safe,
    get_terrain_features,
    get_hazard_weights,
    _compute_confidence,
    _season_components,
)


class TestSafe:
    def test_none_returns_default(self):
        assert _safe(None) == 0.0

    def test_none_with_custom_default(self):
        assert _safe(None, 5.0) == 5.0

    def test_valid_float(self):
        assert _safe(42.5) == 42.5

    def test_valid_int(self):
        assert _safe(7) == 7.0

    def test_valid_string_float(self):
        assert _safe("3.14") == 3.14

    def test_invalid_string(self):
        assert _safe("abc") == 0.0

    def test_invalid_string_custom_default(self):
        assert _safe("abc", -1.0) == -1.0

    def test_empty_string(self):
        assert _safe("") == 0.0

    def test_bool_true(self):
        assert _safe(True) == 1.0

    def test_bool_false(self):
        assert _safe(False) == 0.0

    def test_nan_returns_nan(self):
        result = _safe(float("nan"))
        assert math.isnan(result)

    def test_inf_returns_inf(self):
        result = _safe(float("inf"))
        assert math.isinf(result)

    def test_list_returns_default(self):
        assert _safe([1, 2, 3]) == 0.0

    def test_dict_returns_default(self):
        assert _safe({"a": 1}) == 0.0


class TestTerrainFeatures:
    def test_known_province_madrid(self):
        t = get_terrain_features("28")
        assert "elevation_m" in t
        assert "is_coastal" in t
        assert "is_mediterranean" in t
        assert "river_basin_risk" in t
        assert "latitude" in t
        assert isinstance(t["elevation_m"], (int, float))

    def test_unknown_province_returns_defaults(self):
        t = get_terrain_features("XX")
        assert t["elevation_m"] == 200.0
        assert t["is_coastal"] == 0.0
        assert t["is_mediterranean"] == 0.0
        assert t["river_basin_risk"] == 0.3
        assert t["latitude"] == 40.0


class TestHazardWeights:
    def test_known_province_has_all_8_weights(self):
        w = get_hazard_weights("28")
        expected_keys = {"flood", "wildfire", "drought", "heatwave", "seismic", "coldwave", "windstorm", "dana"}
        assert set(w.keys()) == expected_keys

    def test_all_weights_in_range(self):
        w = get_hazard_weights("28")
        for k, v in w.items():
            assert 0.0 <= v <= 1.0, f"{k} weight out of range: {v}"

    def test_unknown_province_returns_defaults(self):
        w = get_hazard_weights("XX")
        assert w["flood"] == 0.5
        assert w["dana"] == 0.4


class TestConfidence:
    def test_fresh_data_many_sources(self):
        c = _compute_confidence(0.0, 5)
        assert c >= 0.9

    def test_stale_data_few_sources(self):
        c = _compute_confidence(24.0, 0)
        assert c == 0.0

    def test_moderate_freshness(self):
        c = _compute_confidence(6.0, 2)
        assert 0.0 < c < 1.0

    def test_exactly_12h_old(self):
        c = _compute_confidence(12.0, 3)
        expected = round(0.0 * 0.6 + 1.0 * 0.4, 2)
        assert c == expected

    def test_negative_age_clamped(self):
        c = _compute_confidence(-1.0, 3)
        assert c >= 0.0


class TestSeasonComponents:
    def test_january(self):
        sin_v, cos_v = _season_components(1)
        assert sin_v == 0.0
        assert cos_v == 1.0

    def test_july_opposite(self):
        sin_v, cos_v = _season_components(7)
        assert cos_v == -1.0

    def test_all_months_unit_circle(self):
        for m in range(1, 13):
            sin_v, cos_v = _season_components(m)
            magnitude = (sin_v ** 2 + cos_v ** 2) ** 0.5
            assert abs(magnitude - 1.0) < 0.001, f"Month {m} not on unit circle"
