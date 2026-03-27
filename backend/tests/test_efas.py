"""Tests for Copernicus EFAS flood forecast integration."""
import pytest
import respx
from httpx import Response
from app.data.copernicus_efas import fetch_efas_flood_indicators, _PROVINCE_CENTROIDS
import app.data.copernicus_efas as efas_mod


@pytest.fixture(autouse=True)
def clear_efas_cache():
    efas_mod._cache.clear()
    efas_mod._cache_ts = 0.0
    yield


@pytest.fixture(autouse=True)
def no_retry_wait(monkeypatch):
    monkeypatch.setattr("tenacity.nap.time.sleep", lambda x: None)


def test_province_centroids_complete():
    assert len(_PROVINCE_CENTROIDS) == 52


@respx.mock
async def test_efas_returns_empty_on_error():
    import httpx
    respx.get("https://flood-api.open-meteo.com/v1/flood").mock(
        side_effect=httpx.ConnectError("Network error")
    )
    result = await fetch_efas_flood_indicators()
    assert result == {}


@respx.mock
async def test_efas_parses_discharge_data():
    mock_data = [
        {"daily": {"river_discharge": [100.0, 150.0, 120.0, 200.0, 130.0, 110.0, 140.0]}}
    ] * 52

    respx.get("https://flood-api.open-meteo.com/v1/flood").mock(
        return_value=Response(200, json=mock_data[:50])
    )

    result = await fetch_efas_flood_indicators()
    assert len(result) > 0
    first = list(result.values())[0]
    assert "flood_recurrence" in first
    assert "discharge_anomaly" in first
    assert 0 <= first["flood_recurrence"] <= 1.0
