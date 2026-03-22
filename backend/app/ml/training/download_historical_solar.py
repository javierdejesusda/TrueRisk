"""Download historical solar irradiance from NASA POWER API.

Fetches daily ALLSKY_SFC_SW_DWN for each Spanish province centroid.
NASA POWER supports arbitrary date ranges (1981-present).

Runnable as: python -m app.ml.training.download_historical_solar
"""

from __future__ import annotations

import time

import httpx
import pandas as pd

from app.data.province_data import PROVINCES
from app.ml.training.config import END_DATE, RAW_DIR, START_DATE

SOLAR_DIR = RAW_DIR / "solar"
BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"


def download_province_solar(
    client: httpx.Client,
    code: str,
    lat: float,
    lon: float,
    retries: int = 3,
) -> pd.DataFrame | None:
    """Download daily solar irradiance for a province over the full date range."""
    start_fmt = START_DATE.replace("-", "")
    end_fmt = END_DATE.replace("-", "")

    for attempt in range(1, retries + 1):
        try:
            resp = client.get(
                BASE_URL,
                params={
                    "parameters": "ALLSKY_SFC_SW_DWN",
                    "community": "RE",
                    "longitude": lon,
                    "latitude": lat,
                    "start": start_fmt,
                    "end": end_fmt,
                    "format": "JSON",
                },
            )
            resp.raise_for_status()
            data = resp.json()

            params = data.get("properties", {}).get("parameter", {})
            solar = params.get("ALLSKY_SFC_SW_DWN", {})

            if not solar:
                print(f"    [WARN] No solar data returned for {code}")
                return None

            records = []
            for date_str, value in solar.items():
                if value == -999 or value is None:
                    continue
                records.append({
                    "date": pd.to_datetime(date_str, format="%Y%m%d"),
                    "solar_irradiance": float(value),
                })

            if not records:
                return None

            df = pd.DataFrame(records).sort_values("date").reset_index(drop=True)
            return df

        except (httpx.HTTPStatusError, httpx.RequestError) as e:
            wait = 2 ** attempt
            if attempt < retries:
                print(f"    [RETRY {attempt}/{retries}] {e} — waiting {wait}s")
                time.sleep(wait)
            else:
                print(f"    [FAIL] Province {code}: all {retries} attempts failed")

    return None


def main() -> None:
    SOLAR_DIR.mkdir(parents=True, exist_ok=True)
    codes = sorted(PROVINCES.keys())
    total = len(codes)

    print(f"Downloading solar irradiance for {total} provinces...")
    print(f"Date range: {START_DATE} to {END_DATE}")

    downloaded = 0
    with httpx.Client(timeout=120.0, follow_redirects=True) as client:
        for i, code in enumerate(codes):
            out_path = SOLAR_DIR / f"{code}.csv"
            if out_path.exists() and out_path.stat().st_size > 500:
                downloaded += 1
                print(f"  [{i + 1}/{total}] Province {code} — already exists, skipping")
                continue

            prov = PROVINCES[code]
            print(f"  [{i + 1}/{total}] Province {code} ({prov['name']})...", end=" ")

            df = download_province_solar(
                client, code, prov["latitude"], prov["longitude"]
            )
            if df is not None:
                df.to_csv(out_path, index=False)
                downloaded += 1
                print(f"{len(df)} days saved")
            else:
                print("NO DATA")

            time.sleep(2.0)

    print(f"\nDone: {downloaded}/{total} provinces saved to {SOLAR_DIR}")


if __name__ == "__main__":
    main()
