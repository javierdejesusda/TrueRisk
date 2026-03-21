"""Tests for per-hazard TFT inference modules."""
import pytest


class TestFloodTFT:
    def test_returns_none_without_checkpoint(self):
        from app.ml.models.tft_flood import predict_flood_risk_tft
        result = predict_flood_risk_tft([], {})
        assert result is None

    def test_feature_split(self):
        from app.ml.models.tft_flood import STATIC_FEATURES, TIME_VARYING_KNOWN, TIME_VARYING_UNKNOWN
        assert "elevation_m" in STATIC_FEATURES
        assert "month" in TIME_VARYING_KNOWN
        assert "precip_1h" in TIME_VARYING_UNKNOWN
        # No overlap
        all_feats = set(STATIC_FEATURES + TIME_VARYING_KNOWN + TIME_VARYING_UNKNOWN)
        assert len(all_feats) == len(STATIC_FEATURES) + len(TIME_VARYING_KNOWN) + len(TIME_VARYING_UNKNOWN)


class TestWildfireTFT:
    def test_returns_none_without_checkpoint(self):
        from app.ml.models.tft_wildfire import predict_wildfire_risk_tft
        result = predict_wildfire_risk_tft([], {})
        assert result is None

    def test_feature_split(self):
        from app.ml.models.tft_wildfire import STATIC_FEATURES, TIME_VARYING_UNKNOWN
        assert "elevation_m" in STATIC_FEATURES
        assert "fwi" in TIME_VARYING_UNKNOWN


class TestHeatwaveTFT:
    def test_returns_none_without_checkpoint(self):
        from app.ml.models.tft_heatwave import predict_heatwave_risk_tft
        result = predict_heatwave_risk_tft([], {})
        assert result is None

    def test_feature_split(self):
        from app.ml.models.tft_heatwave import STATIC_FEATURES, TIME_VARYING_UNKNOWN
        assert "latitude" in STATIC_FEATURES
        assert "temperature" in TIME_VARYING_UNKNOWN


class TestDroughtTFT:
    def test_returns_none_without_checkpoint(self):
        from app.ml.models.tft_drought import predict_drought_risk_tft
        result = predict_drought_risk_tft([], {})
        assert result is None

    def test_feature_split(self):
        from app.ml.models.tft_drought import STATIC_FEATURES, TIME_VARYING_UNKNOWN
        assert len(STATIC_FEATURES) == 0
        assert "temperature" in TIME_VARYING_UNKNOWN
        assert "spei_3m" in TIME_VARYING_UNKNOWN
