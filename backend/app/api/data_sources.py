"""API endpoints for supplementary data sources."""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db

router = APIRouter()


@router.get("/health")
async def get_data_health():
    """Return health status for all tracked data sources."""
    from app.services.data_health_service import health_tracker

    return health_tracker.get_all_statuses()


@router.get("/fire-hotspots")
async def get_fire_hotspots():
    """Active fire hotspots from NASA FIRMS."""
    from app.data.nasa_firms import fetch_active_fires

    return await fetch_active_fires()


@router.get("/air-quality/{province_code}")
async def get_air_quality(province_code: str, db: AsyncSession = Depends(get_db)):
    """Air quality from OpenAQ for a province."""
    from app.models.province import Province
    from app.data.openaq import fetch_air_quality

    province = await db.get(Province, province_code)
    if not province:
        raise HTTPException(status_code=404, detail="Province not found")
    return await fetch_air_quality(province.latitude, province.longitude)


@router.get("/earthquakes")
async def get_earthquakes():
    """Recent earthquakes near Spain from USGS."""
    from app.data.usgs_earthquake import fetch_recent_quakes

    return await fetch_recent_quakes()


@router.get("/energy")
async def get_energy():
    """Electricity demand and generation mix from REE."""
    from app.data.ree_energy import fetch_demand, fetch_generation_mix

    demand = await fetch_demand()
    generation = await fetch_generation_mix()
    return {**demand, **generation}


@router.get("/reservoirs")
async def get_reservoirs():
    """Reservoir levels across Spain from SAIH."""
    from app.data.saih import fetch_reservoir_levels

    return await fetch_reservoir_levels()


@router.get("/emergencies")
async def get_emergencies():
    """Active emergency activations from Copernicus EMS."""
    from app.data.copernicus_ems import fetch_active_emergencies

    return await fetch_active_emergencies()


@router.get("/demographics/{province_code}")
async def get_demographics(province_code: str, db: AsyncSession = Depends(get_db)):
    """Demographic data for a province from INE."""
    from app.models.province import Province
    from app.data.ine_demographics import fetch_province_demographics

    province = await db.get(Province, province_code)
    if not province:
        raise HTTPException(status_code=404, detail="Province not found")
    return await fetch_province_demographics(province.name)


@router.get("/vegetation/{province_code}")
async def get_vegetation(province_code: str, db: AsyncSession = Depends(get_db)):
    """NDVI vegetation health from Copernicus Land."""
    from app.models.province import Province
    from app.data.copernicus_land import fetch_ndvi

    province = await db.get(Province, province_code)
    if not province:
        raise HTTPException(status_code=404, detail="Province not found")
    return await fetch_ndvi(province.latitude, province.longitude)


@router.get("/solar/{province_code}")
async def get_solar(province_code: str, db: AsyncSession = Depends(get_db)):
    """Solar radiation data from NASA POWER."""
    from app.models.province import Province
    from app.data.nasa_power import fetch_solar_and_agmet

    province = await db.get(Province, province_code)
    if not province:
        raise HTTPException(status_code=404, detail="Province not found")
    return await fetch_solar_and_agmet(province.latitude, province.longitude)


@router.get("/seismic/{province_code}")
async def get_seismic(province_code: str, db: AsyncSession = Depends(get_db)):
    """Seismic exposure for a province from IGN."""
    from app.models.province import Province
    from app.data.ign_seismic import fetch_recent_quakes, compute_province_seismic_exposure

    province = await db.get(Province, province_code)
    if not province:
        raise HTTPException(status_code=404, detail="Province not found")
    quakes = await fetch_recent_quakes()
    return compute_province_seismic_exposure(province.latitude, province.longitude, quakes)


@router.get("/air-quality-forecast/{province_code}")
async def get_air_quality_forecast(province_code: str, db: AsyncSession = Depends(get_db)):
    """Air quality forecast from Copernicus CAMS."""
    from app.models.province import Province
    from app.data.copernicus_cams import fetch_air_quality_forecast

    province = await db.get(Province, province_code)
    if not province:
        raise HTTPException(status_code=404, detail="Province not found")
    return await fetch_air_quality_forecast(province.latitude, province.longitude)


