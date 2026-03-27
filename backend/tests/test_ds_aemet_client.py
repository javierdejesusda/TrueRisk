"""Tests for the AEMET data source client."""

import io
import tarfile
import time

import pytest
import respx
from httpx import Response

from app.data import aemet_client
from app.data.aemet_client import (
    fetch_alerts,
    fetch_forecast,
    fetch_hourly_forecast,
    fetch_wildfire_index,
    fetch_weather_stations,
    parse_cap_xml,
    zone_code_to_ine_province,
    _AEMET_BASE,
)

_FAKE_KEY = "test-api-key-123"


@pytest.fixture(autouse=True)
def clear_cache():
    """Reset module-level caches before each test."""
    aemet_client._alert_cache.clear()
    aemet_client._alert_cache_ts.clear()
    yield
    aemet_client._alert_cache.clear()
    aemet_client._alert_cache_ts.clear()


@pytest.fixture(autouse=True)
def no_retry_wait(monkeypatch):
    """Make tenacity retries instant in tests."""
    monkeypatch.setattr("tenacity.nap.time.sleep", lambda x: None)


def _build_cap_xml(
    identifier="ALERT-001",
    severity="Moderate",
    event="Rainfall",
    headline="Heavy rain expected",
    description="Heavy rainfall warning",
    area_desc="Madrid",
    geocode_value="61280101A",
    onset="2025-01-15T06:00:00+01:00",
    expires="2025-01-15T18:00:00+01:00",
    extra_areas=None,
) -> str:
    """Build a minimal CAP XML string for testing."""
    areas = f"""<area>
        <areaDesc>{area_desc}</areaDesc>
        <geocode><valueName>AEMET-Meteoalerta zone</valueName><value>{geocode_value}</value></geocode>
    </area>"""
    if extra_areas:
        for ea in extra_areas:
            areas += f"""<area>
        <areaDesc>{ea['area_desc']}</areaDesc>
        <geocode><valueName>AEMET-Meteoalerta zone</valueName><value>{ea['geocode_value']}</value></geocode>
    </area>"""
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<alert>
    <identifier>{identifier}</identifier>
    <sender>aemet@aemet.es</sender>
    <sent>2025-01-15T05:00:00+01:00</sent>
    <info>
        <severity>{severity}</severity>
        <event>{event}</event>
        <headline>{headline}</headline>
        <description>{description}</description>
        <onset>{onset}</onset>
        <expires>{expires}</expires>
        {areas}
    </info>
