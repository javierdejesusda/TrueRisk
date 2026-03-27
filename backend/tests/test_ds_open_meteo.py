"""Tests for the Open-Meteo data source client."""

import pytest
import respx
from httpx import Response

from app.data.open_meteo import (
    fetch_current,
    fetch_forecast,
    fetch_all_provinces,
    fetch_flood_forecast,
    fetch_historical,
    fetch_ensemble_features,
    fetch_historical_parsed,
    _BASE_URL,
    _FLOOD_URL,
    _ARCHIVE_URL,
)


@pytest.fixture(autouse=True)
def no_retry_wait(monkeypatch):
    """Make tenacity retries instant in tests."""
    monkeypatch.setattr("tenacity.nap.time.sleep", lambda x: None)


def _current_response_json():
    """Minimal valid response for the current weather endpoint."""
    return {
        "current": {
            "temperature_2m": 22.5,
            "relative_humidity_2m": 55,
            "precipitation": 0.0,
            "wind_speed_10m": 12.0,
            "wind_direction_10m": 180,
            "wind_gusts_10m": 20.0,
            "surface_pressure": 1013.0,
            "cloud_cover": 40,
            "uv_index": 5.0,
            "dew_point_2m": 12.0,
            "time": "2025-01-15T12:00",
        },
        "hourly": {
            "soil_moisture_0_to_7cm": [0.3],
        },
    }


def _forecast_response_json():
    """Minimal valid response for the forecast endpoint."""
    return {
        "hourly": {
            "time": ["2025-01-15T00:00", "2025-01-15T01:00"],
            "temperature_2m": [10.0, 11.0],
            "relative_humidity_2m": [80, 78],
            "precipitation": [0.0, 0.5],
            "wind_speed_10m": [5.0, 6.0],
            "wind_direction_10m": [200, 210],
            "surface_pressure": [1012.0, 1011.5],
            "cloud_cover": [60, 70],
        },
        "daily": {
            "time": ["2025-01-15"],
            "temperature_2m_max": [15.0],
            "temperature_2m_min": [5.0],
            "precipitation_sum": [2.0],
            "wind_speed_10m_max": [20.0],
            "uv_index_max": [4.0],
            "et0_fao_evapotranspiration": [3.0],
        },
    }


def _historical_response_json():
    """Minimal valid response for the archive endpoint."""
    return {
        "daily": {
            "time": ["2024-01-01", "2024-01-02"],
            "temperature_2m_max": [12.0, 14.0],
            "temperature_2m_min": [2.0, 4.0],
            "precipitation_sum": [5.0, 0.0],
            "wind_speed_10m_max": [15.0, 10.0],
            "uv_index_max": [3.0, 4.0],
            "et0_fao_evapotranspiration": [2.0, 2.5],
            "soil_moisture_0_to_7cm_mean": [0.25, 0.28],
        },
    }


# -- fetch_current tests --

@respx.mock
async def test_fetch_current_happy_path():
    respx.get(_BASE_URL).mock(
        return_value=Response(200, json=_current_response_json())
    )

    result = await fetch_current(40.0, -3.7)
    assert result["temperature"] == 22.5
    assert result["humidity"] == 55
    assert result["precipitation"] == 0.0
    assert result["wind_speed"] == 12.0
    assert result["wind_direction"] == 180
    assert result["wind_gusts"] == 20.0
    assert result["pressure"] == 1013.0
    assert result["cloud_cover"] == 40
    assert result["uv_index"] == 5.0
    assert result["dew_point"] == 12.0
    assert result["soil_moisture"] == 0.3
    assert result["time"] == "2025-01-15T12:00"


@respx.mock
async def test_fetch_current_http_error():
    respx.get(_BASE_URL).mock(return_value=Response(500, text="error"))

    result = await fetch_current(40.0, -3.7)
    assert result == {}


@respx.mock
async def test_fetch_current_missing_keys():
    respx.get(_BASE_URL).mock(
        return_value=Response(200, json={"latitude": 40.0})
    )

    result = await fetch_current(40.0, -3.7)
    assert result["temperature"] is None
    assert result["humidity"] is None
    assert result["soil_moisture"] is None
    assert result["time"] is None


# -- fetch_forecast tests --

@respx.mock
async def test_fetch_forecast_happy_path():
    respx.get(_BASE_URL).mock(
        return_value=Response(200, json=_forecast_response_json())
    )

    result = await fetch_forecast(40.0, -3.7)
    assert len(result["hourly"]) == 2
    assert result["hourly"][0]["temperature"] == 10.0
    assert result["hourly"][1]["precipitation"] == 0.5
    assert len(result["daily"]) == 1
    assert result["daily"][0]["temperature_max"] == 15.0
    assert result["daily"][0]["precipitation_sum"] == 2.0


@respx.mock
async def test_fetch_forecast_error():
    respx.get(_BASE_URL).mock(return_value=Response(503, text="unavailable"))

    result = await fetch_forecast(40.0, -3.7)
    assert result == {"hourly": [], "daily": []}


# -- fetch_all_provinces tests --

