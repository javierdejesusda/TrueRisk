"""IGN seismic catalog data client for Spain.

Fetches recent earthquake data from the Instituto Geografico Nacional (IGN)
and computes per-province seismic exposure features.
"""

from __future__ import annotations

import logging
import math
import time
from datetime import datetime, timedelta, timezone

import httpx

logger = logging.getLogger(__name__)

_CACHE: dict[str, tuple[float, list[dict]]] = {}
_CACHE_TTL = 600  # 10 minutes

IGN_URL = "https://www.ign.es/web/ign/portal/sis-catalogo-terremotos"


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in km between two lat/lon points."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def fetch_recent_quakes(days: int = 90) -> list[dict]:
    """Fetch recent earthquakes from IGN seismic catalog.

    Returns a list of dicts with keys: magnitude, depth_km, lat, lon, timestamp.
    Falls back to empty list on API error (seismic risk = 0 is a safe default).
    """
    cache_key = f"quakes_{days}"
    now = time.time()
    if cache_key in _CACHE:
        ts, data = _CACHE[cache_key]
        if now - ts < _CACHE_TTL:
            return data

    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                IGN_URL,
                params={
                    "fechaDesde": start_date.strftime("%Y-%m-%d"),
                    "fechaHasta": end_date.strftime("%Y-%m-%d"),
                    "latMin": "27.0",
                    "latMax": "44.0",
                    "lonMin": "-19.0",
                    "lonMax": "5.0",
                    "magMin": "1.5",
                    "formato": "json",
                },
            )
            resp.raise_for_status()
            raw = resp.json()
    except Exception:
        logger.warning("IGN seismic fetch failed, returning empty quake list")
        _CACHE[cache_key] = (now, [])
        return []

    quakes: list[dict] = []
    items = raw if isinstance(raw, list) else raw.get("terremotos", raw.get("data", []))
    for item in items:
        try:
            quakes.append(
                {
                    "magnitude": float(item.get("mag", item.get("magnitude", 0))),
                    "depth_km": float(item.get("prof", item.get("depth", 10))),
                    "lat": float(item.get("lat", item.get("latitude", 0))),
                    "lon": float(item.get("lon", item.get("longitude", 0))),
                    "timestamp": item.get("fecha", item.get("time", "")),
                }
            )
        except (TypeError, ValueError):
            continue

    _CACHE[cache_key] = (now, quakes)
    return quakes


def compute_province_seismic_exposure(
    province_lat: float,
    province_lon: float,
    quakes: list[dict],
    radius_km: float = 200.0,
) -> dict:
    """Compute seismic features for a province based on nearby earthquakes."""
    now = datetime.now(timezone.utc)
    nearby: list[dict] = []

    for q in quakes:
        dist = _haversine_km(province_lat, province_lon, q["lat"], q["lon"])
        if dist <= radius_km:
            nearby.append({**q, "distance_km": dist})

    # Split into 30-day and 90-day windows
    quakes_30d = []
    quakes_90d = nearby  # all are within 90 days by fetch
    for q in nearby:
        ts = q.get("timestamp", "")
        if isinstance(ts, str) and ts:
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                if (now - dt).days <= 30:
                    quakes_30d.append(q)
            except (ValueError, TypeError):
                pass

    max_mag_30d = max((q["magnitude"] for q in quakes_30d), default=0.0)
    max_mag_90d = max((q["magnitude"] for q in quakes_90d), default=0.0)
    count_30d = len(quakes_30d)

    nearest = min(nearby, key=lambda q: q["distance_km"]) if nearby else None
    nearest_dist = nearest["distance_km"] if nearest else 999.0
    nearest_mag = nearest["magnitude"] if nearest else 0.0
    nearest_depth = nearest["depth_km"] if nearest else 50.0

    # Cumulative seismic energy (simplified Gutenberg-Richter)
    cumulative_energy_30d = sum(
        10 ** (1.5 * q["magnitude"]) for q in quakes_30d
    )

    return {
        "max_magnitude_30d": max_mag_30d,
        "max_magnitude_90d": max_mag_90d,
        "earthquake_count_30d": count_30d,
        "nearest_quake_distance_km": nearest_dist,
        "nearest_quake_magnitude": nearest_mag,
        "nearest_quake_depth_km": nearest_depth,
        "cumulative_energy_30d": cumulative_energy_30d,
    }
