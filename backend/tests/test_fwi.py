"""Tests for the Canadian FWI system wrapper."""

import pytest

from app.ml.features.fwi import compute_fwi_components

_ALL_KEYS = ("ffmc", "dmc", "dc", "isi", "bui", "fwi")


def test_fwi_dry_hot_conditions():
    """High temp, low humidity, no rain should produce high FWI."""
    result = compute_fwi_components(
        temp_c=35.0,
        humidity_pct=15.0,
        wind_kmh=25.0,
        rain_mm=0.0,
        prev_ffmc=85.0,
        prev_dmc=50.0,
        prev_dc=300.0,
    )
    assert result["ffmc"] > 80
    assert result["fwi"] > 20
    assert all(k in result for k in _ALL_KEYS)


def test_fwi_wet_conditions():
    """Heavy rain should suppress FWI."""
    result = compute_fwi_components(
        temp_c=15.0,
        humidity_pct=90.0,
        wind_kmh=5.0,
        rain_mm=25.0,
        prev_ffmc=85.0,
        prev_dmc=50.0,
        prev_dc=300.0,
    )
    assert result["fwi"] < 5


def test_fwi_default_initial_values():
    """First computation with no previous values should use standard defaults."""
    result = compute_fwi_components(
        temp_c=25.0,
        humidity_pct=50.0,
        wind_kmh=10.0,
        rain_mm=0.0,
    )
    assert all(isinstance(result[k], float) for k in _ALL_KEYS)


def test_fwi_all_values_non_negative():
    """All FWI components must be non-negative."""
    result = compute_fwi_components(
        temp_c=10.0,
        humidity_pct=80.0,
        wind_kmh=8.0,
        rain_mm=5.0,
        prev_ffmc=70.0,
        prev_dmc=20.0,
        prev_dc=100.0,
    )
    for key in _ALL_KEYS:
        assert result[key] >= 0.0, f"{key} was negative: {result[key]}"


def test_fwi_month_parameter():
    """Providing a month should not raise and should affect DMC/DC via day length."""
    summer = compute_fwi_components(
        temp_c=30.0,
        humidity_pct=30.0,
        wind_kmh=15.0,
        rain_mm=0.0,
        month=7,
    )
    winter = compute_fwi_components(
        temp_c=30.0,
        humidity_pct=30.0,
        wind_kmh=15.0,
        rain_mm=0.0,
        month=1,
    )
    # Longer days in summer should yield higher DMC/DC drying
    assert summer["dmc"] > winter["dmc"]
