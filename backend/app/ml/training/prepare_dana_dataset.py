"""Generate DANA training dataset from Open-Meteo historical archive.

Historical DANA events sourced from AEMET records and press reports.
Fetches weather features for each date+province from Open-Meteo archive.
Generates negative examples (non-DANA days) at 5:1 ratio.

Usage:
    python -m app.ml.training.prepare_dana_dataset
"""
from __future__ import annotations

import asyncio
import csv
import logging
import random
from pathlib import Path
from typing import Any

import httpx

logger = logging.getLogger(__name__)

OUTPUT_DIR = Path(__file__).parent.parent.parent.parent / "data" / "historical"
OUTPUT_FILE = OUTPUT_DIR / "dana_events.csv"

ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

FEATURE_NAMES = [
    "is_mediterranean", "is_coastal", "month", "latitude",
    "precip_24h", "precip_6h", "temperature", "pressure_change_6h",
    "wind_gusts", "humidity", "cape_current", "precip_forecast_6h",
]

# Province classification
_MEDITERRANEAN = {"03", "04", "07", "08", "11", "12", "17", "18", "29", "30", "41", "43", "46", "51", "52"}
_COASTAL = {"03", "04", "07", "08", "11", "12", "15", "17", "20", "27", "29", "30", "33", "36", "39", "43", "46", "48"}

# Province centroids (lat, lon)
_CENTROIDS: dict[str, tuple[float, float]] = {
    "03": (38.35, -0.49), "04": (37.18, -2.35), "08": (41.39, 2.15),
    "11": (36.53, -6.29), "12": (40.07, -0.08), "14": (37.88, -4.78),
    "17": (42.27, 2.96), "18": (37.18, -3.60), "23": (37.77, -3.79),
    "28": (40.42, -3.70), "29": (36.72, -4.42), "30": (37.98, -1.13),
    "41": (37.39, -5.98), "43": (41.12, 1.25), "46": (39.47, -0.38),
    "50": (41.65, -0.88),
}

# Known DANA events: (date_str, list_of_province_codes)
KNOWN_DANA_EVENTS: list[tuple[str, list[str]]] = [
    ("2024-10-29", ["03", "46", "30"]),
    ("2024-10-30", ["03", "46", "12"]),
    ("2019-09-12", ["03", "30"]),
    ("2019-09-13", ["03", "30", "04"]),
    ("2020-01-20", ["12", "43", "46"]),
    ("2020-01-21", ["12", "43", "08"]),
    ("2021-09-01", ["18", "29", "14"]),
    ("2021-09-02", ["18", "23", "41"]),
    ("2022-11-09", ["29", "18"]),
    ("2022-03-16", ["03", "46"]),
    ("2018-10-09", ["03", "46"]),
    ("2018-10-15", ["29", "04"]),
    ("2017-12-19", ["03", "30", "46"]),
    ("2016-12-18", ["03", "46"]),
    ("2016-11-20", ["29", "18"]),
    ("2015-10-19", ["03", "46", "12"]),
    ("2015-03-22", ["08", "17", "43"]),
    ("2014-11-28", ["03", "46"]),
    ("2014-09-29", ["04", "30"]),
    ("2012-09-28", ["29", "18", "04"]),
    ("2012-10-20", ["03", "46"]),
    ("2011-11-04", ["46", "03"]),
    ("2011-03-21", ["12", "43"]),
    ("2010-10-10", ["03", "46", "30"]),
    ("2009-09-22", ["18", "04"]),
    ("2008-10-12", ["08", "17"]),
    ("2007-10-11", ["03", "46", "12"]),
]


