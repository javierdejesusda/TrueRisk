"""Tests for KNN event extraction and fallback logic."""
from __future__ import annotations

from datetime import date
from unittest.mock import MagicMock

from app.services.prediction_service import (
    _build_knn_events_from_summaries,
    _HISTORICAL_EVENTS,
)


def _make_summary(**kwargs):
    """Create a mock WeatherDailySummary."""
    defaults = {
        "date": date(2024, 1, 15),
        "precipitation_sum": 0,
        "temperature_max": 20,
        "temperature_min": 10,
        "temperature_avg": 15,
        "wind_speed_max": 10,
        "humidity_avg": 50,
        "pressure_avg": 1013,
        "soil_moisture_avg": 0.3,
    }
    defaults.update(kwargs)
    mock = MagicMock()
    for k, v in defaults.items():
        setattr(mock, k, v)
    return mock


def test_extracts_extreme_precip():
    summaries = [_make_summary(precipitation_sum=50)]
    events = _build_knn_events_from_summaries(summaries)
    assert len(events) == 1
    assert events[0]["precip"] == 50


def test_extracts_extreme_heat():
    summaries = [_make_summary(temperature_max=42)]
    events = _build_knn_events_from_summaries(summaries)
    assert len(events) == 1
    assert events[0]["temp"] == 42


def test_extracts_extreme_wind():
    summaries = [_make_summary(wind_speed_max=80)]
    events = _build_knn_events_from_summaries(summaries)
    assert len(events) == 1
    assert events[0]["wind"] == 80


def test_includes_normal_weather():
    """C7: All daily summaries are included in the analog pool, not just extremes."""
    summaries = [_make_summary(precipitation_sum=5, temperature_max=25, wind_speed_max=15)]
    events = _build_knn_events_from_summaries(summaries)
    assert len(events) == 1
    assert "Normal" in events[0]["event"]


def test_historical_events_has_entries():
    assert len(_HISTORICAL_EVENTS) >= 5


def test_historical_events_have_6d_fields():
    """C6: Historical events include pressure and soil_moisture for 6D KNN."""
    for evt in _HISTORICAL_EVENTS:
        assert "pressure" in evt, f"Missing pressure in {evt['event']}"
        assert "soil_moisture" in evt, f"Missing soil_moisture in {evt['event']}"


def test_knn_events_include_pressure_and_soil_moisture():
    """C6/C7: Built events include pressure and soil_moisture fields."""
    summaries = [_make_summary(precipitation_sum=50, pressure_avg=1005, soil_moisture_avg=0.6)]
    events = _build_knn_events_from_summaries(summaries)
    assert events[0]["pressure"] == 1005
    assert events[0]["soil_moisture"] == 0.6
