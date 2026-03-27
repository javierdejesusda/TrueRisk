"""Stress tests for the 52 provinces x 8 hazards matrix."""
import math
import pytest
from app.data.province_data import PROVINCES
from app.services.risk_service import (
    get_terrain_features,
    get_hazard_weights,
    compute_temporal_features,
)
from app.ml.models.composite_risk import compute_composite_risk
from app.ml.models.flood_risk import predict_flood_risk
from app.ml.models.wildfire_risk import predict_wildfire_risk
from app.ml.models.drought_risk import predict_drought_risk
from app.ml.models.heatwave_risk import predict_heatwave_risk
from app.ml.models.seismic_risk import predict_seismic_risk
from app.ml.models.coldwave_risk import predict_coldwave_risk
from app.ml.models.windstorm_risk import predict_windstorm_risk
from app.ml.models.dana_risk import predict_dana_risk


ALL_PROVINCE_CODES = sorted(PROVINCES.keys())
HAZARD_MODELS = {
    "flood": predict_flood_risk,
    "wildfire": predict_wildfire_risk,
    "drought": predict_drought_risk,
    "heatwave": predict_heatwave_risk,
    "seismic": predict_seismic_risk,
    "coldwave": predict_coldwave_risk,
    "windstorm": predict_windstorm_risk,
    "dana": predict_dana_risk,
}


class TestProvinceSeedData:
    """Verify all 52 provinces have complete, valid seed data."""

    def test_exactly_52_provinces(self):
        assert len(PROVINCES) == 52

    @pytest.mark.parametrize("code", ALL_PROVINCE_CODES)
    def test_province_has_required_fields(self, code):
        data = PROVINCES[code]
        assert "name" in data, f"Province {code} missing name"
        assert "latitude" in data, f"Province {code} missing latitude"
        assert "longitude" in data, f"Province {code} missing longitude"
        assert "elevation_m" in data, f"Province {code} missing elevation_m"

    @pytest.mark.parametrize("code", ALL_PROVINCE_CODES)
    def test_province_coordinates_in_spain(self, code):
        data = PROVINCES[code]
        lat = data["latitude"]
        lon = data["longitude"]
        assert 27.0 <= lat <= 44.0, f"Province {code} latitude {lat} out of bounds"
        assert -19.0 <= lon <= 5.0, f"Province {code} longitude {lon} out of bounds"

    @pytest.mark.parametrize("code", ALL_PROVINCE_CODES)
    def test_province_has_7_hazard_weights(self, code):
        data = PROVINCES[code]
        weight_keys = [
            "flood_risk_weight", "wildfire_risk_weight", "drought_risk_weight",
            "heatwave_risk_weight", "seismic_risk_weight", "coldwave_risk_weight",
            "windstorm_risk_weight",
        ]
        for key in weight_keys:
            assert key in data, f"Province {code} missing {key}"
            v = data[key]
            assert 0.0 <= v <= 1.0, f"Province {code} {key}={v} out of [0,1]"


class TestHazardWeightsConsistency:
    @pytest.mark.parametrize("code", ALL_PROVINCE_CODES)
    def test_weights_all_valid(self, code):
        w = get_hazard_weights(code)
        assert len(w) == 8
        for hazard, val in w.items():
            assert isinstance(val, float), f"{code}.{hazard} not float"
            assert 0.0 <= val <= 1.0, f"{code}.{hazard}={val} out of range"


class TestTerrainFeaturesConsistency:
    @pytest.mark.parametrize("code", ALL_PROVINCE_CODES)
    def test_terrain_valid(self, code):
        t = get_terrain_features(code)
        assert isinstance(t["elevation_m"], (int, float))
        assert t["elevation_m"] >= 0
        assert t["is_coastal"] in (0.0, 1.0)
        assert t["is_mediterranean"] in (0.0, 1.0)
        assert 0.0 <= t["river_basin_risk"] <= 1.0
        assert 27.0 <= t["latitude"] <= 44.0


class TestAllModelsWithZeroFeatures:
    @pytest.mark.parametrize("model_name,predict_fn", list(HAZARD_MODELS.items()))
    def test_model_zero_input(self, model_name, predict_fn):
        score = predict_fn({})
        assert isinstance(score, (int, float)), f"{model_name} returned non-numeric"
        assert not math.isnan(score), f"{model_name} returned NaN on empty input"
        assert 0 <= score <= 100, f"{model_name} score {score} out of [0, 100]"


