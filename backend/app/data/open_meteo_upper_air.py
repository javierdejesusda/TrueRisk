"""Upper-atmosphere data from Open-Meteo for DANA detection.

Fetches CAPE (Convective Available Potential Energy), surface pressure,
and hourly precipitation forecasts -- key precursors for DANA events.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.data._http import resilient_get, RetryableHTTPStatusError

logger = logging.getLogger(__name__)

_BASE_URL = "https://api.open-meteo.com/v1/forecast"


async def fetch_upper_air(lat: float, lon: float) -> dict[str, Any]:
    """Fetch CAPE, precipitable water, and hourly precip forecast.

    Returns a dict with current and forecast upper-air values useful for
    DANA compound event detection and nowcasting.
    """
    params: dict[str, str | float | int] = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "cape,precipitation,surface_pressure",
        "current": "cape,precipitation,surface_pressure",
        "forecast_days": 2,
        "timezone": "auto",
    }

    try:
        resp = await resilient_get(
            _BASE_URL,
            source="open_meteo_upper_air",
            params=params,
        )
        resp.raise_for_status()
        data = resp.json()

        current = data.get("current", {})
        hourly = data.get("hourly", {})

        precip_hourly = hourly.get("precipitation", [])
        cape_hourly = hourly.get("cape", [])
        pressure_hourly = hourly.get("surface_pressure", [])

        precip_6h = sum(precip_hourly[:6]) if len(precip_hourly) >= 6 else 0.0
        precip_24h = sum(precip_hourly[:24]) if len(precip_hourly) >= 24 else 0.0

        cape_max_6h = max(cape_hourly[:6]) if len(cape_hourly) >= 6 else 0.0

        if len(pressure_hourly) >= 7:
            pressure_change_forecast = pressure_hourly[6] - pressure_hourly[0]
        else:
            pressure_change_forecast = 0.0

        return {
            "cape_current": current.get("cape", 0.0) or 0.0,
            "cape_max_6h": cape_max_6h,
            "precip_forecast_6h": precip_6h,
            "precip_forecast_24h": precip_24h,
            "pressure_change_forecast_6h": pressure_change_forecast,
            "precip_hourly": precip_hourly[:48],
            "cape_hourly": cape_hourly[:48],
            "pressure_hourly": pressure_hourly[:48],
        }
    except (
        httpx.HTTPStatusError,
        RetryableHTTPStatusError,
        httpx.TransportError,
        httpx.TimeoutException,
        ValueError,
        KeyError,
    ):
        logger.exception(
            "Failed to fetch upper-air data for (%s, %s)", lat, lon
        )
        return {
            "cape_current": 0.0,
            "cape_max_6h": 0.0,
            "precip_forecast_6h": 0.0,
            "precip_forecast_24h": 0.0,
            "pressure_change_forecast_6h": 0.0,
            "precip_hourly": [],
            "cape_hourly": [],
            "pressure_hourly": [],
        }
