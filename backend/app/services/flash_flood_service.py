"""Flash flood detection service - monitors river gauges and generates alerts."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.saih_realtime import fetch_all_basin_flows
from app.models.alert import Alert
from app.models.river_gauge import RiverGauge, RiverReading

logger = logging.getLogger(__name__)

# Cache of previous gauge readings for rate-of-change detection.
# Keys are gauge_id strings; values are dicts with "flow_m3s".
_previous_readings: dict[str, dict] = {}


@dataclass
class FloodAlert:
    gauge_id: str
    gauge_name: str
    river_name: str
    basin: str
    province_code: str
    flow_m3s: float
    threshold_exceeded: str  # "P90", "P95", "P99"
    severity: int  # 3 for P90, 4 for P95, 5 for P99
    message: str


async def check_flash_flood_conditions(db: AsyncSession) -> list[FloodAlert]:
    """Check all active gauges for flow exceedances.

    Returns list of FloodAlert for gauges exceeding thresholds.
    """
    # 1. Fetch current flows from all basins
    flows = await fetch_all_basin_flows()

    # 2. Load gauge thresholds from DB
    gauge_thresholds = await _load_gauge_thresholds(db)

    # 3. Check each flow against thresholds
    alerts: list[FloodAlert] = []
    for flow_data in flows:
        gauge_id = flow_data.get("gauge_id", "")
        current_flow = flow_data.get("flow_m3s", 0)
        if not current_flow or current_flow <= 0:
            continue

        thresholds = gauge_thresholds.get(gauge_id)
        if not thresholds:
            continue

        province = thresholds.get("province_code", "")
        gauge_name = flow_data.get("name", "") or thresholds.get("name", gauge_id)
        river_name = flow_data.get("river", "") or thresholds.get("river_name", "")
        basin = flow_data.get("basin", "")

        # Check against thresholds (highest first)
        if thresholds.get("p99") and current_flow >= thresholds["p99"]:
            alerts.append(FloodAlert(
                gauge_id=gauge_id,
                gauge_name=gauge_name,
                river_name=river_name,
                basin=basin,
                province_code=province,
                flow_m3s=current_flow,
                threshold_exceeded="P99",
                severity=5,
                message=(
                    f"CRITICAL: Flow at {gauge_name} has reached "
                    f"{current_flow:.1f} m\u00b3/s, exceeding the P99 threshold. "
                    f"Extreme flood risk."
                ),
            ))
        elif thresholds.get("p95") and current_flow >= thresholds["p95"]:
            alerts.append(FloodAlert(
                gauge_id=gauge_id,
                gauge_name=gauge_name,
                river_name=river_name,
                basin=basin,
                province_code=province,
                flow_m3s=current_flow,
                threshold_exceeded="P95",
                severity=4,
                message=(
                    f"WARNING: Flow at {gauge_name} has reached "
                    f"{current_flow:.1f} m\u00b3/s, exceeding the P95 threshold. "
                    f"High flood risk."
                ),
            ))
        elif thresholds.get("p90") and current_flow >= thresholds["p90"]:
            alerts.append(FloodAlert(
                gauge_id=gauge_id,
                gauge_name=gauge_name,
                river_name=river_name,
                basin=basin,
                province_code=province,
                flow_m3s=current_flow,
                threshold_exceeded="P90",
                severity=3,
                message=(
                    f"ALERT: Flow at {gauge_name} has reached "
                    f"{current_flow:.1f} m\u00b3/s, exceeding the P90 threshold. "
                    f"Elevated flood risk."
                ),
            ))

    return alerts


async def process_flash_flood_alerts(db: AsyncSession) -> int:
    """Run flash flood check and create/update alerts in the database.

    - Creates new alerts for new exceedances
    - Avoids duplicates (don't re-alert for the same gauge within 6 hours)
    - Returns number of new alerts created
    """
    flood_alerts = await check_flash_flood_conditions(db)
    created_count = 0

    for fa in flood_alerts:
        # Check for existing recent alert for this gauge
        six_hours_ago = datetime.now(tz=timezone.utc) - timedelta(hours=6)
        existing = await db.execute(
            select(Alert).where(
                Alert.hazard_type == "flash_flood",
                Alert.province_code == fa.province_code,
                Alert.is_active == True,  # noqa: E712
                Alert.created_at >= six_hours_ago,
                Alert.title.contains(fa.gauge_name),
            )
        )
        if existing.scalar_one_or_none():
            continue  # Already alerted recently

        # Create new alert
        alert = Alert(
            severity=fa.severity,
            hazard_type="flash_flood",
            province_code=fa.province_code,
            title=f"Flash Flood Warning: {fa.river_name or fa.gauge_name} ({fa.threshold_exceeded})",
            description=fa.message,
            source="auto_detected",
            is_active=True,
            expires=datetime.now(tz=timezone.utc) + timedelta(hours=12),
        )
        db.add(alert)
        created_count += 1
        logger.warning(
            "Flash flood alert: %s at %s (%.1f m\u00b3/s, %s)",
            fa.gauge_name, fa.basin, fa.flow_m3s, fa.threshold_exceeded,
        )

    if created_count > 0:
        await db.commit()

    return created_count


async def store_river_readings(db: AsyncSession) -> int:
    """Fetch current flows and store as RiverReading records.

    Returns count of readings stored.
    """
    flows = await fetch_all_basin_flows()
    count = 0
    now = datetime.now(tz=timezone.utc)

    for flow in flows:
        flow_m3s = flow.get("flow_m3s")
        if flow_m3s is None:
            continue
        reading = RiverReading(
            gauge_id=flow.get("gauge_id", ""),
            flow_m3s=flow_m3s,
            level_m=flow.get("level_m"),
            recorded_at=now,
            source=flow.get("basin", "unknown"),
        )
        db.add(reading)
        count += 1

    if count > 0:
        await db.commit()

    return count


def detect_rapid_flow_increase(
    previous: dict, current: dict
) -> FloodAlert | None:
    """Detect rapid flow increase between two consecutive readings.

    Args:
        previous: Dict with "gauge_id" and "flow_m3s" from prior poll.
        current: Dict with "gauge_id" and "flow_m3s" from current poll.

    Returns:
        FloodAlert if flow increased >= 50%, else None.
        Severity 5 if increase >= 100%, severity 4 if >= 50%.
    """
    prev_flow = previous.get("flow_m3s", 0)
    curr_flow = current.get("flow_m3s", 0)
    gauge_id = current.get("gauge_id", "")

    if prev_flow <= 0 or curr_flow <= prev_flow:
        return None

    pct_increase = (curr_flow - prev_flow) / prev_flow

    if pct_increase < 0.5:
        return None

    severity = 5 if pct_increase >= 1.0 else 4
    threshold_label = "100%" if severity == 5 else "50%"

    return FloodAlert(
        gauge_id=gauge_id,
        gauge_name=gauge_id,
        river_name="",
        basin="",
        province_code="",
        flow_m3s=curr_flow,
        threshold_exceeded=f"RAPID_RISE_{threshold_label}",
        severity=severity,
        message=(
            f"RAPID RISE: Flow at {gauge_id} surged from "
            f"{prev_flow:.1f} to {curr_flow:.1f} m\u00b3/s "
            f"({pct_increase:.0%} increase). Flash flood risk."
        ),
    )


async def _load_gauge_thresholds(db: AsyncSession) -> dict:
    """Load gauge thresholds from DB. Returns {gauge_id: {p90, p95, p99, province_code, ...}}."""
    result = await db.execute(
        select(RiverGauge).where(RiverGauge.is_active == True)  # noqa: E712
    )
    gauges = result.scalars().all()
    return {
        g.gauge_id: {
            "p90": g.threshold_p90,
            "p95": g.threshold_p95,
            "p99": g.threshold_p99,
            "province_code": g.province_code,
            "name": g.name,
            "river_name": g.river_name,
        }
        for g in gauges
    }
