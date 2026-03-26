"""Copernicus EFAS (European Flood Awareness System) data client.

Fetches flood forecasts from the CDS API including river discharge
and flood recurrence indicators for Spain.

EFAS provides pre-computed flood indicators that complement the
province-level flood model with continental-scale hydrological forecasts.
"""
from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_TIMEOUT = 60.0
_cache: dict[str, Any] = {}
_cache_ts: float = 0.0
_CACHE_TTL = 43200  # 12 hours — EFAS updates twice daily

# Spain bounding box
_SPAIN_BBOX = {"north": 44.0, "south": 36.0, "west": -10.0, "east": 4.0}

# Province centroids for matching EFAS grid to provinces
_PROVINCE_CENTROIDS: dict[str, tuple[float, float]] = {
    "01": (42.85, -2.67), "02": (38.99, -1.86), "03": (38.35, -0.49),
    "04": (37.18, -2.35), "05": (40.66, -4.68), "06": (38.88, -6.97),
    "07": (39.57, 2.65),  "08": (41.39, 2.15),  "09": (42.34, -3.70),
    "10": (39.47, -6.37), "11": (36.53, -6.29), "12": (40.07, -0.08),
    "13": (38.99, -3.93), "14": (37.88, -4.78), "15": (43.37, -8.40),
    "16": (40.07, -2.13), "17": (42.27, 2.96),  "18": (37.18, -3.60),
    "19": (40.63, -3.16), "20": (43.32, -1.98), "21": (37.26, -6.94),
    "22": (42.13, -0.41), "23": (37.77, -3.79), "24": (42.60, -5.57),
    "25": (41.62, 0.62),  "26": (42.47, -2.45), "27": (43.01, -7.56),
    "28": (40.42, -3.70), "29": (36.72, -4.42), "30": (37.98, -1.13),
    "31": (42.82, -1.65), "32": (42.34, -7.86), "33": (43.36, -5.85),
    "34": (42.01, -4.53), "35": (28.10, -15.41), "36": (42.43, -8.65),
    "37": (40.97, -5.66), "38": (28.47, -16.25), "39": (43.46, -3.81),
    "40": (41.07, -4.12), "41": (37.39, -5.98), "42": (41.76, -2.47),
    "43": (41.12, 1.25),  "44": (40.34, -1.11), "45": (39.86, -4.02),
    "46": (39.47, -0.38), "47": (41.65, -4.72), "48": (43.26, -2.93),
    "49": (41.51, -5.75), "50": (41.65, -0.88), "51": (35.89, -5.32),
    "52": (35.29, -2.94),
}


async def fetch_efas_flood_indicators() -> dict[str, dict[str, float]]:
    """Fetch EFAS flood indicators for Spanish provinces.

    Returns dict mapping province_code to {flood_recurrence, discharge_anomaly}.
    Uses Open-Meteo's flood API as a more accessible alternative to CDS direct.
    """
    cache_key = "efas_flood"
    import time
    now = time.time()
    if cache_key in _cache and now - _cache_ts < _CACHE_TTL:
        return _cache[cache_key]

    result: dict[str, dict[str, float]] = {}

    try:
        # Use Open-Meteo flood API which wraps GloFAS/EFAS data
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            # Batch provinces (Open-Meteo supports multi-location)
            codes = list(_PROVINCE_CENTROIDS.keys())
            batch_size = 50

            for start in range(0, len(codes), batch_size):
                batch_codes = codes[start:start + batch_size]
                lats = ",".join(str(_PROVINCE_CENTROIDS[c][0]) for c in batch_codes)
                lons = ",".join(str(_PROVINCE_CENTROIDS[c][1]) for c in batch_codes)

                resp = await client.get(
                    "https://flood-api.open-meteo.com/v1/flood",
                    params={
                        "latitude": lats,
                        "longitude": lons,
                        "daily": "river_discharge",
                        "forecast_days": 7,
                    },
                )
                if resp.status_code != 200:
                    logger.warning("EFAS/GloFAS API returned %d", resp.status_code)
                    continue

                data = resp.json()
                # Multi-location returns a list
                items = data if isinstance(data, list) else [data]

                for i, code in enumerate(batch_codes):
                    if i >= len(items):
                        break
                    item = items[i]
                    daily = item.get("daily", {})
                    discharges = daily.get("river_discharge", [])

                    if discharges:
                        valid = [d for d in discharges if d is not None and d > 0]
                        if valid:
                            max_discharge = max(valid)
                            mean_discharge = sum(valid) / len(valid)
                            # Estimate flood recurrence from discharge magnitude
                            # Higher discharge relative to mean = higher recurrence
                            anomaly = (max_discharge / mean_discharge - 1.0) if mean_discharge > 0 else 0.0
                            # Map to 0-1 scale (anomaly of 2+ is extreme)
                            flood_recurrence = min(1.0, anomaly / 2.0)
                        else:
                            flood_recurrence = 0.0
                            anomaly = 0.0
                    else:
                        flood_recurrence = 0.0
                        anomaly = 0.0

                    result[code] = {
                        "flood_recurrence": round(flood_recurrence, 3),
                        "discharge_anomaly": round(anomaly, 3),
                        "max_discharge_m3s": round(max_discharge, 1) if discharges and valid else 0.0,
                    }

        if result:
            _cache[cache_key] = result
            globals()["_cache_ts"] = now

    except Exception:
        logger.debug("EFAS/GloFAS fetch failed, returning empty")

    return result