@respx.mock
async def test_fetch_all_provinces_happy_path():
    provinces = [
        {"code": "28", "lat": 40.4, "lon": -3.7},
        {"code": "08", "lat": 41.4, "lon": 2.2},
    ]
    multi_response = [
        {
            "current": {
                "temperature_2m": 22.0, "relative_humidity_2m": 50,
                "precipitation": 0.0, "wind_speed_10m": 10.0,
                "wind_direction_10m": 180, "wind_gusts_10m": 15.0,
                "surface_pressure": 1013.0, "cloud_cover": 30,
                "uv_index": 5.0, "dew_point_2m": 11.0,
                "time": "2025-01-15T12:00",
            },
            "hourly": {"soil_moisture_0_to_7cm": [0.3]},
        },
        {
            "current": {
                "temperature_2m": 18.0, "relative_humidity_2m": 60,
                "precipitation": 1.0, "wind_speed_10m": 8.0,
                "wind_direction_10m": 90, "wind_gusts_10m": 12.0,
                "surface_pressure": 1010.0, "cloud_cover": 70,
                "uv_index": 3.0, "dew_point_2m": 10.0,
                "time": "2025-01-15T12:00",
            },
            "hourly": {"soil_moisture_0_to_7cm": [0.35]},
        },
    ]
    respx.get(_BASE_URL).mock(return_value=Response(200, json=multi_response))

    result = await fetch_all_provinces(provinces)
    assert "28" in result
    assert "08" in result
    assert result["28"]["temperature"] == 22.0
    assert result["08"]["temperature"] == 18.0
    assert result["08"]["precipitation"] == 1.0


@respx.mock
async def test_fetch_all_provinces_single():
    provinces = [{"code": "28", "lat": 40.4, "lon": -3.7}]
    single_response = {
        "current": {
            "temperature_2m": 22.0, "relative_humidity_2m": 50,
            "precipitation": 0.0, "wind_speed_10m": 10.0,
            "wind_direction_10m": 180, "wind_gusts_10m": 15.0,
            "surface_pressure": 1013.0, "cloud_cover": 30,
            "uv_index": 5.0, "dew_point_2m": 11.0,
            "time": "2025-01-15T12:00",
        },
        "hourly": {"soil_moisture_0_to_7cm": [0.3]},
    }
    respx.get(_BASE_URL).mock(return_value=Response(200, json=single_response))

    result = await fetch_all_provinces(provinces)
    assert "28" in result
    assert result["28"]["temperature"] == 22.0


# -- fetch_flood_forecast tests --

@respx.mock
async def test_fetch_flood_forecast_happy_path():
    flood_data = {
        "daily": {
            "time": ["2025-01-15", "2025-01-16"],
            "river_discharge": [50.0, 45.0],
        }
    }
    respx.get(_FLOOD_URL).mock(return_value=Response(200, json=flood_data))

    result = await fetch_flood_forecast(40.0, -3.7)
    assert result["daily"]["river_discharge"] == [50.0, 45.0]


@respx.mock
async def test_fetch_flood_forecast_error():
    respx.get(_FLOOD_URL).mock(return_value=Response(500, text="error"))

    result = await fetch_flood_forecast(40.0, -3.7)
    assert result == {}


# -- fetch_historical tests --

@respx.mock
async def test_fetch_historical_happy_path():
    respx.get(_ARCHIVE_URL).mock(
        return_value=Response(200, json=_historical_response_json())
    )

    result = await fetch_historical(40.0, -3.7, "2024-01-01", "2024-01-02")
    assert "daily" in result
    assert result["daily"]["time"] == ["2024-01-01", "2024-01-02"]
    assert result["daily"]["temperature_2m_max"] == [12.0, 14.0]


@respx.mock
async def test_fetch_historical_retries_on_error():
    route = respx.get(_ARCHIVE_URL)
    route.side_effect = [
        Response(503, text="unavailable"),
        Response(503, text="unavailable"),
        Response(200, json=_historical_response_json()),
    ]

    result = await fetch_historical(40.0, -3.7, "2024-01-01", "2024-01-02")
    assert "daily" in result
    assert route.call_count == 3


# -- fetch_ensemble_features tests --

@respx.mock
async def test_fetch_ensemble_happy_path():
    ensemble_data = {
        "hourly": {
            "precipitation": [0.5, 1.0, 0.2, 0.3],
            "temperature_2m": [20.0, 21.0, 19.5, 20.5],
        }
    }
    respx.get("https://ensemble-api.open-meteo.com/v1/ensemble").mock(
        return_value=Response(200, json=ensemble_data)
    )

    result = await fetch_ensemble_features(40.0, -3.7)
    assert "precip_prob_50mm_72h" in result
    assert "precip_est_72h_mm" in result
    assert "temp_forecast_mean" in result
    assert "forecast_uncertainty" in result
    assert result["temp_forecast_mean"] == 20.2
    assert result["forecast_uncertainty"] > 0


@respx.mock
async def test_fetch_ensemble_error_defaults():
    respx.get("https://ensemble-api.open-meteo.com/v1/ensemble").mock(
        return_value=Response(500, text="error")
    )

    result = await fetch_ensemble_features(40.0, -3.7)
    assert result["precip_prob_50mm_72h"] == 0.0
    assert result["precip_est_72h_mm"] == 0.0
    assert result["temp_forecast_mean"] == 0.0
    assert result["forecast_uncertainty"] == 0.0


# -- fetch_historical_parsed tests --

@respx.mock
async def test_fetch_historical_parsed_happy_path():
    respx.get(_ARCHIVE_URL).mock(
        return_value=Response(200, json=_historical_response_json())
    )

    records = await fetch_historical_parsed(40.0, -3.7, "2024-01-01", "2024-01-02")
    assert len(records) == 2
    assert records[0]["date"] == "2024-01-01"
    assert records[0]["temperature_max"] == 12.0
    assert records[0]["precipitation_sum"] == 5.0
    assert records[0]["soil_moisture_avg"] == 0.25
    assert records[1]["date"] == "2024-01-02"
    assert records[1]["temperature_min"] == 4.0


@respx.mock
async def test_fetch_historical_parsed_empty():
    respx.get(_ARCHIVE_URL).mock(
        return_value=Response(200, json={"daily": {"time": []}})
    )

    records = await fetch_historical_parsed(40.0, -3.7, "2024-01-01", "2024-01-02")
    assert records == []
