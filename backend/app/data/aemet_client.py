"""AEMET alert client -- fetches CAP alerts from Spain's met agency.

Ported from the original TypeScript implementation.
"""

from __future__ import annotations

import io
import logging
import re
import tarfile
import time
from typing import Any

import httpx

from app.data._http import resilient_get, RetryableHTTPStatusError

logger = logging.getLogger(__name__)

_AEMET_BASE = "https://opendata.aemet.es/opendata/api"

_alert_cache: dict[str, Any] = {}
_alert_cache_ts: dict[str, float] = {}
_CACHE_TTL = 300  # seconds

# Canarias zone digits -> INE province code
CANARIAS_ZONE_TO_PROVINCE: dict[str, str] = {
    "90": "35",
    "91": "35",
    "92": "35",
    "93": "38",
    "94": "38",
    "95": "38",
    "96": "38",
}

# Map AEMET severity keywords to colour levels
_SEVERITY_MAP: dict[str, str] = {
    "Extreme": "red",
    "Severe": "orange",
    "Moderate": "yellow",
    "Minor": "green",
    "Unknown": "green",
}


def zone_code_to_ine_province(zone_code: str) -> str:
    """Convert an AEMET zone code to a 2-digit INE province code.

    The zone code looks like ``61091201A`` (or similar).  Strip all
    non-digit characters, then inspect the leading digits.  If the CCAA
    prefix (positions 0-1) is ``65`` (Canarias), look up the province
    using ``CANARIAS_ZONE_TO_PROVINCE``; otherwise digits 2-3 are the
    INE code.  Returns empty string for unparseable codes.
    """
    if not zone_code:
        return ""
    # Strip ALL non-digit characters (handles leading letters like "ES")
    digits = re.sub(r"[^0-9]", "", zone_code)
    if len(digits) < 2:
        return ""
    if len(digits) < 4:
        return digits[:2].zfill(2)

    ccaa = digits[0:2]
    if ccaa == "65":
        zone_key = digits[2:4]
        return CANARIAS_ZONE_TO_PROVINCE.get(zone_key, "35")

    ine = digits[2:4]
    # Validate INE code is in range 01-52
    try:
        code_int = int(ine)
        if 1 <= code_int <= 52:
            return ine
    except ValueError:
        pass
    return ""


def _extract_tag(xml: str, tag: str) -> str:
    """Extract the text content of the first occurrence of *tag*."""
    m = re.search(rf"<{tag}[^>]*>(.*?)</{tag}>", xml, re.DOTALL)
    return m.group(1).strip() if m else ""


def _extract_all_blocks(xml: str, tag: str) -> list[str]:
    """Return all ``<tag>...</tag>`` blocks from *xml*."""
    return re.findall(rf"<{tag}[^>]*>.*?</{tag}>", xml, re.DOTALL)


def parse_cap_xml(xml_text: str) -> list[dict[str, Any]]:
    """Parse a CAP XML document into a list of alert dicts."""
    alerts: list[dict[str, Any]] = []

    alert_blocks = _extract_all_blocks(xml_text, "alert")
    if not alert_blocks:
        # Entire document may be a single <alert>
        alert_blocks = [xml_text]

    for alert_xml in alert_blocks:
        identifier = _extract_tag(alert_xml, "identifier")
        sender = _extract_tag(alert_xml, "sender")
        sent = _extract_tag(alert_xml, "sent")

        info_blocks = _extract_all_blocks(alert_xml, "info")
        # Only process the first <info> block per alert to avoid duplicates
        # from multilingual CAP alerts (Spanish, English, etc.)
        for info_xml in info_blocks[:1]:
            raw_severity = _extract_tag(info_xml, "severity")
            severity = _SEVERITY_MAP.get(raw_severity, "green")
            event = _extract_tag(info_xml, "event")
            headline = _extract_tag(info_xml, "headline")
            description = _extract_tag(info_xml, "description")
            onset = _extract_tag(info_xml, "onset")
            expires = _extract_tag(info_xml, "expires")

            area_blocks = _extract_all_blocks(info_xml, "area")
            for area_idx, area_xml in enumerate(area_blocks):
                area_desc = _extract_tag(area_xml, "areaDesc")
                # geocode value is the zone code
                geocode_value = _extract_tag(area_xml, "value")
                ine_code = zone_code_to_ine_province(geocode_value) if geocode_value else ""

                unique_id = f"{identifier}_{area_idx}" if len(area_blocks) > 1 else identifier
                alerts.append({
                    "identifier": unique_id,
                    "sender": sender,
                    "sent": sent,
                    "severity": severity,
                    "event": event,
                    "headline": headline,
                    "description": description,
                    "area_desc": area_desc,
                    "geocode": ine_code,
                    "onset": onset,
                    "expires": expires,
                })

    return alerts


