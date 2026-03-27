"""Tests for ensemble weather model feature extraction."""
import pytest
import respx
from httpx import Response

from app.data.open_meteo import fetch_ensemble_features


@pytest.fixture(autouse=True)
def no_retry_wait(monkeypatch):
    monkeypatch.setattr("tenacity.nap.time.sleep", lambda x: None)


@respx.mock
async def test_ensemble_returns_defaults_on_error():
    import httpx
    respx.get("https://ensemble-api.open-meteo.com/v1/ensemble").mock(
        side_effect=httpx.ConnectError("Connection failed")
    )
    result = await fetch_ensemble_features(40.4, -3.7)
    assert result["precip_prob_50mm_72h"] == 0.0
    assert result["forecast_uncertainty"] == 0.0


@respx.mock
async def test_ensemble_parses_precipitation():
    mock_data = {
        "hourly": {
            "precipitation": [1.0] * 72,
            "temperature_2m": [20.0] * 72,
        }
    }
    respx.get("https://ensemble-api.open-meteo.com/v1/ensemble").mock(
        return_value=Response(200, json=mock_data)
    )
    result = await fetch_ensemble_features(40.4, -3.7)
    assert result["precip_prob_50mm_72h"] > 0
    assert result["precip_est_72h_mm"] > 0
    assert result["forecast_uncertainty"] == 0.0
