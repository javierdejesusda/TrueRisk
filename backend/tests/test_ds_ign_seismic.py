"""Tests for IGN seismic data source module."""

import pytest
import respx
from httpx import Response

from app.data import ign_seismic

_QUAKES_RESPONSE = [
    {
        "mag": 3.2,
        "prof": 12.0,
        "lat": 37.5,
        "lon": -3.8,
        "fecha": "2024-01-15T10:30:00+00:00",
    },
    {
        "mag": 2.1,
        "prof": 5.0,
        "lat": 38.0,
        "lon": -1.5,
        "fecha": "2024-01-14T08:00:00+00:00",
    },
]

_QUAKES_ALT_KEYS = [
    {
        "magnitude": 4.0,
        "depth": 20.0,
        "latitude": 36.7,
        "longitude": -4.4,
        "time": "2024-01-10T12:00:00+00:00",
    },
]


@pytest.fixture(autouse=True)
def clear_cache():
    ign_seismic._CACHE.clear()
    yield
    ign_seismic._CACHE.clear()


@pytest.fixture(autouse=True)
def no_retry_wait(monkeypatch):
    monkeypatch.setattr("tenacity.nap.time.sleep", lambda x: None)


@respx.mock
async def test_happy_path():
    """Quakes are fetched and parsed correctly."""
    respx.get(ign_seismic.IGN_URL).mock(
        return_value=Response(200, json=_QUAKES_RESPONSE)
    )
    result = await ign_seismic.fetch_recent_quakes(days=90)
    assert len(result) == 2
    assert result[0]["magnitude"] == 3.2
    assert result[0]["depth_km"] == 12.0
    assert result[1]["lat"] == 38.0


@respx.mock
async def test_alternative_keys():
    """Alternative key names (magnitude/depth vs mag/prof) are handled."""
    respx.get(ign_seismic.IGN_URL).mock(
        return_value=Response(200, json=_QUAKES_ALT_KEYS)
    )
    result = await ign_seismic.fetch_recent_quakes(days=90)
    assert len(result) == 1
    assert result[0]["magnitude"] == 4.0
    assert result[0]["depth_km"] == 20.0
    assert result[0]["lat"] == 36.7


@respx.mock
async def test_error_returns_empty():
    """HTTP errors result in an empty list, not an exception."""
    respx.get(ign_seismic.IGN_URL).mock(
        return_value=Response(500, text="internal error")
    )
    result = await ign_seismic.fetch_recent_quakes(days=90)
    assert result == []


@respx.mock
async def test_cache_hit():
    """Second call returns cached data without HTTP requests."""
    respx.get(ign_seismic.IGN_URL).mock(
        return_value=Response(200, json=_QUAKES_RESPONSE)
    )
    first = await ign_seismic.fetch_recent_quakes(days=90)
    assert len(first) == 2

    respx.reset()

    second = await ign_seismic.fetch_recent_quakes(days=90)
    assert second == first


def test_compute_exposure_with_quakes():
    """Province seismic exposure is computed for nearby quakes."""
    from datetime import datetime, timedelta, timezone

    recent = (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
    quakes = [
        {
            "magnitude": 3.5,
            "depth_km": 10.0,
            "lat": 37.5,
            "lon": -3.8,
            "timestamp": recent,
        },
    ]
    exposure = ign_seismic.compute_province_seismic_exposure(
        province_lat=37.6, province_lon=-3.7, quakes=quakes, radius_km=200.0
    )
    assert exposure["max_magnitude_90d"] == 3.5
    assert exposure["nearest_quake_magnitude"] == 3.5
    assert exposure["nearest_quake_distance_km"] < 200.0
    assert exposure["cumulative_energy_30d"] > 0


def test_compute_exposure_no_quakes():
    """Province seismic exposure defaults when no quakes are nearby."""
    exposure = ign_seismic.compute_province_seismic_exposure(
        province_lat=40.0, province_lon=-3.7, quakes=[], radius_km=200.0
    )
    assert exposure["max_magnitude_30d"] == 0.0
    assert exposure["max_magnitude_90d"] == 0.0
    assert exposure["earthquake_count_30d"] == 0
    assert exposure["nearest_quake_distance_km"] == 999.0
    assert exposure["nearest_quake_magnitude"] == 0.0
    assert exposure["cumulative_energy_30d"] == 0
