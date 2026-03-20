"""Unit tests for temporal feature computation helpers."""

from app.services.risk_service import compute_temporal_features, _safe


def test_safe_none():
    assert _safe(None) == 0.0
    assert _safe(None, 5.0) == 5.0


def test_safe_valid():
    assert _safe(42.5) == 42.5
    assert _safe("3.14") == 3.14


def test_safe_invalid():
    assert _safe("abc") == 0.0
    assert _safe("abc", -1.0) == -1.0


def test_empty_history():
    result = compute_temporal_features([])
    assert result["precip_1h"] == 0.0
    assert result["precip_24h"] == 0.0
    assert result["consecutive_dry_days"] == 0
    assert result["consecutive_rain_days"] == 0


def test_single_record():
    record = {
        "precipitation": 5.0,
        "temperature": 25.0,
        "humidity": 60.0,
        "soil_moisture": 0.4,
        "pressure": 1010.0,
        "wind_speed": 10.0,
        "wind_gusts": 20.0,
        "dew_point": 15.0,
    }
    result = compute_temporal_features([record])
    assert result["precip_1h"] == 5.0
    assert result["precip_6h"] == 5.0
    assert result["precip_24h"] == 5.0


def test_rain_accumulation():
    # 24 hours of 2mm/hour rainfall
    records = [{"precipitation": 2.0, "temperature": 15, "humidity": 80, "soil_moisture": 0.5, "pressure": 1010} for _ in range(24)]
    result = compute_temporal_features(records)
    assert result["precip_24h"] == 48.0
    assert result["precip_6h"] == 12.0
    assert result["precip_1h"] == 2.0


def test_consecutive_dry_days():
    # 48 hours of zero rain = 2 dry days
    records = [{"precipitation": 0.0, "temperature": 30, "humidity": 30, "soil_moisture": 0.2, "pressure": 1015} for _ in range(48)]
    result = compute_temporal_features(records)
    assert result["consecutive_dry_days"] == 2
    assert result["consecutive_rain_days"] == 0


def test_pressure_change():
    records = [
        {"precipitation": 0, "temperature": 20, "humidity": 50, "soil_moisture": 0.3, "pressure": 1005},
        {"precipitation": 0, "temperature": 20, "humidity": 50, "soil_moisture": 0.3, "pressure": 1006},
        {"precipitation": 0, "temperature": 20, "humidity": 50, "soil_moisture": 0.3, "pressure": 1007},
        {"precipitation": 0, "temperature": 20, "humidity": 50, "soil_moisture": 0.3, "pressure": 1008},
        {"precipitation": 0, "temperature": 20, "humidity": 50, "soil_moisture": 0.3, "pressure": 1009},
        {"precipitation": 0, "temperature": 20, "humidity": 50, "soil_moisture": 0.3, "pressure": 1015},
    ]
    result = compute_temporal_features(records)
    assert result["pressure_change_6h"] == 1005 - 1015  # -10