async def fetch_alerts(
    api_key: str, area: str = "esp"
) -> list[dict[str, Any]]:
    """Fetch the latest CAP alerts from AEMET.

    1. GET the metadata endpoint to obtain the ``datos`` URL.
    2. Fetch the ``datos`` URL which returns a TAR archive.
    3. Extract XML files from the TAR and parse CAP alerts.
    """
    from app.demo import is_demo_mode
    if is_demo_mode():
        from app.demo.mock_aemet_alerts import get_mock_aemet_alerts
        return get_mock_aemet_alerts()
    cache_key = f"alerts:{area}"
    now = time.time()
    if cache_key in _alert_cache and now - _alert_cache_ts.get(cache_key, 0) < _CACHE_TTL:
        return _alert_cache[cache_key]

    all_alerts: list[dict[str, Any]] = []

    try:
        meta_resp = await resilient_get(
            f"{_AEMET_BASE}/avisos_cap/ultimoelaborado/area/{area}",
            source="aemet",
            headers={"api_key": api_key},
        )
        meta_resp.raise_for_status()
        meta = meta_resp.json()
        datos_url = meta.get("datos")
        if not datos_url:
            logger.warning("AEMET metadata has no datos URL: %s", meta)
            return []

        tar_resp = await resilient_get(datos_url, source="aemet")
        tar_resp.raise_for_status()
        tar_bytes = tar_resp.content

        buf = io.BytesIO(tar_bytes)
        with tarfile.open(fileobj=buf, mode="r:*") as tf:
            for member in tf.getmembers():
                if not member.isfile():
                    continue
                f = tf.extractfile(member)
                if f is None:
                    continue
                xml_text = f.read().decode("utf-8", errors="replace")
                all_alerts.extend(parse_cap_xml(xml_text))

    except RetryableHTTPStatusError as e:
        # 429/5xx from AEMET is expected under rate-limiting; don't send to Sentry.
        logger.warning("AEMET rate-limited (HTTP %s) for area=%s", e.response.status_code, area)
        return _alert_cache.get(cache_key, [])
    except (
        httpx.HTTPStatusError,
        httpx.TransportError,
        httpx.TimeoutException,
        tarfile.ReadError,
        ValueError,
        KeyError,
    ):
        logger.exception("Failed to fetch AEMET alerts for area=%s", area)
        return _alert_cache.get(cache_key, [])

    from app.data.province_data import is_valid_province_code
    all_alerts = [a for a in all_alerts if is_valid_province_code(a.get("geocode"))]

    _alert_cache[cache_key] = all_alerts
    _alert_cache_ts[cache_key] = now
    return all_alerts


async def fetch_forecast(
    api_key: str, municipality_code: str
) -> dict[str, Any] | None:
    """Fetch AEMET weather forecast for a municipality.

    Returns the parsed JSON forecast or None on failure.
    """
    try:
        meta_resp = await resilient_get(
            f"{_AEMET_BASE}/prediccion/especifica/municipio/diaria/{municipality_code}",
            source="aemet",
            headers={"api_key": api_key},
        )
        meta_resp.raise_for_status()
        meta = meta_resp.json()
        datos_url = meta.get("datos")
        if not datos_url:
            return None

        data_resp = await resilient_get(datos_url, source="aemet")
        data_resp.raise_for_status()
        return data_resp.json()
    except (
        httpx.HTTPStatusError,
        RetryableHTTPStatusError,
        httpx.TransportError,
        httpx.TimeoutException,
        ValueError,
        KeyError,
    ):
        logger.exception(
            "Failed to fetch AEMET forecast for municipality %s", municipality_code
        )
        return None


