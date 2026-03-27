"""Tests for the resilient HTTP utility."""

import pytest
import respx
from httpx import Response

from app.data._http import resilient_get, RetryableHTTPStatusError, TIMEOUTS


@pytest.fixture(autouse=True)
def no_retry_wait(monkeypatch):
    """Make tenacity retries instant in tests."""
    monkeypatch.setattr("tenacity.nap.time.sleep", lambda x: None)


@respx.mock
async def test_success_returns_response():
    respx.get("https://example.com/data").mock(return_value=Response(200, json={"ok": True}))
    resp = await resilient_get("https://example.com/data", source="open_meteo")
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}


@respx.mock
async def test_retries_on_500():
    route = respx.get("https://example.com/data")
    route.side_effect = [
        Response(500, text="error"),
        Response(200, json={"ok": True}),
    ]
    resp = await resilient_get("https://example.com/data", source="open_meteo", max_retries=3)
    assert resp.status_code == 200
    assert route.call_count == 2


@respx.mock
async def test_retries_on_429():
    route = respx.get("https://example.com/data")
    route.side_effect = [
        Response(429, text="rate limited"),
        Response(200, json={"ok": True}),
    ]
    resp = await resilient_get("https://example.com/data", source="open_meteo", max_retries=3)
    assert resp.status_code == 200
    assert route.call_count == 2


@respx.mock
async def test_retries_on_502_503_504():
    for status in [502, 503, 504]:
        route = respx.get("https://example.com/data")
        route.side_effect = [
            Response(status, text="error"),
            Response(200, json={"ok": True}),
        ]
        resp = await resilient_get("https://example.com/data", source="open_meteo", max_retries=3)
        assert resp.status_code == 200
        respx.reset()


@respx.mock
async def test_no_retry_on_404():
    route = respx.get("https://example.com/data")
    route.mock(return_value=Response(404, text="not found"))
    resp = await resilient_get("https://example.com/data", source="open_meteo", max_retries=3)
    assert resp.status_code == 404
    assert route.call_count == 1


@respx.mock
async def test_no_retry_on_401():
    route = respx.get("https://example.com/data")
    route.mock(return_value=Response(401, text="unauthorized"))
    resp = await resilient_get("https://example.com/data", source="open_meteo", max_retries=3)
    assert resp.status_code == 401
    assert route.call_count == 1


@respx.mock
async def test_exhausts_retries_raises():
    route = respx.get("https://example.com/data")
    route.mock(return_value=Response(503, text="unavailable"))
    with pytest.raises(RetryableHTTPStatusError):
        await resilient_get("https://example.com/data", source="open_meteo", max_retries=3)
    assert route.call_count == 3


@respx.mock
async def test_retries_on_timeout():
    import httpx
    route = respx.get("https://example.com/data")
    route.side_effect = [
        httpx.ReadTimeout("read timed out"),
        Response(200, json={"ok": True}),
    ]
    resp = await resilient_get("https://example.com/data", source="open_meteo", max_retries=3)
    assert resp.status_code == 200
    assert route.call_count == 2


@respx.mock
async def test_retries_on_connect_error():
    import httpx
    route = respx.get("https://example.com/data")
    route.side_effect = [
        httpx.ConnectError("connection refused"),
        Response(200, json={"ok": True}),
    ]
    resp = await resilient_get("https://example.com/data", source="open_meteo", max_retries=3)
    assert resp.status_code == 200


@respx.mock
async def test_custom_max_retries():
    route = respx.get("https://example.com/data")
    route.mock(return_value=Response(500, text="error"))
    with pytest.raises(RetryableHTTPStatusError):
        await resilient_get("https://example.com/data", source="open_meteo", max_retries=5)
    assert route.call_count == 5


def test_source_timeouts_defined():
    for source in ["open_meteo", "aemet", "nasa_firms", "usgs", "ign_seismic",
                    "copernicus_efas", "copernicus_cams", "copernicus_land",
                    "copernicus_ems", "openaq", "ree_energy", "ine_demographics",
                    "nasa_power", "ecmwf_seasonal", "open_meteo_upper_air"]:
        assert source in TIMEOUTS, f"Missing timeout config for {source}"
        cfg = TIMEOUTS[source]
        assert cfg.connect > 0
        assert cfg.read > 0


@respx.mock
async def test_passes_headers():
    route = respx.get("https://example.com/data")
    route.mock(return_value=Response(200, json={"ok": True}))
    await resilient_get(
        "https://example.com/data", source="aemet", headers={"api_key": "test123"}
    )
    assert route.calls[0].request.headers["api_key"] == "test123"


@respx.mock
async def test_passes_params():
    route = respx.get("https://example.com/data").mock(return_value=Response(200, json={}))
    await resilient_get("https://example.com/data", source="open_meteo", params={"lat": "40.0"})
    assert "lat=40.0" in str(route.calls[0].request.url)
