"""Copernicus Emergency Management Service -- active disaster perimeters."""

from __future__ import annotations

import logging
import re
import time
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_TIMEOUT = 30.0
_FEED_URLS = [
    "https://emergency.copernicus.eu/mapping/activations-702/feed",
    "https://emergency.copernicus.eu/mapping/list-of-activations-702/feed",
    "https://emergency.copernicus.eu/mapping/feed",
]
_cache: list[dict[str, Any]] = []
_cache_ts: float = 0.0
_CACHE_TTL = 1800


async def fetch_active_emergencies() -> list[dict[str, Any]]:
    """Fetch active Copernicus EMS activations relevant to Spain."""
    global _cache, _cache_ts
    now = time.time()
    if _cache and now - _cache_ts < _CACHE_TTL:
        return _cache

    xml = None
    async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as client:
        for url in _FEED_URLS:
            try:
                resp = await client.get(url)
                if resp.status_code == 200 and "<item>" in resp.text:
                    xml = resp.text
                    break
            except Exception:
                continue

    if not xml:
        logger.warning("Copernicus EMS feed unavailable — no working feed URL found")
        _cache_ts = now  # avoid hammering
        return _cache or []

    try:
        items = re.findall(r"<item>(.*?)</item>", xml, re.DOTALL)
        emergencies = []
        spain_keywords = ["spain", "espana", "españa", "esp", "iberian"]

        for item_xml in items:
            title_m = re.search(r"<title>(.*?)</title>", item_xml)
            link_m = re.search(r"<link>(.*?)</link>", item_xml)
            desc_m = re.search(r"<description>(.*?)</description>", item_xml, re.DOTALL)
            date_m = re.search(r"<pubDate>(.*?)</pubDate>", item_xml)

            title = title_m.group(1) if title_m else ""
            desc = desc_m.group(1).strip() if desc_m else ""
            combined = (title + " " + desc).lower()

            if not any(kw in combined for kw in spain_keywords):
                continue

            emergencies.append({
                "title": title,
                "link": link_m.group(1) if link_m else "",
                "description": desc,
                "pub_date": date_m.group(1) if date_m else "",
            })

        _cache = emergencies
        _cache_ts = now
        return emergencies
    except Exception:
        logger.exception("Failed to parse Copernicus EMS feed")
        return _cache or []