</alert>"""


def _build_tar_bytes(*xml_strings: str) -> bytes:
    """Build a TAR archive in memory containing the given XML strings as files."""
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tf:
        for idx, xml in enumerate(xml_strings):
            data = xml.encode("utf-8")
            info = tarfile.TarInfo(name=f"alert_{idx}.xml")
            info.size = len(data)
            tf.addfile(info, io.BytesIO(data))
    return buf.getvalue()


# -- parse_cap_xml tests --

def test_parse_cap_xml_single_alert():
    xml = _build_cap_xml()
    alerts = parse_cap_xml(xml)
    assert len(alerts) == 1
    a = alerts[0]
    assert a["identifier"] == "ALERT-001"
    assert a["severity"] == "yellow"
    assert a["event"] == "Rainfall"
    assert a["headline"] == "Heavy rain expected"
    assert a["description"] == "Heavy rainfall warning"
    assert a["area_desc"] == "Madrid"
    assert a["geocode"] == "28"
    assert a["onset"] == "2025-01-15T06:00:00+01:00"
    assert a["expires"] == "2025-01-15T18:00:00+01:00"
    assert a["sender"] == "aemet@aemet.es"


def test_parse_cap_xml_multiple_areas():
    xml = _build_cap_xml(
        identifier="ALERT-002",
        extra_areas=[
            {"area_desc": "Toledo", "geocode_value": "61450101A"},
        ],
    )
    alerts = parse_cap_xml(xml)
    assert len(alerts) == 2
    assert alerts[0]["identifier"] == "ALERT-002_0"
    assert alerts[1]["identifier"] == "ALERT-002_1"
    assert alerts[0]["area_desc"] == "Madrid"
    assert alerts[1]["area_desc"] == "Toledo"


# -- zone_code_to_ine_province tests --

def test_zone_code_to_ine_standard():
    # digits 0-1 = ccaa (61), digits 2-3 = province (28)
    assert zone_code_to_ine_province("61280101A") == "28"
    # Valencia: ccaa=52, province=46
    assert zone_code_to_ine_province("52460101A") == "46"


def test_zone_code_to_ine_canarias():
    # ccaa=65, zone digits 93 -> province 38 (Santa Cruz de Tenerife)
    assert zone_code_to_ine_province("65930101A") == "38"
    # ccaa=65, zone digits 90 -> province 35 (Las Palmas)
    assert zone_code_to_ine_province("65900101A") == "35"


def test_zone_code_to_ine_invalid():
    assert zone_code_to_ine_province("") == ""
    assert zone_code_to_ine_province("A") == ""
    assert zone_code_to_ine_province("1") == ""


# -- fetch_alerts tests --

@respx.mock
async def test_fetch_alerts_happy_path():
    xml = _build_cap_xml(geocode_value="61280101A")
    tar_bytes = _build_tar_bytes(xml)

    respx.get(f"{_AEMET_BASE}/avisos_cap/ultimoelaborado/area/esp").mock(
        return_value=Response(200, json={"datos": "https://datos.aemet.es/tar"})
    )
    respx.get("https://datos.aemet.es/tar").mock(
        return_value=Response(200, content=tar_bytes)
    )

    alerts = await fetch_alerts(_FAKE_KEY)
    assert len(alerts) == 1
    assert alerts[0]["geocode"] == "28"
    assert alerts[0]["severity"] == "yellow"


@respx.mock
async def test_fetch_alerts_metadata_failure():
    respx.get(f"{_AEMET_BASE}/avisos_cap/ultimoelaborado/area/esp").mock(
        return_value=Response(503, text="Service Unavailable")
    )

    alerts = await fetch_alerts(_FAKE_KEY)
    assert alerts == []


@respx.mock
async def test_fetch_alerts_no_datos_url():
    respx.get(f"{_AEMET_BASE}/avisos_cap/ultimoelaborado/area/esp").mock(
        return_value=Response(200, json={"estado": 200})
    )

    alerts = await fetch_alerts(_FAKE_KEY)
    assert alerts == []


async def test_fetch_alerts_cache_hit():
    cached = [{"identifier": "CACHED", "geocode": "28", "severity": "red"}]
    aemet_client._alert_cache["alerts:esp"] = cached
    aemet_client._alert_cache_ts["alerts:esp"] = time.time()

    alerts = await fetch_alerts(_FAKE_KEY)
    assert alerts == cached
    assert alerts[0]["identifier"] == "CACHED"


# -- fetch_forecast tests --

@respx.mock
async def test_fetch_forecast_happy_path():
    forecast_data = [{"elaborado": "2025-01-15", "prediccion": {"dia": []}}]
    respx.get(
        f"{_AEMET_BASE}/prediccion/especifica/municipio/diaria/28079"
    ).mock(
        return_value=Response(200, json={"datos": "https://datos.aemet.es/forecast"})
    )
    respx.get("https://datos.aemet.es/forecast").mock(
        return_value=Response(200, json=forecast_data)
    )

    result = await fetch_forecast(_FAKE_KEY, "28079")
    assert result == forecast_data


@respx.mock
async def test_fetch_forecast_failure():
    respx.get(
        f"{_AEMET_BASE}/prediccion/especifica/municipio/diaria/28079"
    ).mock(
        return_value=Response(500, text="Internal Server Error")
    )

    result = await fetch_forecast(_FAKE_KEY, "28079")
    assert result is None


# -- fetch_hourly_forecast tests --

@respx.mock
async def test_fetch_hourly_forecast_happy_path():
    hourly_data = [{"elaborado": "2025-01-15", "prediccion": {"dia": []}}]
    respx.get(
        f"{_AEMET_BASE}/prediccion/especifica/municipio/horaria/28079"
    ).mock(
        return_value=Response(200, json={"datos": "https://datos.aemet.es/hourly"})
    )
    respx.get("https://datos.aemet.es/hourly").mock(
        return_value=Response(200, json=hourly_data)
    )

    result = await fetch_hourly_forecast(_FAKE_KEY, "28079")
    assert result == hourly_data


# -- fetch_wildfire_index tests --

@respx.mock
async def test_fetch_wildfire_index_happy_path():
    fire_data = {"nivel": "alto", "fecha": "2025-01-15"}
    respx.get(f"{_AEMET_BASE}/incendios/mapas/nivel/diario").mock(
        return_value=Response(200, json={"datos": "https://datos.aemet.es/fire"})
    )
    respx.get("https://datos.aemet.es/fire").mock(
        return_value=Response(200, json=fire_data)
    )

    result = await fetch_wildfire_index(_FAKE_KEY)
    assert result == fire_data


# -- fetch_weather_stations tests --

@respx.mock
async def test_fetch_weather_stations_happy_path():
    stations = [{"idema": "3129", "ubi": "MADRID", "ta": 15.2}]
    respx.get(f"{_AEMET_BASE}/observacion/convencional/todas").mock(
        return_value=Response(200, json={"datos": "https://datos.aemet.es/stations"})
    )
    respx.get("https://datos.aemet.es/stations").mock(
        return_value=Response(200, json=stations)
    )

    result = await fetch_weather_stations(_FAKE_KEY)
    assert len(result) == 1
    assert result[0]["idema"] == "3129"
