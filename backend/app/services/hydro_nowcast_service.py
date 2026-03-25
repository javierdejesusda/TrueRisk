"""Hydrological nowcasting service -- predicts gauge levels 0-6h ahead."""

from __future__ import annotations

import logging

from app.ml.models.catchment_response import CATCHMENTS, estimate_flow

logger = logging.getLogger(__name__)

# Map provinces to their primary catchment
PROVINCE_CATCHMENTS: dict[str, str] = {
    "46": "turia",       # Valencia
    "03": "segura",      # Alicante
    "30": "segura",      # Murcia
    "12": "jucar",       # Castellón
    "29": "guadalmedina", # Málaga
    "08": "llobregat",   # Barcelona
    "41": "guadalquivir", # Sevilla
    "14": "guadalquivir", # Córdoba
    "23": "guadalquivir", # Jaén
    "50": "ebro",        # Zaragoza
    "31": "ebro",        # Navarra
    "26": "ebro",        # La Rioja
}


async def compute_hydro_nowcast(
    province_code: str, precip_hourly: list[float]
) -> dict | None:
    """Compute hydrological nowcast for a province.

    Args:
        province_code: 2-digit province code
        precip_hourly: hourly precipitation forecast (mm) for next 48h

    Returns dict with flow predictions at T+1h, T+3h, T+6h or None if no
    catchment data.
    """
    catchment_key = PROVINCE_CATCHMENTS.get(province_code)
    if not catchment_key or catchment_key not in CATCHMENTS:
        return None

    catchment = CATCHMENTS[catchment_key]

    # Need at least 6 hours of precip data
    if len(precip_hourly) < 6:
        return None

    flow_predictions = estimate_flow(catchment, precip_hourly[:48])

    # Extract key horizons
    t1h = flow_predictions[1] if len(flow_predictions) > 1 else None
    t3h = flow_predictions[3] if len(flow_predictions) > 3 else None
    t6h = flow_predictions[6] if len(flow_predictions) > 6 else None

    # Determine flood risk level based on flow relative to base
    max_flow_6h = (
        max(p["estimated_flow_m3s"] for p in flow_predictions[:7])
        if flow_predictions
        else 0
    )
    risk_level = "normal"
    if max_flow_6h > catchment.base_flow_m3s * 10:
        risk_level = "critical"
    elif max_flow_6h > catchment.base_flow_m3s * 5:
        risk_level = "high"
    elif max_flow_6h > catchment.base_flow_m3s * 3:
        risk_level = "moderate"
    elif max_flow_6h > catchment.base_flow_m3s * 1.5:
        risk_level = "elevated"

    return {
        "province_code": province_code,
        "catchment": catchment.name,
        "catchment_area_km2": catchment.area_km2,
        "base_flow_m3s": catchment.base_flow_m3s,
        "risk_level": risk_level,
        "predictions": {
            "t1h": t1h,
            "t3h": t3h,
            "t6h": t6h,
        },
        "flow_series": flow_predictions[:24],  # 24h series for charting
    }