class TestAllModelsWithExtremeFeatures:
    EXTREME_FEATURES = {
        "temperature": 50.0, "temperature_max": 50.0, "temperature_min": 35.0,
        "humidity": 100.0, "precipitation": 300.0,
        "precip_1h": 100.0, "precip_6h": 200.0, "precip_24h": 500.0,
        "precip_48h": 800.0, "precip_7d": 2000.0,
        "wind_speed": 200.0, "wind_gusts": 300.0,
        "pressure": 950.0, "pressure_change_6h": -20.0, "pressure_change_24h": -40.0,
        "soil_moisture": 1.0, "heat_index": 65.0, "wbgt": 40.0, "wind_chill": -30.0,
        "fwi": 100.0, "spei_1m": -3.0, "spei_3m": -3.0, "spei_6m": -3.0,
        "consecutive_rain_days": 30, "consecutive_dry_days": 90,
        "consecutive_hot_days": 30, "consecutive_cold_days": 30,
        "is_coastal": 1.0, "is_mediterranean": 1.0,
        "elevation_m": 3000.0, "latitude": 36.0, "river_basin_risk": 1.0,
        "magnitude": 6.5, "magnitude_max_30d": 6.5, "depth_km": 5.0,
        "distance_km": 10.0, "quake_count_30d": 50, "seismic_zone_weight": 1.0,
        "cape": 4000.0, "month": 10, "season_sin": 0.0, "season_cos": -1.0,
    }

    @pytest.mark.parametrize("model_name,predict_fn", list(HAZARD_MODELS.items()))
    def test_model_extreme_input(self, model_name, predict_fn):
        score = predict_fn(self.EXTREME_FEATURES)
        assert isinstance(score, (int, float)), f"{model_name} returned non-numeric"
        assert not math.isnan(score), f"{model_name} returned NaN"
        assert 0 <= score <= 100, f"{model_name} score {score} out of [0, 100]"


class TestCompositeWithRealWeights:
    MOCK_RAW_SCORES = {
        "low": {"flood": 10, "wildfire": 10, "drought": 10, "heatwave": 10,
                "seismic": 10, "coldwave": 10, "windstorm": 10, "dana": 10},
        "moderate": {"flood": 40, "wildfire": 35, "drought": 45, "heatwave": 50,
                     "seismic": 20, "coldwave": 30, "windstorm": 25, "dana": 15},
        "extreme": {"flood": 90, "wildfire": 85, "drought": 80, "heatwave": 95,
                    "seismic": 60, "coldwave": 70, "windstorm": 75, "dana": 88},
    }

    @pytest.mark.parametrize("code", ALL_PROVINCE_CODES)
    @pytest.mark.parametrize("scenario", ["low", "moderate", "extreme"])
    def test_composite_valid_for_province(self, code, scenario):
        weights = get_hazard_weights(code)
        raw = self.MOCK_RAW_SCORES[scenario]
        weighted = {}
        for hazard, raw_score in raw.items():
            w = weights.get(hazard, 0.5)
            weighted[hazard] = min(100.0, raw_score * (0.4 + 0.6 * w))
        result = compute_composite_risk(**weighted)
        assert 0 <= result["composite_score"] <= 100, (
            f"Province {code}, scenario {scenario}: composite={result['composite_score']}"
        )
        assert result["severity"] in ("low", "moderate", "high", "very_high", "critical")
        assert result["dominant_hazard"] in weighted


class TestTemporalFeaturesEdgeCases:
    def test_empty_history(self):
        result = compute_temporal_features([])
        assert isinstance(result, dict)

    def test_single_record(self):
        record = {
            "temperature": 25.0, "humidity": 60.0, "precipitation": 5.0,
            "wind_speed": 10.0, "pressure": 1013.0, "soil_moisture": 0.5,
            "recorded_at": "2026-01-01T12:00:00",
        }
        result = compute_temporal_features([record])
        assert isinstance(result, dict)

    def test_all_none_values(self):
        record = {
            "temperature": None, "humidity": None, "precipitation": None,
            "wind_speed": None, "pressure": None, "soil_moisture": None,
            "recorded_at": "2026-01-01T12:00:00",
        }
        result = compute_temporal_features([record] * 24)
        assert isinstance(result, dict)


class TestWeightScalingFormula:
    def test_weight_zero_gives_40_percent(self):
        assert min(100.0, 100.0 * (0.4 + 0.6 * 0.0)) == 40.0

    def test_weight_one_gives_100_percent(self):
        assert min(100.0, 100.0 * (0.4 + 0.6 * 1.0)) == 100.0

    def test_weight_half_gives_70_percent(self):
        assert min(100.0, 100.0 * (0.4 + 0.6 * 0.5)) == 70.0

    @pytest.mark.parametrize("code", ALL_PROVINCE_CODES)
    def test_weighted_score_always_bounded(self, code):
        weights = get_hazard_weights(code)
        for hazard, w in weights.items():
            for raw in (0.0, 50.0, 100.0):
                result = min(100.0, raw * (0.4 + 0.6 * w))
                assert 0.0 <= result <= 100.0, f"{code}.{hazard}: raw={raw}, w={w}"
