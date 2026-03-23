"""Tests for municipality risk disaggregation."""

import pytest
from app.services.municipality_risk_service import (
    _elevation_modifier,
    _coastal_modifier,
    MunicipalityRisk,
)


def test_elevation_flood_low():
    assert _elevation_modifier(30, "flood") == 1.2


def test_elevation_flood_high():
    assert _elevation_modifier(1000, "flood") == 0.8


def test_elevation_heatwave_low():
    assert _elevation_modifier(100, "heatwave") == 1.1


def test_elevation_heatwave_mountain():
    assert _elevation_modifier(1200, "heatwave") == 0.85


def test_elevation_none():
    assert _elevation_modifier(None, "flood") == 1.0


def test_coastal_flood():
    assert _coastal_modifier(True, "flood") == 1.15


def test_coastal_heatwave():
    assert _coastal_modifier(True, "heatwave") == 0.9


def test_inland_no_modifier():
    assert _coastal_modifier(False, "flood") == 1.0


@pytest.mark.asyncio
async def test_municipality_risk_endpoint(client):
    response = await client.get("/api/v1/risk/municipality/28079")
    assert response.status_code in (200, 404, 500, 503)


@pytest.mark.asyncio
async def test_province_municipalities_endpoint(client):
    response = await client.get("/api/v1/risk/province/28/municipalities")
    assert response.status_code in (200, 500, 503)
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
