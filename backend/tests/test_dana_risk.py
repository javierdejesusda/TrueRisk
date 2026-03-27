"""Tests for the DANA compound event detection model."""


from app.ml.models.dana_risk import predict_dana_risk


def test_dana_conditions_detected():
    """Classic DANA setup: Mediterranean, autumn, extreme precip, warm SST."""
    features = {
        "is_mediterranean": True,
        "month": 10,
        "precip_24h": 150.0,
        "precip_6h": 80.0,
        "temperature": 22.0,
        "pressure_change_6h": -8.0,
        "wind_gusts": 90.0,
        "humidity": 85.0,
        "is_coastal": True,
        "latitude": 39.0,
    }
    score = predict_dana_risk(features)
    assert score > 60


def test_no_dana_inland_summer():
    """Inland province in summer -- DANA extremely unlikely."""
    features = {
        "is_mediterranean": False,
        "month": 7,
        "precip_24h": 5.0,
        "precip_6h": 2.0,
        "temperature": 35.0,
        "pressure_change_6h": -1.0,
        "wind_gusts": 15.0,
        "humidity": 30.0,
        "is_coastal": False,
        "latitude": 41.0,
    }
    score = predict_dana_risk(features)
    assert score < 15


def test_dana_moderate_some_signals():
    """Mediterranean with heavy rain but no other signals -- moderate risk."""
    features = {
        "is_mediterranean": True,
        "month": 10,
        "precip_24h": 80.0,
        "precip_6h": 40.0,
        "temperature": 18.0,
        "pressure_change_6h": -2.0,
        "wind_gusts": 30.0,
        "humidity": 60.0,
        "is_coastal": True,
        "latitude": 39.0,
    }
    score = predict_dana_risk(features)
    # Some signals but not compound -- should be moderate
    assert 20 <= score <= 50


def test_dana_compound_amplification():
    """Multiple simultaneous signals should produce exponential risk increase."""
    # Only heavy rain
    rain_only = {
        "is_mediterranean": True,
        "month": 10,
        "precip_24h": 120.0,
        "precip_6h": 60.0,
        "temperature": 15.0,
        "pressure_change_6h": -1.0,
        "wind_gusts": 20.0,
        "humidity": 50.0,
        "is_coastal": True,
        "latitude": 39.0,
    }
    # Rain + pressure drop + wind + humidity (compound)
    compound = {
        **rain_only,
        "pressure_change_6h": -10.0,
        "wind_gusts": 100.0,
        "humidity": 90.0,
    }
    rain_score = predict_dana_risk(rain_only)
    compound_score = predict_dana_risk(compound)
    # Compound should be significantly higher -- at least 20 points more
    assert compound_score - rain_score >= 20


def test_dana_off_season_damping():
    """Even with DANA signals, summer months should be strongly damped."""
    features = {
        "is_mediterranean": True,
        "month": 7,
        "precip_24h": 150.0,
        "precip_6h": 80.0,
        "temperature": 22.0,
        "pressure_change_6h": -8.0,
        "wind_gusts": 90.0,
        "humidity": 85.0,
        "is_coastal": True,
        "latitude": 39.0,
    }
    score = predict_dana_risk(features)
    assert score < 30


def test_dana_returns_bounded_score():
    """Score should always be between 0 and 100."""
    # Extreme features
    extreme = {
        "is_mediterranean": True,
        "month": 10,
        "precip_24h": 500.0,
        "precip_6h": 300.0,
        "temperature": 25.0,
        "pressure_change_6h": -20.0,
        "wind_gusts": 200.0,
        "humidity": 100.0,
        "is_coastal": True,
        "latitude": 39.0,
    }
    score = predict_dana_risk(extreme)
    assert 0 <= score <= 100

    # Zero features
    zero = {
        "is_mediterranean": False,
        "month": 1,
        "precip_24h": 0.0,
        "precip_6h": 0.0,
        "temperature": 5.0,
        "pressure_change_6h": 0.0,
        "wind_gusts": 0.0,
        "humidity": 30.0,
        "is_coastal": False,
        "latitude": 42.0,
    }
    score = predict_dana_risk(zero)
    assert 0 <= score <= 100
