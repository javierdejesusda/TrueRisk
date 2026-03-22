"""Download 3 years of daily weather data from the Open-Meteo archive API.

Iterates all 52 Spanish provinces, saves each as a CSV in data/historical/raw/.
Rate-limits to 1 request/second (Open-Meteo fair use).
"""

from __future__ import annotations

import time

import httpx
import pandas as pd

from app.data.province_data import PROVINCES
from app.ml.training.config import (
    ARCHIVE_DAILY_PARAMS,
    ARCHIVE_URL,
    END_DATE,
    RAW_DIR,
    START_DATE,
)


def download_province(
    client: httpx.Client,
    code: str,
    lat: float,
    lon: float,
    retries: int = 3,
) -> pd.DataFrame | None:
    """Download daily archive data for a single province with retry logic."""
    for attempt in range(1, retries + 1):
        try:
            resp = client.get(
                ARCHIVE_URL,
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "start_date": START_DATE,
                    "end_date": END_DATE,
                    "daily": ARCHIVE_DAILY_PARAMS,
                    "timezone": "Europe/Madrid",
                },
            )
            resp.raise_for_status()
            data = resp.json()

            daily = data.get("daily", {})
            if not daily or "time" not in daily:
                print(f"  [WARN] No daily data for province {code}")
                return None

            df = pd.DataFrame(daily)
            df.rename(columns={"time": "date"}, inplace=True)
            df["province_code"] = code
            return df

        except (httpx.HTTPStatusError, httpx.RequestError) as e:
            wait = 10 * attempt
            print(f"  [RETRY {attempt}/{retries}] Province {code}: {e} — waiting {wait}s")
            time.sleep(wait)

    print(f"  [FAIL] Province {code}: all {retries} attempts failed")
    return None


def main() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    codes = sorted(PROVINCES.keys())
    total = len(codes)
    print(f"Downloading {total} provinces from {START_DATE} to {END_DATE}...")

    try:
        from tqdm import tqdm
        progress = tqdm(codes, desc="Downloading", unit="province")
    except ImportError:
        progress = codes
        print("(tqdm not installed — using plain output)")

    downloaded = 0
    with httpx.Client(timeout=60.0) as client:
        for code in progress:
            prov = PROVINCES[code]
            out_path = RAW_DIR / f"{code}.csv"

            if out_path.exists():
                size = out_path.stat().st_size
                if size > 1000:
                    downloaded += 1
                    if not hasattr(progress, "set_postfix"):
                        print(f"  [{downloaded}/{total}] Province {code} — already exists, skipping")
                    continue

            df = download_province(client, code, prov["latitude"], prov["longitude"])
            if df is not None:
                df.to_csv(out_path, index=False)
                downloaded += 1
                if hasattr(progress, "set_postfix"):
                    progress.set_postfix(ok=downloaded, rows=len(df))
                else:
                    print(f"  [{downloaded}/{total}] Province {code} ({prov['name']}): {len(df)} rows")

            # Rate limit: 5 seconds between requests (5-year requests are heavy)
            time.sleep(5.0)

    print(f"\nDone: {downloaded}/{total} provinces saved to {RAW_DIR}")


if __name__ == "__main__":
    main()
