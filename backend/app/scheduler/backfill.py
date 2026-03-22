"""One-time historical backfill from Open-Meteo Archive API."""
from __future__ import annotations

import asyncio
import logging
from datetime import date, timedelta

from sqlalchemy import delete, select, func

from app.database import async_session
from app.data import open_meteo
from app.models.province import Province
from app.models.weather_daily_summary import WeatherDailySummary

logger = logging.getLogger(__name__)

BACKFILL_YEARS = 5


async def backfill_if_needed():
    """Check if backfill is needed and run it for provinces missing data."""
    async with async_session() as db:
        result = await db.execute(select(Province))
        all_provinces = result.scalars().all()
        province_list = [(p.ine_code, p.name, p.latitude, p.longitude) for p in all_provinces]

        counts_result = await db.execute(
            select(
                WeatherDailySummary.province_code,
                func.count().label("cnt"),
            ).group_by(WeatherDailySummary.province_code)
        )
        counts = {row[0]: row[1] for row in counts_result.all()}

    missing = [
        p for p in province_list
        if counts.get(p[0], 0) < 365
    ]

    if not missing:
        total = sum(counts.values())
        logger.info(f"Backfill skipped: all {len(province_list)} provinces have sufficient daily data ({total} total records)")
        return

    logger.info(f"Backfill needed for {len(missing)} provinces (of {len(province_list)} total)")
    await _run_backfill(missing)


async def _run_backfill(provinces: list[tuple[str, str, float, float]]):
    """Backfill 5 years of daily summaries. Each province uses its own DB session."""
    logger.info(f"Starting {BACKFILL_YEARS}-year historical backfill...")

    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=BACKFILL_YEARS * 365)

    logger.info(f"Backfilling {len(provinces)} provinces from {start} to {end}")

    for idx, (ine_code, name, lat, lon) in enumerate(provinces, 1):
        try:
            records = await open_meteo.fetch_historical_parsed(
                lat, lon, start.isoformat(), end.isoformat(),
            )

            if not records:
                logger.warning(f"  No data returned for {name} ({idx}/{len(provinces)})")
                await asyncio.sleep(3)
                continue

            async with async_session() as db:
                await db.execute(
                    delete(WeatherDailySummary).where(
                        WeatherDailySummary.province_code == ine_code
                    )
                )

                batch = []
                for r in records:
                    d = date.fromisoformat(r["date"]) if isinstance(r["date"], str) else r["date"]
                    batch.append(WeatherDailySummary(
                        province_code=ine_code,
                        date=d,
                        temperature_max=r.get("temperature_max") or 0.0,
                        temperature_min=r.get("temperature_min") or 0.0,
                        temperature_avg=(
                            ((r.get("temperature_max") or 0) + (r.get("temperature_min") or 0)) / 2
                        ),
                        humidity_avg=0.0,
                        humidity_min=0.0,
                        precipitation_sum=r.get("precipitation_sum") or 0.0,
                        wind_speed_max=r.get("wind_speed_max") or 0.0,
                        wind_speed_avg=0.0,
                        wind_gusts_max=None,
                        pressure_avg=None,
                        soil_moisture_avg=r.get("soil_moisture_avg"),
                        uv_index_max=r.get("uv_index_max"),
                        cloud_cover_avg=None,
                        source="archive",
                    ))

                for i in range(0, len(batch), 500):
                    db.add_all(batch[i:i + 500])

                await db.commit()

            logger.info(
                f"  Backfilled {name} ({idx}/{len(provinces)}): "
                f"{len(records)} days"
            )

            await asyncio.sleep(3)

        except Exception:
            logger.exception(f"  Failed to backfill {ine_code} ({idx}/{len(provinces)})")

    logger.info("Historical backfill complete.")
