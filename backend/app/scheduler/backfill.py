"""One-time historical backfill from Open-Meteo Archive API."""
from __future__ import annotations

import asyncio
import logging
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.data import open_meteo
from app.models.province import Province
from app.models.weather_daily_summary import WeatherDailySummary

logger = logging.getLogger(__name__)

BACKFILL_YEARS = 5


async def backfill_if_needed():
    """Check if backfill is needed and run it."""
    async with async_session() as db:
        count = await db.scalar(
            select(func.count()).select_from(WeatherDailySummary)
        )
        if count and count > 1000:
            logger.info(f"Backfill skipped: {count} daily summaries already exist")
            return
        await _run_backfill(db)


async def _run_backfill(db: AsyncSession):
    """Backfill 5 years of daily summaries for all provinces."""
    logger.info(f"Starting {BACKFILL_YEARS}-year historical backfill...")

    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=BACKFILL_YEARS * 365)

    result = await db.execute(select(Province))
    provinces = result.scalars().all()

    for idx, province in enumerate(provinces, 1):
        try:
            records = await open_meteo.fetch_historical_parsed(
                province.latitude,
                province.longitude,
                start.isoformat(),
                end.isoformat(),
            )

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

            # Bulk insert in chunks, skip duplicates via merge
            for i in range(0, len(batch), 500):
                chunk = batch[i:i + 500]
                for summary in chunk:
                    await db.merge(summary)
                await db.commit()

            logger.info(
                f"  Backfilled {province.name} ({idx}/{len(provinces)}): "
                f"{len(records)} days"
            )

            # Rate limit: 0.5s between provinces
            await asyncio.sleep(0.5)

        except Exception:
            logger.exception(f"  Failed to backfill {province.name}")
            await db.rollback()

    logger.info("Historical backfill complete.")
