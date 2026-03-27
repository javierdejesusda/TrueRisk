"""Tests for Copernicus EMS data source module."""

import pytest
import respx
from httpx import Response

from app.data import copernicus_ems

_SPAIN_ITEM_XML = """<?xml version="1.0"?>
<rss><channel>
<item>
<title>EMSR001 - Flood in Spain</title>
<link>https://emergency.copernicus.eu/mapping/emsr001</link>
<description>Flooding event in eastern Spain</description>
<pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
</item>
</channel></rss>"""

_NON_SPAIN_ITEM_XML = """<?xml version="1.0"?>
<rss><channel>
<item>
<title>EMSR002 - Flood in France</title>
<link>https://emergency.copernicus.eu/mapping/emsr002</link>
<description>Flooding event in southern France</description>
<pubDate>Mon, 02 Jan 2024 00:00:00 GMT</pubDate>
</item>
</channel></rss>"""

_MIXED_XML = """<?xml version="1.0"?>
<rss><channel>
<item>
<title>EMSR001 - Flood in Spain</title>
<link>https://emergency.copernicus.eu/mapping/emsr001</link>
<description>Flooding in eastern Spain</description>
<pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
</item>
<item>
<title>EMSR002 - Flood in France</title>
<link>https://emergency.copernicus.eu/mapping/emsr002</link>
<description>Flooding in southern France</description>
<pubDate>Mon, 02 Jan 2024 00:00:00 GMT</pubDate>
</item>
</channel></rss>"""


@pytest.fixture(autouse=True)
def clear_cache():
    copernicus_ems._cache.clear()
    copernicus_ems._cache_ts = 0.0
    yield
    copernicus_ems._cache.clear()
    copernicus_ems._cache_ts = 0.0


@pytest.fixture(autouse=True)
def no_retry_wait(monkeypatch):
    monkeypatch.setattr("tenacity.nap.time.sleep", lambda x: None)


@respx.mock
async def test_happy_path_spain_items():
    """Items mentioning Spain are returned."""
    respx.get("https://emergency.copernicus.eu/mapping/activations-702/feed").mock(
        return_value=Response(200, text=_SPAIN_ITEM_XML)
    )
    result = await copernicus_ems.fetch_active_emergencies()
    assert len(result) == 1
    assert result[0]["title"] == "EMSR001 - Flood in Spain"
    assert "emsr001" in result[0]["link"]


@respx.mock
async def test_filters_non_spain():
    """Items not mentioning Spain are excluded."""
    respx.get("https://emergency.copernicus.eu/mapping/activations-702/feed").mock(
        return_value=Response(200, text=_MIXED_XML)
    )
    result = await copernicus_ems.fetch_active_emergencies()
    assert len(result) == 1
    assert "Spain" in result[0]["title"]


@respx.mock
async def test_all_feeds_fail():
    """When all feeds fail, return empty list."""
    for url in copernicus_ems._FEED_URLS:
        respx.get(url).mock(return_value=Response(503, text="unavailable"))
    result = await copernicus_ems.fetch_active_emergencies()
    assert result == []


@respx.mock
async def test_fallback_to_second_feed():
    """If first feed fails, fall back to second."""
    respx.get("https://emergency.copernicus.eu/mapping/activations-702/feed").mock(
        return_value=Response(503, text="unavailable")
    )
    respx.get("https://emergency.copernicus.eu/mapping/list-of-activations-702/feed").mock(
        return_value=Response(200, text=_SPAIN_ITEM_XML)
    )
    respx.get("https://emergency.copernicus.eu/mapping/feed").mock(
        return_value=Response(200, text="<rss></rss>")
    )
    result = await copernicus_ems.fetch_active_emergencies()
    assert len(result) == 1
    assert result[0]["title"] == "EMSR001 - Flood in Spain"


@respx.mock
async def test_cache_hit():
    """Second call returns cached data without HTTP requests."""
    respx.get("https://emergency.copernicus.eu/mapping/activations-702/feed").mock(
        return_value=Response(200, text=_SPAIN_ITEM_XML)
    )
    first = await copernicus_ems.fetch_active_emergencies()
    assert len(first) == 1

    respx.reset()

    second = await copernicus_ems.fetch_active_emergencies()
    assert second == first
