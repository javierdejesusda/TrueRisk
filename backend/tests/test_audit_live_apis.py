"""Live API audit tests -- hit real external endpoints (no mocks).

Each test is marked ``@pytest.mark.audit`` so it can be selected or excluded:

    pytest -m audit          # run only audit tests
    pytest -m "not audit"    # skip audit tests (CI default)

Tests that require API keys skip gracefully when the key is absent.
"""

import pytest

pytestmark = [pytest.mark.audit, pytest.mark.asyncio]


# -- helpers ------------------------------------------------------------------

def _clear_module_cache(module, attrs):
    """Reset in-memory caches so the test actually hits the network."""
    for attr in attrs:
        obj = getattr(module, attr, None)
        if obj is None:
            continue
        if isinstance(obj, dict):
            obj.clear()
        elif isinstance(obj, list):
            obj.clear()
    # Reset scalar timestamps
    for attr in attrs:
        if attr.endswith("_ts") and isinstance(getattr(module, attr, None), (int, float)):
            setattr(module, attr, 0.0)


# -- 1. Open-Meteo -----------------------------------------------------------

async def test_audit_open_meteo():
    from app.data import open_meteo
    _clear_module_cache(open_meteo, ["_cache", "_cache_ts"])
    result = await open_meteo.fetch_current(40.42, -3.70)
    assert isinstance(result, dict), f"Expected dict, got {type(result).__name__}"


# -- 2. AEMET ----------------------------------------------------------------

async def test_audit_aemet_alerts():
    from app.config import settings
    if not settings.aemet_api_key:
        pytest.skip("AEMET_API_KEY not set")
    from app.data import aemet_client
    _clear_module_cache(aemet_client, ["_alert_cache", "_alert_cache_ts"])
    result = await aemet_client.fetch_alerts(api_key=settings.aemet_api_key)
    assert isinstance(result, list), f"Expected list, got {type(result).__name__}"


# -- 3. NASA FIRMS ------------------------------------------------------------

async def test_audit_nasa_firms():
    from app.config import settings
    if not settings.firms_map_key:
        pytest.skip("FIRMS_MAP_KEY not set")
    from app.data import nasa_firms
    _clear_module_cache(nasa_firms, ["_cache", "_cache_ts"])
    result = await nasa_firms.fetch_active_fires(map_key=settings.firms_map_key)
    assert isinstance(result, list), f"Expected list, got {type(result).__name__}"


# -- 4. USGS Earthquake ------------------------------------------------------

async def test_audit_usgs_earthquake():
    from app.data import usgs_earthquake
    _clear_module_cache(usgs_earthquake, ["_cache", "_cache_ts"])
    result = await usgs_earthquake.fetch_recent_quakes()
    assert isinstance(result, list), f"Expected list, got {type(result).__name__}"


# -- 5. NASA POWER -----------------------------------------------------------

async def test_audit_nasa_power():
    from app.data import nasa_power
    _clear_module_cache(nasa_power, ["_cache", "_cache_ts"])
    result = await nasa_power.fetch_solar_and_agmet(40.42, -3.70)
    assert isinstance(result, dict), f"Expected dict, got {type(result).__name__}"


# -- 6. OpenAQ ---------------------------------------------------------------

async def test_audit_openaq():
    from app.data import openaq
    _clear_module_cache(openaq, ["_cache", "_cache_ts"])
    result = await openaq.fetch_air_quality(40.42, -3.70)
    assert isinstance(result, dict), f"Expected dict, got {type(result).__name__}"


# -- 7. IGN Seismic ----------------------------------------------------------

async def test_audit_ign_seismic():
    from app.data import ign_seismic
    _clear_module_cache(ign_seismic, ["_CACHE"])
    result = await ign_seismic.fetch_recent_quakes()
    assert isinstance(result, list), f"Expected list, got {type(result).__name__}"


# -- 8. Copernicus CAMS -------------------------------------------------------

async def test_audit_copernicus_cams():
    from app.data import copernicus_cams
    _clear_module_cache(copernicus_cams, ["_cache", "_cache_ts"])
    result = await copernicus_cams.fetch_air_quality_forecast(40.42, -3.70)
    assert isinstance(result, dict), f"Expected dict, got {type(result).__name__}"


# -- 9. Copernicus EFAS -------------------------------------------------------

async def test_audit_copernicus_efas():
    from app.data import copernicus_efas
    _clear_module_cache(copernicus_efas, ["_cache"])
    copernicus_efas._cache_ts = 0.0
    result = await copernicus_efas.fetch_efas_flood_indicators()
    assert isinstance(result, dict), f"Expected dict, got {type(result).__name__}"


# -- 10. Copernicus EMS -------------------------------------------------------

async def test_audit_copernicus_ems():
    from app.data import copernicus_ems
    _clear_module_cache(copernicus_ems, ["_cache"])
    copernicus_ems._cache_ts = 0.0
    result = await copernicus_ems.fetch_active_emergencies()
    assert isinstance(result, list), f"Expected list, got {type(result).__name__}"


# -- 11. Copernicus Land (NDVI) -----------------------------------------------

async def test_audit_copernicus_land():
    from app.data import copernicus_land
    _clear_module_cache(copernicus_land, ["_cache", "_cache_ts"])
    result = await copernicus_land.fetch_ndvi(40.42, -3.70)
    assert isinstance(result, dict), f"Expected dict, got {type(result).__name__}"


# -- 12. ECMWF Seasonal -------------------------------------------------------

async def test_audit_ecmwf_seasonal():
    from app.config import settings
    if not settings.cdsapi_key:
        pytest.skip("CDSAPI_KEY not set")
    from app.data import ecmwf_seasonal
    _clear_module_cache(ecmwf_seasonal, ["_cache", "_cache_ts"])
    result = await ecmwf_seasonal.fetch_seasonal_outlook(40.42, -3.70)
    assert isinstance(result, dict), f"Expected dict, got {type(result).__name__}"


# -- 13. INE Demographics -----------------------------------------------------

async def test_audit_ine_demographics():
    from app.data import ine_demographics
    _clear_module_cache(ine_demographics, ["_cache", "_cache_ts"])
    result = await ine_demographics.fetch_province_demographics("Madrid")
    assert isinstance(result, dict), f"Expected dict, got {type(result).__name__}"


# -- 14. REE Energy -----------------------------------------------------------

async def test_audit_ree_energy():
    from app.data import ree_energy
    _clear_module_cache(ree_energy, ["_cache", "_cache_ts"])
    result = await ree_energy.fetch_demand()
    assert isinstance(result, dict), f"Expected dict, got {type(result).__name__}"
