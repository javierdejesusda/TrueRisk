"""API endpoints for supplementary data sources."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.config import settings

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
