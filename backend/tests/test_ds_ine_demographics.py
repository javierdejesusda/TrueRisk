"""Tests for the INE demographics data source module."""

import pytest
import respx
from httpx import Response

from app.data import ine_demographics

_INE_URL = "https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/2852"


@pytest.fixture(autouse=True)
def clear_cache():
    """Reset module-level caches before each test."""
    ine_demographics._cache.clear()
    ine_demographics._cache_ts.clear()
    yield
    ine_demographics._cache.clear()
    ine_demographics._cache_ts.clear()


@pytest.fixture(autouse=True)
def no_retry_wait(monkeypatch):
    """Make tenacity retries instant in tests."""
    monkeypatch.setattr("tenacity.nap.time.sleep", lambda x: None)


def _make_ine_response(province: str = "Valencia"):
    """Build a realistic INE demographics JSON list."""
    return [
        {
            "Nombre": f"Total habitantes. Total. {province}",
            "Data": [{"Valor": 2500000}],
        },
        {
            "Nombre": f"Total habitantes. Hombres. Total. {province}",
            "Data": [{"Valor": 1230000}],
        },
        {
            "Nombre": f"Total habitantes. Mujeres. Total. {province}",
            "Data": [{"Valor": 1270000}],
        },
    ]


@respx.mock
async def test_happy_path():
    respx.get(_INE_URL).mock(
        return_value=Response(200, json=_make_ine_response("Valencia"))
    )
    result = await ine_demographics.fetch_province_demographics("Valencia")
    assert result["total_population"] == 2500000
    assert result["male_population"] == 1230000
    assert result["female_population"] == 1270000


@respx.mock
async def test_not_found_province():
    respx.get(_INE_URL).mock(
        return_value=Response(200, json=_make_ine_response("Valencia"))
    )
    result = await ine_demographics.fetch_province_demographics("Nonexistent")
    assert result["total_population"] == 0
    assert result["male_population"] == 0
    assert result["female_population"] == 0


@respx.mock
async def test_http_error():
    respx.get(_INE_URL).mock(
        return_value=Response(503, text="Service Unavailable")
    )
    result = await ine_demographics.fetch_province_demographics("Valencia")
    assert result == {}


@respx.mock
async def test_cache_hit():
    route = respx.get(_INE_URL)
    route.mock(return_value=Response(200, json=_make_ine_response("Valencia")))

    first = await ine_demographics.fetch_province_demographics("Valencia")
    second = await ine_demographics.fetch_province_demographics("Valencia")
    assert first == second
    assert route.call_count == 1


@respx.mock
async def test_non_list_response():
    respx.get(_INE_URL).mock(
        return_value=Response(200, json={"error": "unexpected format"})
    )
    result = await ine_demographics.fetch_province_demographics("Valencia")
    assert result == {}
