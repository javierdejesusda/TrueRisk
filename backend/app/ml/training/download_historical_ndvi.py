"""Download historical NDVI data from Copernicus Land WMS.

Fetches NDVI 300m v2 10-day composites for each Spanish province centroid,
then interpolates to daily resolution.

Runnable as: python -m app.ml.training.download_historical_ndvi
"""

from __future__ import annotations

import time
from datetime import date, timedelta
from pathlib import Path

import httpx
import pandas as pd

from app.data.province_data import PROVINCES
from app.ml.training.config import END_DATE, RAW_DIR, START_DATE

NDVI_DIR = RAW_DIR / "ndvi"
WMS_URL = "https://land.copernicus.vgt.vito.be/geoserver/wms"
LAYER = "cgls:ndvi300_v2_global"


def _composite_dates(start: str, end: str) -> list[date]:
    """Generate NDVI composite dates (1st, 11th, 21st of each month)."""
    d = date.fromisoformat(start)
    end_d = date.fromisoformat(end)
    dates = []
    while d <= end_d:
        for day in (1, 11, 21):
            try:
                cd = d.replace(day=day)
            except ValueError:
                continue
            if date.fromisoformat(start) <= cd <= end_d:
                dates.append(cd)
        d = (d.replace(day=28) + timedelta(days=4)).replace(day=1)
    return sorted(set(dates))


def fetch_ndvi_for_date(
    client: httpx.Client,
    lat: float,
    lon: float,
    dt: date,
    retries: int = 3,
) -> float | None:
    """Fetch NDVI value at a point for a specific date via WMS GetFeatureInfo."""
    time_str = dt.strftime("%Y-%m-%dT00:00:00.000Z")
    for attempt in range(1, retries + 1):
        try:
            resp = client.get(
                WMS_URL,
                params={
                    "service": "WMS",
                    "request": "GetFeatureInfo",
                    "layers": LAYER,
                    "query_layers": LAYER,
                    "info_format": "application/json",
                    "crs": "EPSG:4326",
                    "width": 1,
                    "height": 1,
                    "bbox": f"{lon - 0.01},{lat - 0.01},{lon + 0.01},{lat + 0.01}",
                    "x": 0,
                    "y": 0,
                    "time": time_str,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            features = data.get("features", [])
            if features:
                props = features[0].get("properties", {})
                val = props.get("GRAY_INDEX") or props.get("ndvi")
                if val is not None and val != -999:
                    return float(val)
            return None
        except (httpx.HTTPStatusError, httpx.RequestError) as e:
            wait = 2 ** attempt
            if attempt < retries:
                print(f"    [RETRY {attempt}/{retries}] {e} — waiting {wait}s")
                time.sleep(wait)
    return None


def download_province_ndvi(
    client: httpx.Client,
    code: str,
    lat: float,
    lon: float,
    composites: list[date],
) -> pd.DataFrame | None:
    """Download all composite NDVI values for a province, interpolate to daily."""
    records = []
    for i, cd in enumerate(composites):
        val = fetch_ndvi_for_date(client, lat, lon, cd)
        if val is not None:
            records.append({"date": cd, "ndvi": val})
        time.sleep(0.5)

        if (i + 1) % 50 == 0:
            print(f"    [{i + 1}/{len(composites)}] composites fetched, {len(records)} valid")

    if not records:
        return None

    df = pd.DataFrame(records)
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date").sort_index()

    daily_range = pd.date_range(start=START_DATE, end=END_DATE, freq="D")
    df = df.reindex(daily_range)
    df.index.name = "date"
    df["ndvi"] = df["ndvi"].interpolate(method="linear").ffill().bfill()
    df = df.reset_index()
    return df


def main() -> None:
    NDVI_DIR.mkdir(parents=True, exist_ok=True)
    composites = _composite_dates(START_DATE, END_DATE)
    codes = sorted(PROVINCES.keys())
    total = len(codes)

    print(f"Downloading NDVI for {total} provinces, {len(composites)} composites each...")
    print(f"Date range: {START_DATE} to {END_DATE}")

    downloaded = 0
    with httpx.Client(timeout=60.0, follow_redirects=True) as client:
        for i, code in enumerate(codes):
            out_path = NDVI_DIR / f"{code}.csv"
            if out_path.exists() and out_path.stat().st_size > 500:
                downloaded += 1
                print(f"  [{i + 1}/{total}] Province {code} — already exists, skipping")
                continue

            prov = PROVINCES[code]
            print(f"  [{i + 1}/{total}] Province {code} ({prov['name']})...")

            df = download_province_ndvi(
                client, code, prov["latitude"], prov["longitude"], composites
            )
            if df is not None:
                df.to_csv(out_path, index=False)
                downloaded += 1
                print(f"    -> {len(df)} daily rows saved")
            else:
                print(f"    -> NO DATA (WMS may not support TIME param for this layer)")

    print(f"\nDone: {downloaded}/{total} provinces saved to {NDVI_DIR}")

    if downloaded == 0:
        print("\nFallback: generating seasonal NDVI proxy from latitude...")
        _generate_proxy_ndvi(codes)


def _generate_proxy_ndvi(codes: list[str]) -> None:
    """Generate seasonal NDVI proxy when WMS historical data unavailable.

    Uses latitude-based seasonal curve: higher NDVI in summer for temperate zones.
    """
    import numpy as np

    daily_range = pd.date_range(start=START_DATE, end=END_DATE, freq="D")
    for code in codes:
        prov = PROVINCES[code]
        lat = prov["latitude"]
        out_path = NDVI_DIR / f"{code}.csv"
        if out_path.exists() and out_path.stat().st_size > 500:
            continue

        doy = daily_range.dayofyear
        base = 0.45 if lat > 40 else 0.55 if lat > 37 else 0.35
        amplitude = 0.15 if prov.get("coastal") else 0.20
        ndvi = base + amplitude * np.sin(2 * np.pi * (doy - 80) / 365)
        ndvi = np.clip(ndvi, 0.1, 0.9)

        df = pd.DataFrame({"date": daily_range, "ndvi": ndvi})
        df.to_csv(out_path, index=False)
        print(f"  Proxy NDVI for {code}: {len(df)} rows")

    print("Proxy NDVI generation complete.")


if __name__ == "__main__":
    main()
