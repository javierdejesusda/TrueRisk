"""Tests for the ECMWF seasonal forecast data source module."""

import pytest
import respx
from httpx import Response

from app.data import ecmwf_seasonal

_ECMWF_URL = "https://cds.climate.copernicus.eu/api/resources/seasonal-monthly-single-levels"


@pytest.fixture(autouse=True)
def clear_cache():
    """Reset module-level caches before each test."""
    ecmwf_seasonal._cache.clear()
    ecmwf_seasonal._cache_ts.clear()
    yield
    ecmwf_seasonal._cache.clear()
    ecmwf_seasonal._cache_ts.clear()


@pytest.fixture(autouse=True)
def no_retry_wait(monkeypatch):
    """Make tenacity retries instant in tests."""
    monkeypatch.setattr("tenacity.nap.time.sleep", lambda x: None)


@pytest.fixture(autouse=True)
def fake_cdsapi_key(monkeypatch):
    """Provide a fake CDS API key so the guard is satisfied."""
    monkeypatch.setattr("app.data.ecmwf_seasonal.settings.cdsapi_key", "test-key")
    monkeypatch.setattr(
        "app.data.ecmwf_seasonal.settings.cdsapi_url",
        "https://cds.climate.copernicus.eu/api",
    )


def _make_seasonal_response():
    return {
        "temperature_anomaly": 1.2,
        "precipitation_anomaly": -5.0,
    }


@respx.mock
async def test_happy_path():
    respx.get(_ECMWF_URL).mock(
        return_value=Response(200, json=_make_seasonal_response())
    )
    result = await ecmwf_seasonal.fetch_seasonal_outlook(39.5, -0.4)
    assert result["temp_anomaly_c"] == 1.2
    assert result["precip_anomaly_pct"] == -5.0
    assert result["forecast_months"] == 3


async def test_no_api_key(monkeypatch):
    monkeypatch.setattr("app.data.ecmwf_seasonal.settings.cdsapi_key", "")
    result = await ecmwf_seasonal.fetch_seasonal_outlook(39.5, -0.4)
    assert result == {}


@respx.mock
async def test_http_error():
    respx.get(_ECMWF_URL).mock(
        return_value=Response(503, text="Service Unavailable")
    )
    result = await ecmwf_seasonal.fetch_seasonal_outlook(39.5, -0.4)
    assert result == {}


@respx.mock
async def test_cache_hit():
    route = respx.get(_ECMWF_URL)
    route.mock(return_value=Response(200, json=_make_seasonal_response()))

    first = await ecmwf_seasonal.fetch_seasonal_outlook(39.5, -0.4)
    second = await ecmwf_seasonal.fetch_seasonal_outlook(39.5, -0.4)
    assert first == second
    assert route.call_count == 1
