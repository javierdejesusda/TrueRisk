"""Tests for ML-based DANA detection."""
import pytest
from unittest.mock import patch, MagicMock

from app.ml.models.dana_risk import predict_dana_risk, FEATURE_NAMES


def test_predict_returns_rule_based_when_no_model():
    features = {
        "is_mediterranean": True, "is_coastal": True, "month": 10,
        "latitude": 39.0, "precip_24h": 80, "precip_6h": 50,
        "temperature": 22, "pressure_change_6h": -8,
        "wind_gusts": 80, "humidity": 90, "cape_current": 0,
        "precip_forecast_6h": 50,
    }
    score = predict_dana_risk(features)
    assert 0 <= score <= 100
    assert score > 50  # Mediterranean, high precip, strong signals


def test_predict_low_risk_for_calm_weather():
    features = {
        "is_mediterranean": False, "is_coastal": False, "month": 7,
        "latitude": 42.0, "precip_24h": 0, "precip_6h": 0,
        "temperature": 25, "pressure_change_6h": 0,
        "wind_gusts": 10, "humidity": 40, "cape_current": 0,
        "precip_forecast_6h": 0,
    }
    score = predict_dana_risk(features)
    assert score < 30


def test_all_feature_names_present():
    assert len(FEATURE_NAMES) == 12
    assert "precip_24h" in FEATURE_NAMES
    assert "is_mediterranean" in FEATURE_NAMES


def test_predict_handles_missing_features():
    features = {}  # All missing
    score = predict_dana_risk(features)
    assert 0 <= score <= 100


def test_predict_with_mock_model():
    """Test ensemble behavior when ML model is available."""
    import numpy as np
    mock_model = MagicMock()
    mock_model.predict_proba.return_value = np.array([[0.2, 0.8]])

    with patch("app.ml.models.dana_risk._load_dana_model", return_value=mock_model):
        features = {
            "is_mediterranean": True, "is_coastal": True, "month": 10,
            "precip_24h": 80, "precip_6h": 50, "temperature": 22,
            "pressure_change_6h": -8, "wind_gusts": 80, "humidity": 90,
            "latitude": 39.0, "cape_current": 0, "precip_forecast_6h": 50,
        }
        score = predict_dana_risk(features)
        # Should be 0.6 * (0.8*100) + 0.4 * rule_score
        assert score > 40  # ML says 80%, ensemble should be high
