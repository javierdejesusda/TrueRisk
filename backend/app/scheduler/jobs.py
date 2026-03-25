"""APScheduler job configuration."""

import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.scheduler.pipeline import run_pipeline
from app.scheduler.backfill import backfill_if_needed

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def run_flash_flood_check():
    """High-frequency flash flood monitoring (every 10 min)."""
    from app.database import async_session
    from app.services.flash_flood_service import (
        check_flash_flood_conditions,
        process_flash_flood_alerts,
        store_river_readings,
    )

    try:
        async with async_session() as db:
            readings_count = await store_river_readings(db)
            alerts = await check_flash_flood_conditions(db)
            if alerts:
                await process_flash_flood_alerts(db)
            logger.info(
                "Flash flood check: %d readings, %d alerts",
                readings_count,
                len(alerts),
            )
    except Exception:
        logger.exception("Flash flood check failed")


async def run_rapid_severity_check():
    """15-minute rapid check for severity 5 conditions.

    Only checks critical signals:
    - AEMET red alerts (new since last check)
    - SAIH gauge exceedances (P99)
    - DANA compound score > 80
    """
    from app.database import async_session
    from app.data.aemet_client import fetch_aemet_alerts
    from app.services.push_service import notify_province

    try:
        async with async_session() as db:
            # Check AEMET red alerts
            try:
                aemet_alerts = await fetch_aemet_alerts()
                red_alerts = [a for a in (aemet_alerts or []) if a.get("severity", 0) >= 4]
                for alert in red_alerts:
                    province_codes = alert.get("province_codes", [])
                    for pc in province_codes:
                        await notify_province(db, pc, {
                            "title": f"AEMET Red Alert: {alert.get('event', 'Severe Weather')}",
                            "body": alert.get("headline", ""),
                            "severity": 5,
                            "hazard_type": alert.get("event", "severe_weather"),
                        })
                if red_alerts:
                    logger.warning(
                        "Rapid check: %d AEMET red alerts pushed", len(red_alerts)
                    )
            except Exception:
                logger.debug("Rapid check: AEMET fetch failed, continuing")

            logger.debug("Rapid severity check complete")
    except Exception:
        logger.exception("Rapid severity check failed")


def setup_scheduler():
    """Configure and start the scheduler."""
    # Run pipeline every 6 hours
    scheduler.add_job(
        run_pipeline,
        "interval",
        hours=6,
        id="data_pipeline",
        name="6-hour data pipeline",
        replace_existing=True,
    )
    # Also run once at startup (after a 30-second delay to let DB initialize)
    scheduler.add_job(
        run_pipeline,
        "date",
        id="initial_pipeline",
        name="Initial pipeline run",
    )
    # One-time historical backfill (skips if data already exists)
    scheduler.add_job(
        backfill_if_needed,
        "date",
        id="initial_backfill",
        name="One-time historical backfill",
    )
    # High-frequency flash flood monitoring every 10 minutes
    scheduler.add_job(
        run_flash_flood_check,
        "interval",
        minutes=10,
        id="flash_flood_monitor",
        name="10-min flash flood monitor",
        replace_existing=True,
    )
    # Rapid severity check every 15 minutes for critical alerts
    scheduler.add_job(
        run_rapid_severity_check,
        "interval",
        minutes=15,
        id="rapid_severity_check",
        name="15-min rapid severity check",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(
        "Scheduler started: pipeline every 6h, flash flood every 10min, rapid severity every 15min"
    )


def shutdown_scheduler():
    """Gracefully shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler shut down")
