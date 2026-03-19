"""One-time historical backfill from Open-Meteo Archive API."""
from __future__ import annotations

import asyncio
import logging
from datetime import date, timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.data import open_meteo
from app.models.province import Province
from app.models.weather_daily_summary import WeatherDailySummary

logger = logging.getLogger(__name__)

BACKFILL_YEARS = 5


async def backfill_if_needed():
    """Check if backfill is needed and run it for provinces missing data."""
    async with async_session() as db:
        # Check per-province: find provinces that have fewer than 365 daily summaries
        result = await db.execute(select(Province))
        all_provinces = {p.ine_code for p in result.scalars().all()}

        counts_result = await db.execute(
            select(
                WeatherDailySummary.province_code,
                func.count().label("cnt"),
            ).group_by(WeatherDailySummary.province_code)
        )
        counts = {row[0]: row[1] for row in counts_result.all()}

        missing = [
            code for code in all_provinces
            if counts.get(code, 0) < 365
        ]

        if not missing:
            total = sum(counts.values())
            logger.info(f"Backfill skipped: all {len(all_provinces)} provinces have sufficient daily data ({total} total records)")
            return

        logger.info(f"Backfill needed for {len(missing)} provinces (of {len(all_provinces)} total)")
        await _run_backfill(db, province_codes=missing)


async def _run_backfill(db: AsyncSession, province_codes: list[str] | None = None):
    """Backfill 5 years of daily summaries for specified (or all) provinces."""
    logger.info(f"Starting {BACKFILL_YEARS}-year historical backfill...")

    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=BACKFILL_YEARS * 365)

    result = await db.execute(select(Province))
    all_provinces = result.scalars().all()

    if province_codes is not None:
        target_set = set(province_codes)
        provinces = [p for p in all_provinces if p.ine_code in target_set]
    else:
        provinces = list(all_provinces)

    logger.info(f"Backfilling {len(provinces)} provinces from {start} to {end}")

    for idx, province in enumerate(provinces, 1):
        try:
            records = await open_meteo.fetch_historical_parsed(
                province.latitude,
                province.longitude,
                start.isoformat(),
                end.isoformat(),
            )

            if not records:
                logger.warning(f"  No data returned for {province.name} ({idx}/{len(provinces)})")
                await asyncio.sleep(3)
                continue

            # Delete any partial existing data for this province before re-inserting
            await db.execute(
                delete(WeatherDailySummary).where(
                    WeatherDailySummary.province_code == province.ine_code
                )
            )
            await db.flush()

            batch = []
            for r in records:
                d = date.fromisoformat(r["date"]) if isinstance(r["date"], str) else r["date"]
                batch.append(WeatherDailySummary(
                    province_code=province.ine_code,
                    date=d,
                    temperature_max=r.get("temperature_max") or 0.0,
                    temperature_min=r.get("temperature_min") or 0.0,
                    temperature_avg=(
                        ((r.get("temperature_max") or 0) + (r.get("temperature_min") or 0)) / 2
                    ),
                    humidity_avg=0.0,  # Archive API doesn't provide humidity
                    humidity_min=0.0,
                    precipitation_sum=r.get("precipitation_sum") or 0.0,
                    wind_speed_max=r.get("wind_speed_max") or 0.0,
                    wind_speed_avg=0.0,  # Not available in daily archive
                    wind_gusts_max=None,
                    pressure_avg=None,
                    soil_moisture_avg=r.get("soil_moisture_avg"),
                    uv_index_max=r.get("uv_index_max"),
                    cloud_cover_avg=None,
                    source="archive",
                ))

            for i in range(0, len(batch), 500):
                chunk = batch[i:i + 500]
                db.add_all(chunk)
                await db.commit()

            logger.info(
                f"  Backfilled {province.name} ({idx}/{len(provinces)}): "
                f"{len(records)} days"
            )

            # Rate limit: 3s between provinces to avoid 429s
            await asyncio.sleep(3)

        except Exception:
            logger.exception(f"  Failed to backfill {province.ine_code} ({idx}/{len(provinces)})")
            await db.rollback()

    logger.info("Historical backfill complete.")
