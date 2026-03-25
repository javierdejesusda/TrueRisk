"""Tests for municipality-level risk modifiers."""
from app.services.municipality_risk_service import (
    _land_use_modifier,
    _river_proximity_modifier,
    _elderly_modifier,
)


def test_forest_amplifies_wildfire():
    assert _land_use_modifier("forest", "wildfire") == 1.3


def test_urban_amplifies_heatwave():
    assert _land_use_modifier("urban", "heatwave") == 1.15


def test_no_land_use_neutral():
    assert _land_use_modifier(None, "wildfire") == 1.0


def test_land_use_neutral_for_flood():
    assert _land_use_modifier("forest", "flood") == 1.0


def test_close_river_amplifies_flood():
    assert _river_proximity_modifier(0.5, "flood") == 1.4


def test_moderate_river_amplifies_flood():
    assert _river_proximity_modifier(3.0, "flood") == 1.15


def test_far_river_neutral():
    assert _river_proximity_modifier(10.0, "flood") == 1.0


def test_river_neutral_for_wildfire():
    assert _river_proximity_modifier(0.5, "wildfire") == 1.0


def test_high_elderly_amplifies_heatwave():
    assert _elderly_modifier(30.0, "heatwave") == 1.2


def test_moderate_elderly_amplifies_coldwave():
    assert _elderly_modifier(22.0, "coldwave") == 1.1


def test_low_elderly_neutral():
    assert _elderly_modifier(15.0, "heatwave") == 1.0


def test_elderly_neutral_for_flood():
    assert _elderly_modifier(30.0, "flood") == 1.0