@router.get("/seasonal/{province_code}")
async def get_seasonal(province_code: str, db: AsyncSession = Depends(get_db)):
    """Seasonal climate outlook from ECMWF."""
    from app.models.province import Province
    from app.data.ecmwf_seasonal import fetch_seasonal_outlook

    province = await db.get(Province, province_code)
    if not province:
        raise HTTPException(status_code=404, detail="Province not found")
    return await fetch_seasonal_outlook(province.latitude, province.longitude)


@router.get("/wildfire-index")
async def get_wildfire_index():
    """Wildfire danger index from AEMET."""
    from app.data.aemet_client import fetch_wildfire_index
    from app.config import settings

    if not settings.aemet_api_key:
        return {"error": "AEMET API key not configured"}
    return await fetch_wildfire_index(settings.aemet_api_key)


@router.get("/weather-stations")
async def get_weather_stations():
    """Latest observations from AEMET weather stations."""
    from app.data.aemet_client import fetch_weather_stations
    from app.config import settings

    if not settings.aemet_api_key:
        return []
    return await fetch_weather_stations(settings.aemet_api_key)


@router.get("/river-gauges")
async def get_river_gauges(
    basin: str | None = None,
    province: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """List all river gauges with latest readings.

    Combines live SAIH data with stored gauge metadata. Filters
    by basin or province code when provided.
    """
    from app.data.saih_realtime import fetch_all_basin_flows, fetch_river_flows
    from app.models.river_gauge import RiverGauge

    # Fetch live readings
    if basin:
        live = await fetch_river_flows(basin)
    else:
        live = await fetch_all_basin_flows()

    # Filter by province if requested
    if province:
        # Load known gauges for this province from DB
        stmt = select(RiverGauge).where(
            RiverGauge.province_code == province,
            RiverGauge.is_active.is_(True),
        )
        if basin:
            stmt = stmt.where(RiverGauge.basin == basin)
        result = await db.execute(stmt)
        db_gauges = {g.gauge_id: g for g in result.scalars().all()}

        # Merge DB metadata with live data
        gauges = []
        live_by_id = {r["gauge_id"]: r for r in live}
        for gid, gauge in db_gauges.items():
            entry = {
                "gauge_id": gauge.gauge_id,
                "name": gauge.name,
                "basin": gauge.basin,
                "river": gauge.river_name,
                "province_code": gauge.province_code,
                "lat": gauge.latitude,
                "lon": gauge.longitude,
                "threshold_p90": gauge.threshold_p90,
                "threshold_p95": gauge.threshold_p95,
                "threshold_p99": gauge.threshold_p99,
            }
            if gid in live_by_id:
                entry["flow_m3s"] = live_by_id[gid].get("flow_m3s")
                entry["level_m"] = live_by_id[gid].get("level_m")
            gauges.append(entry)

        # Also include live readings not yet in DB
        for reading in live:
            if reading["gauge_id"] not in db_gauges:
                gauges.append(reading)
        return gauges

    # No province filter — return live data directly
    return live


@router.get("/river-gauges/geojson")
async def get_river_gauges_geojson(
    basin: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return river gauges as GeoJSON FeatureCollection for map markers."""
    from app.data.saih_realtime import fetch_all_basin_flows, fetch_river_flows
    from app.models.river_gauge import RiverGauge

    if basin:
        live = await fetch_river_flows(basin)
    else:
        live = await fetch_all_basin_flows()

    # Also get DB gauges for thresholds
    stmt = select(RiverGauge).where(RiverGauge.is_active.is_(True))
    if basin:
        stmt = stmt.where(RiverGauge.basin == basin)
    result = await db.execute(stmt)
    db_gauges = {g.gauge_id: g for g in result.scalars().all()}

    features = []
    seen = set()
    for r in live:
        gid = r.get("gauge_id", "")
        if not gid or gid in seen:
            continue
        seen.add(gid)
        lat = r.get("lat")
        lon = r.get("lon")
        if lat is None or lon is None:
            continue
        db_g = db_gauges.get(gid)
        flow = r.get("flow_m3s")
        status = "normal"
        if db_g and flow:
            if db_g.threshold_p99 and flow >= db_g.threshold_p99:
                status = "critical"
            elif db_g.threshold_p95 and flow >= db_g.threshold_p95:
                status = "warning"
            elif db_g.threshold_p90 and flow >= db_g.threshold_p90:
                status = "alert"
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": {
                "gauge_id": gid,
                "name": r.get("name", ""),
                "river": r.get("river", ""),
                "basin": r.get("basin", ""),
                "flow_m3s": flow,
                "level_m": r.get("level_m"),
                "status": status,
            },
        })

    # Add DB-only gauges not in live data
    for gid, g in db_gauges.items():
        if gid not in seen:
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [g.longitude, g.latitude]},
                "properties": {
                    "gauge_id": gid,
                    "name": g.name,
                    "river": g.river_name or "",
                    "basin": g.basin,
                    "flow_m3s": None,
                    "level_m": None,
                    "status": "offline",
                },
            })

    return {
        "type": "FeatureCollection",
        "features": features,
    }


@router.get("/river-gauges/{gauge_id}/readings")
async def get_gauge_readings(
    gauge_id: str,
    hours: int = Query(default=24, le=168),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """Get recent flow readings for a gauge."""
    from datetime import datetime, timedelta

    from app.models.river_gauge import RiverReading

    cutoff = datetime.utcnow() - timedelta(hours=hours)
    stmt = (
        select(RiverReading)
        .where(
            RiverReading.gauge_id == gauge_id,
            RiverReading.recorded_at >= cutoff,
        )
        .order_by(RiverReading.recorded_at.desc())
    )
    result = await db.execute(stmt)
    readings = result.scalars().all()
    return [
        {
            "gauge_id": r.gauge_id,
            "flow_m3s": r.flow_m3s,
            "level_m": r.level_m,
            "recorded_at": r.recorded_at.isoformat(),
            "source": r.source,
        }
        for r in readings
    ]


@router.get("/fire-grid")
async def get_fire_grid():
    """Fire density grid computed from NASA FIRMS hotspots."""
    from app.data.nasa_firms import fetch_active_fires
    from app.services.fire_grid_service import build_fire_grid

    hotspots = await fetch_active_fires()
    cells = build_fire_grid(hotspots)
    return {
        "grid_resolution_deg": 0.5,
        "cell_count": len(cells),
        "cells": [
            {
                "center_lat": c.center_lat,
                "center_lon": c.center_lon,
                "fire_count": c.fire_count,
                "total_frp": c.total_frp,
                "max_confidence": c.max_confidence,
                "risk_level": c.risk_level,
            }
            for c in cells
        ],
    }


@router.get("/fire-proximity")
async def get_fire_proximity(
    lat: float,
    lon: float,
):
    """Compute fire proximity metrics for a specific location."""
    from app.data.nasa_firms import fetch_active_fires
    from app.services.fire_grid_service import compute_fire_proximity

    hotspots = await fetch_active_fires()
    result = compute_fire_proximity(lat, lon, hotspots)
    return {
        "nearest_fire_km": result.nearest_fire_km,
        "fire_count_50km": result.fire_count_50km,
        "fire_count_100km": result.fire_count_100km,
        "total_frp_100km": result.total_frp_100km,
        "fire_density_score": result.fire_density_score,
        "proximity_modifier": result.proximity_modifier,
    }


@router.get("/arpsi-zones")
async def get_arpsi_zones(
    province: str | None = None,
    return_period: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return ARPSI flood zones as GeoJSON FeatureCollection for map overlay."""
    from app.models.arpsi_flood_zone import ArpsiFloodZone

    stmt = select(ArpsiFloodZone)
    if province:
        stmt = stmt.where(ArpsiFloodZone.province_code == province)
    if return_period:
        stmt = stmt.where(ArpsiFloodZone.return_period == return_period)
    stmt = stmt.limit(500)

    try:
        result = await db.execute(stmt)
        zones = result.scalars().all()
    except Exception:
        zones = []

    features = []
    for z in zones:
        try:
            geometry = json.loads(z.geometry_geojson)
        except (json.JSONDecodeError, TypeError):
            continue
        features.append({
            "type": "Feature",
            "geometry": geometry,
            "properties": {
                "zone_id": z.zone_id,
                "zone_name": z.zone_name,
                "zone_type": z.zone_type,
                "return_period": z.return_period,
                "risk_level": z.risk_level,
                "area_km2": z.area_km2,
                "province_code": z.province_code,
            },
        })

    return {
        "type": "FeatureCollection",
        "features": features,
    }
