"""Tests for Copernicus EFAS data source module."""

import pytest
import respx
from httpx import Response

from app.data import copernicus_efas


def _make_flood_item(discharges):
    """Build a single-location GloFAS response item."""
    return {"daily": {"river_discharge": discharges}}


def _make_batch_response(count, discharges=None):
    """Build a multi-location GloFAS response list."""
    if discharges is None:
        discharges = [100.0, 150.0, 120.0, 180.0, 110.0, 130.0, 160.0]
    return [_make_flood_item(discharges) for _ in range(count)]


@pytest.fixture(autouse=True)
def clear_cache():
    copernicus_efas._cache.clear()
    copernicus_efas._cache_ts = 0.0
    yield
    copernicus_efas._cache.clear()
    copernicus_efas._cache_ts = 0.0


@pytest.fixture(autouse=True)
def no_retry_wait(monkeypatch):
    monkeypatch.setattr("tenacity.nap.time.sleep", lambda x: None)


@respx.mock
async def test_happy_path():
    """Flood indicators are fetched and computed for provinces."""
    province_count = len(copernicus_efas._PROVINCE_CENTROIDS)
    payload = _make_batch_response(province_count)
    respx.get("https://flood-api.open-meteo.com/v1/flood").mock(
        return_value=Response(200, json=payload)
    )
    result = await copernicus_efas.fetch_efas_flood_indicators()
    assert len(result) == province_count
    sample = result["28"]  # Madrid
    assert "flood_recurrence" in sample
    assert "discharge_anomaly" in sample
    assert "max_discharge_m3s" in sample
    assert sample["max_discharge_m3s"] == 180.0


@respx.mock
async def test_http_error_returns_empty():
    """HTTP error from API results in empty dict."""
    respx.get("https://flood-api.open-meteo.com/v1/flood").mock(
        return_value=Response(500, text="error")
    )
    result = await copernicus_efas.fetch_efas_flood_indicators()
    assert result == {}


@respx.mock
async def test_cache_hit():
    """Second call returns cached data without HTTP requests."""
    province_count = len(copernicus_efas._PROVINCE_CENTROIDS)
    payload = _make_batch_response(province_count)
    respx.get("https://flood-api.open-meteo.com/v1/flood").mock(
        return_value=Response(200, json=payload)
    )
    first = await copernicus_efas.fetch_efas_flood_indicators()
    assert len(first) == province_count

    respx.reset()

    second = await copernicus_efas.fetch_efas_flood_indicators()
    assert second == first


@respx.mock
async def test_zero_discharge():
    """Zero/null discharges produce zero flood indicators."""
    province_count = len(copernicus_efas._PROVINCE_CENTROIDS)
    payload = [_make_flood_item([0.0, 0.0, None, 0.0]) for _ in range(province_count)]
    respx.get("https://flood-api.open-meteo.com/v1/flood").mock(
        return_value=Response(200, json=payload)
    )
    result = await copernicus_efas.fetch_efas_flood_indicators()
    assert len(result) == province_count
    for code, indicators in result.items():
        assert indicators["flood_recurrence"] == 0.0
        assert indicators["discharge_anomaly"] == 0.0
        assert indicators["max_discharge_m3s"] == 0.0
