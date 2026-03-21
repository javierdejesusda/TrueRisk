"""Tests for HazardTFT base wrapper."""
import pytest
from app.ml.models.tft_base import HazardTFT, FORECAST_HORIZONS


class TestHazardTFT:
    def test_init(self):
        tft = HazardTFT("flood")
        assert tft.hazard == "flood"
        assert tft.model_path.name == "flood_tft.ckpt"

    def test_is_available_false_when_no_checkpoint(self):
        tft = HazardTFT("nonexistent_hazard")
        assert tft.is_available is False

    def test_predict_returns_none_when_unavailable(self):
        tft = HazardTFT("nonexistent_hazard")
        result = tft.predict({"temp": [1.0, 2.0]}, {"elevation_m": 500.0})
        assert result is None

    def test_forecast_horizons(self):
        assert FORECAST_HORIZONS == [6, 12, 24, 48, 72, 168]
