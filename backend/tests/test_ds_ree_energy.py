"""Tests for REE energy data source module."""

import pytest
import respx
from httpx import Response

from app.data import ree_energy

_DEMAND_RESPONSE = {
    "included": [
        {
            "type": "Demanda real",
            "attributes": {
                "values": [
                    {"value": 25000, "datetime": "2024-01-15T00:00"},
                    {"value": 28000, "datetime": "2024-01-15T01:00"},
                    {"value": 22000, "datetime": "2024-01-15T02:00"},
                ]
            },
        }
    ]
}

_DEMAND_EMPTY_INCLUDED = {"included": []}

_GENERATION_RESPONSE = {
    "included": [
        {
            "attributes": {
                "title": "Solar",
                "values": [
                    {"value": 5000},
                    {"value": 6000},
                ],
            },
        },
        {
            "attributes": {
                "title": "Wind",
                "values": [
                    {"value": 8000},
                    {"value": None},
                ],
            },
        },
    ]
}


@pytest.fixture(autouse=True)
def clear_cache():
    ree_energy._cache.clear()
    ree_energy._cache_ts.clear()
    yield
    ree_energy._cache.clear()
    ree_energy._cache_ts.clear()


@pytest.fixture(autouse=True)
def no_retry_wait(monkeypatch):
    monkeypatch.setattr("tenacity.nap.time.sleep", lambda x: None)


@respx.mock
async def test_fetch_demand_happy_path():
    """Demand values are parsed correctly."""
    respx.get("https://apidatos.ree.es/en/datos/demanda/evolucion").mock(
        return_value=Response(200, json=_DEMAND_RESPONSE)
    )
    result = await ree_energy.fetch_demand(date="2024-01-15")
    assert result["current_demand_mw"] == 22000
    assert result["max_demand_mw"] == 28000
    assert result["min_demand_mw"] == 22000
    assert result["values_count"] == 3


@respx.mock
async def test_fetch_demand_empty_included():
    """Empty included array results in None values."""
    respx.get("https://apidatos.ree.es/en/datos/demanda/evolucion").mock(
        return_value=Response(200, json=_DEMAND_EMPTY_INCLUDED)
    )
    result = await ree_energy.fetch_demand(date="2024-01-15")
    assert result["current_demand_mw"] is None
    assert result["max_demand_mw"] is None
    assert result["values_count"] == 0


@respx.mock
async def test_fetch_demand_error():
    """HTTP error returns empty dict (no stale cache)."""
    respx.get("https://apidatos.ree.es/en/datos/demanda/evolucion").mock(
        return_value=Response(500, text="error")
    )
    result = await ree_energy.fetch_demand(date="2024-01-15")
    assert result == {}


@respx.mock
async def test_fetch_demand_cache_hit():
    """Second call returns cached data without HTTP requests."""
    respx.get("https://apidatos.ree.es/en/datos/demanda/evolucion").mock(
        return_value=Response(200, json=_DEMAND_RESPONSE)
    )
    first = await ree_energy.fetch_demand(date="2024-01-15")
    assert first["values_count"] == 3

    respx.reset()

    second = await ree_energy.fetch_demand(date="2024-01-15")
    assert second == first


@respx.mock
async def test_fetch_generation_mix_happy_path():
    """Generation mix is parsed correctly with None values filtered."""
    respx.get("https://apidatos.ree.es/en/datos/generacion/estructura-generacion").mock(
        return_value=Response(200, json=_GENERATION_RESPONSE)
    )
    result = await ree_energy.fetch_generation_mix(date="2024-01-15")
    mix = result["generation_mix"]
    assert mix["Solar"] == 11000
    assert mix["Wind"] == 8000


@respx.mock
async def test_fetch_generation_mix_error():
    """HTTP error returns empty dict."""
    respx.get("https://apidatos.ree.es/en/datos/generacion/estructura-generacion").mock(
        return_value=Response(500, text="error")
    )
    result = await ree_energy.fetch_generation_mix(date="2024-01-15")
    assert result == {}


@respx.mock
async def test_fetch_generation_mix_cache_hit():
    """Second call returns cached generation data."""
    respx.get("https://apidatos.ree.es/en/datos/generacion/estructura-generacion").mock(
        return_value=Response(200, json=_GENERATION_RESPONSE)
    )
    first = await ree_energy.fetch_generation_mix(date="2024-01-15")
    assert "generation_mix" in first

    respx.reset()

    second = await ree_energy.fetch_generation_mix(date="2024-01-15")
    assert second == first
