"""API endpoints for supplementary data sources."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db

router = APIRouter()


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


@router.get("/river-gauges/{gauge_id}/readings")
async def get_gauge_readings(
    gauge_id: str,
    hours: int = Query(default=24, le=168),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """Get recent flow readings for a gauge."""
    from datetime import datetime, timedelta, timezone

    from app.models.river_gauge import RiverReading

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
