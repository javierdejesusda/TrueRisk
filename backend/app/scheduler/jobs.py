"""APScheduler job configuration."""

import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.scheduler.pipeline import run_pipeline

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


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
    scheduler.start()
    logger.info("Scheduler started: pipeline runs every 6 hours")


def shutdown_scheduler():
    """Gracefully shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler shut down")