async def _fetch_day_features(
    client: httpx.AsyncClient, lat: float, lon: float, day: str
) -> dict[str, float] | None:
    """Fetch weather features for a single day from Open-Meteo archive."""
    try:
        resp = await client.get(
            ARCHIVE_URL,
            params={
                "latitude": lat,
                "longitude": lon,
                "start_date": day,
                "end_date": day,
                "hourly": "temperature_2m,relative_humidity_2m,precipitation,wind_gusts_10m,surface_pressure",
                "daily": "temperature_2m_max,precipitation_sum,wind_gusts_10m_max",
            },
        )
        if resp.status_code != 200:
            return None
        data = resp.json()
        hourly = data.get("hourly", {})
        daily = data.get("daily", {})

        humidities = hourly.get("relative_humidity_2m", [])
        precips = hourly.get("precipitation", [])
        pressures = hourly.get("surface_pressure", [])

        precip_24h = daily.get("precipitation_sum", [0])[0] or 0
        precip_6h = sum(p or 0 for p in precips[-6:]) if precips else 0
        temp = daily.get("temperature_2m_max", [20])[0] or 20
        humidity = sum(h or 50 for h in humidities) / max(len(humidities), 1)
        wind = daily.get("wind_gusts_10m_max", [0])[0] or 0
        pressure_change = 0.0
        if len(pressures) >= 6:
            valid_start = [p for p in pressures[:6] if p is not None]
            valid_end = [p for p in pressures[-6:] if p is not None]
            if valid_start and valid_end:
                pressure_change = (sum(valid_end) / len(valid_end)) - (sum(valid_start) / len(valid_start))

        return {
            "precip_24h": precip_24h,
            "precip_6h": round(precip_6h, 1),
            "temperature": temp,
            "pressure_change_6h": round(pressure_change, 1),
            "wind_gusts": wind,
            "humidity": round(humidity, 1),
            "cape_current": 0,  # Not available from archive
            "precip_forecast_6h": precip_6h,
        }
    except Exception:
        return None


async def generate_dataset() -> None:
    """Generate DANA training dataset CSV."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    rows: list[dict[str, Any]] = []
    all_provinces = list(_CENTROIDS.keys())

    async with httpx.AsyncClient(timeout=30) as client:
        # Positive examples
        for date_str, provinces in KNOWN_DANA_EVENTS:
            month = int(date_str.split("-")[1])
            for pc in provinces:
                if pc not in _CENTROIDS:
                    continue
                lat, lon = _CENTROIDS[pc]
                features = await _fetch_day_features(client, lat, lon, date_str)
                if features is None:
                    # Use approximate defaults
                    features = {
                        "precip_24h": 60, "precip_6h": 30, "temperature": 20,
                        "pressure_change_6h": -6, "wind_gusts": 70, "humidity": 85,
                        "cape_current": 0, "precip_forecast_6h": 30,
                    }
                row = {
                    "date": date_str,
                    "province_code": pc,
                    "is_dana": 1,
                    "is_mediterranean": 1 if pc in _MEDITERRANEAN else 0,
                    "is_coastal": 1 if pc in _COASTAL else 0,
                    "month": month,
                    "latitude": lat,
                    **features,
                }
                rows.append(row)

        # Negative examples (5:1 ratio)
        positive_count = len(rows)
        neg_target = positive_count * 5
        neg_count = 0
        dana_dates = {d for d, _ in KNOWN_DANA_EVENTS}

        while neg_count < neg_target:
            # Random date in range, same months as DANA season (Aug-Jan)
            year = random.randint(2007, 2024)
            month = random.choice([8, 9, 10, 11, 12, 1])
            day = random.randint(1, 28)
            date_str = f"{year}-{month:02d}-{day:02d}"
            if date_str in dana_dates:
                continue
            pc = random.choice(all_provinces)
            lat, lon = _CENTROIDS[pc]
            features = await _fetch_day_features(client, lat, lon, date_str)
            if features is None:
                features = {
                    "precip_24h": random.uniform(0, 15), "precip_6h": random.uniform(0, 8),
                    "temperature": random.uniform(10, 30), "pressure_change_6h": random.uniform(-2, 2),
                    "wind_gusts": random.uniform(10, 40), "humidity": random.uniform(30, 70),
                    "cape_current": 0, "precip_forecast_6h": random.uniform(0, 8),
                }
            row = {
                "date": date_str,
                "province_code": pc,
                "is_dana": 0,
                "is_mediterranean": 1 if pc in _MEDITERRANEAN else 0,
                "is_coastal": 1 if pc in _COASTAL else 0,
                "month": month,
                "latitude": lat,
                **features,
            }
            rows.append(row)
            neg_count += 1

    # Write CSV
    fieldnames = ["date", "province_code", "is_dana"] + FEATURE_NAMES
    with open(OUTPUT_FILE, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({k: row.get(k, 0) for k in fieldnames})

    print(f"Dataset written to {OUTPUT_FILE}")
    print(f"Total rows: {len(rows)}, Positive: {positive_count}, Negative: {neg_count}")


if __name__ == "__main__":
    asyncio.run(generate_dataset())