async def fetch_hourly_forecast(
    api_key: str, municipality_code: str
) -> list[dict[str, Any]]:
    """Fetch hourly forecast per municipality from AEMET."""
    cache_key = f"hourly:{municipality_code}"
    now = time.time()
    if cache_key in _alert_cache and now - _alert_cache_ts.get(cache_key, 0) < _CACHE_TTL:
        return _alert_cache[cache_key]
    try:
        meta_resp = await resilient_get(
            f"{_AEMET_BASE}/prediccion/especifica/municipio/horaria/{municipality_code}",
            source="aemet",
            headers={"api_key": api_key},
        )
        meta_resp.raise_for_status()
        datos_url = meta_resp.json().get("datos")
        if not datos_url:
            return []
        data_resp = await resilient_get(datos_url, source="aemet")
        data_resp.raise_for_status()
        result = data_resp.json()
        _alert_cache[cache_key] = result
        _alert_cache_ts[cache_key] = now
        return result
    except (
        httpx.HTTPStatusError,
        RetryableHTTPStatusError,
        httpx.TransportError,
        httpx.TimeoutException,
        ValueError,
        KeyError,
    ):
        logger.exception("Failed to fetch AEMET hourly for %s", municipality_code)
        return _alert_cache.get(cache_key, [])


async def fetch_wildfire_index(api_key: str) -> dict[str, Any] | None:
    """Fetch official wildfire danger index."""
    cache_key = "fire_idx:national"
    now = time.time()
    if cache_key in _alert_cache and now - _alert_cache_ts.get(cache_key, 0) < _CACHE_TTL:
        return _alert_cache[cache_key]
    try:
        meta_resp = await resilient_get(
            f"{_AEMET_BASE}/incendios/mapas/nivel/diario",
            source="aemet",
            headers={"api_key": api_key},
        )
        meta_resp.raise_for_status()
        datos_url = meta_resp.json().get("datos")
        if not datos_url:
            return None
        data_resp = await resilient_get(datos_url, source="aemet")
        data_resp.raise_for_status()
        result = data_resp.json()
        _alert_cache[cache_key] = result
        _alert_cache_ts[cache_key] = now
        return result
    except (
        httpx.HTTPStatusError,
        RetryableHTTPStatusError,
        httpx.TransportError,
        httpx.TimeoutException,
        ValueError,
        KeyError,
    ):
        logger.exception("Failed to fetch AEMET wildfire index")
        return _alert_cache.get(cache_key)


async def fetch_weather_stations(api_key: str) -> list[dict[str, Any]]:
    """Fetch latest observations from all AEMET weather stations."""
    from app.demo import is_demo_mode
    if is_demo_mode():
        from app.demo.mock_weather_stations import get_mock_weather_stations
        return get_mock_weather_stations()
    cache_key = "stations:all"
    now = time.time()
    if cache_key in _alert_cache and now - _alert_cache_ts.get(cache_key, 0) < _CACHE_TTL:
        return _alert_cache[cache_key]
    try:
        meta_resp = await resilient_get(
            f"{_AEMET_BASE}/observacion/convencional/todas",
            source="aemet",
            headers={"api_key": api_key},
        )
        meta_resp.raise_for_status()
        datos_url = meta_resp.json().get("datos")
        if not datos_url:
            return []
        data_resp = await resilient_get(datos_url, source="aemet")
        data_resp.raise_for_status()
        result = data_resp.json()
        _alert_cache[cache_key] = result
        _alert_cache_ts[cache_key] = now
        return result
    except (
        httpx.HTTPStatusError,
        RetryableHTTPStatusError,
        httpx.TransportError,
        httpx.TimeoutException,
        ValueError,
        KeyError,
    ):
        logger.exception("Failed to fetch AEMET stations")
        return _alert_cache.get(cache_key, [])
