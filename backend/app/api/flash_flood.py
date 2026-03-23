"""Flash flood monitoring API router."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.data.saih_realtime import SAIH_BASINS, fetch_all_basin_flows, fetch_river_flows
from app.models.alert import Alert
from app.models.river_gauge import RiverGauge, RiverReading
from app.schemas.flash_flood import (
    FloodAlertResponse,
    FloodCheckResult,
    GaugeStatusResponse,
    MonitoringStatusResponse,
    ReadingResponse,
)
from app.services.flash_flood_service import (
    check_flash_flood_conditions,
    process_flash_flood_alerts,
    store_river_readings,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/status", response_model=MonitoringStatusResponse)
async def monitoring_status(db: AsyncSession = Depends(get_db)):
    """Overview of the flash flood monitoring system."""
    # Count DB gauges
    gauge_count = await db.scalar(
        select(func.count()).select_from(RiverGauge).where(RiverGauge.is_active.is_(True))
    ) or 0

    # Active flash flood alerts
    alert_count = await db.scalar(
        select(func.count()).select_from(Alert).where(
            Alert.hazard_type == "flash_flood",
            Alert.is_active.is_(True),
        )
    ) or 0

    # Last reading timestamp
    last_reading = await db.scalar(
        select(func.max(RiverReading.recorded_at))
    )

    # Which basins have fetchers beyond the stub
    active_basins = [key for key in SAIH_BASINS]

    return MonitoringStatusResponse(
        basins_configured=len(SAIH_BASINS),
        basins_active=active_basins,
        total_gauges_in_db=gauge_count,
        active_flood_alerts=alert_count,
        last_reading_at=last_reading,
    )


@router.get("/alerts", response_model=list[FloodAlertResponse])
async def current_flood_alerts(db: AsyncSession = Depends(get_db)):
    """Check current river gauge conditions and return any threshold exceedances."""
    alerts = await check_flash_flood_conditions(db)
    return [
        FloodAlertResponse(
            gauge_id=a.gauge_id,
            gauge_name=a.gauge_name,
            river_name=a.river_name,
            basin=a.basin,
            province_code=a.province_code,
            flow_m3s=a.flow_m3s,
            threshold_exceeded=a.threshold_exceeded,
            severity=a.severity,
            message=a.message,
        )
        for a in alerts
    ]


@router.get("/gauges", response_model=list[GaugeStatusResponse])
async def list_gauges(
    basin: str | None = None,
    province: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """List all river gauges with live readings merged from SAIH data."""
    if basin:
        live = await fetch_river_flows(basin)
    else:
        live = await fetch_all_basin_flows()

    live_by_id = {r["gauge_id"]: r for r in live}

    # Build base query
    stmt = select(RiverGauge).where(RiverGauge.is_active.is_(True))
    if basin:
        stmt = stmt.where(RiverGauge.basin == basin)
    if province:
        stmt = stmt.where(RiverGauge.province_code == province)

    result = await db.execute(stmt)
    db_gauges = result.scalars().all()
    seen_ids: set[str] = set()
    gauges: list[GaugeStatusResponse] = []

    for g in db_gauges:
        seen_ids.add(g.gauge_id)
        live_data = live_by_id.get(g.gauge_id, {})
        gauges.append(GaugeStatusResponse(
            gauge_id=g.gauge_id,
            name=g.name,
            basin=g.basin,
            river=g.river_name,
            province_code=g.province_code,
            lat=g.latitude,
            lon=g.longitude,
            flow_m3s=live_data.get("flow_m3s"),
            level_m=live_data.get("level_m"),
            threshold_p90=g.threshold_p90,
            threshold_p95=g.threshold_p95,
            threshold_p99=g.threshold_p99,
        ))

    # Include live readings not yet registered in DB
    for reading in live:
        if reading["gauge_id"] not in seen_ids:
            gauges.append(GaugeStatusResponse(
                gauge_id=reading["gauge_id"],
                name=reading.get("name", ""),
                basin=reading.get("basin", ""),
                river=reading.get("river"),
                lat=reading.get("lat"),
                lon=reading.get("lon"),
                flow_m3s=reading.get("flow_m3s"),
                level_m=reading.get("level_m"),
            ))

    return gauges


@router.get("/gauges/{gauge_id}/readings", response_model=list[ReadingResponse])
async def gauge_readings(
    gauge_id: str,
    hours: int = Query(default=24, le=168),
    db: AsyncSession = Depends(get_db),
):
    """Get recent flow readings for a specific gauge."""
    from datetime import datetime, timedelta, timezone

    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    stmt = (
        select(RiverReading)
        .where(
            RiverReading.gauge_id == gauge_id,
            RiverReading.recorded_at >= cutoff,
        )
        .order_by(RiverReading.recorded_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/check", response_model=FloodCheckResult)
async def trigger_flood_check(db: AsyncSession = Depends(get_db)):
    """Manually trigger a flash flood check cycle.

    Stores current readings and processes alerts. Intended for
    admin/backoffice use.
    """
    conditions = await check_flash_flood_conditions(db)
    readings_count = await store_river_readings(db)
    alerts_count = await process_flash_flood_alerts(db)

    return FloodCheckResult(
        readings_stored=readings_count,
        alerts_created=alerts_count,
        flood_conditions=[
            FloodAlertResponse(
                gauge_id=a.gauge_id,
                gauge_name=a.gauge_name,
                river_name=a.river_name,
                basin=a.basin,
                province_code=a.province_code,
                flow_m3s=a.flow_m3s,
                threshold_exceeded=a.threshold_exceeded,
                severity=a.severity,
                message=a.message,
            )
            for a in conditions
        ],
    )
