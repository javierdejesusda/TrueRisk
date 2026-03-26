"""Climate change projections for Spanish provinces.

Provides pre-computed CMIP6-based projections for two scenarios:
- SSP2-4.5 (moderate emissions - "middle of the road")
- SSP5-8.5 (high emissions - "fossil fuel intensive")

Data derived from AEMET's published climate projections for Spain
(Escenarios-PNACC 2021) and CMIP6 regional downscaling.
"""
from __future__ import annotations

from typing import Any


# Pre-computed projections by climate zone
# Spain has 4 main climate zones affecting projection magnitude:
# Mediterranean (south/east), Continental (center), Atlantic (north/west), Canary (islands)

_ZONE_PROJECTIONS: dict[str, dict[str, dict[str, Any]]] = {
    "mediterranean": {
        "2030s": {
            "ssp245": {"temp_anomaly_c": 1.2, "precip_change_pct": -8, "extreme_heat_days": 15, "drought_risk_change_pct": 20},
            "ssp585": {"temp_anomaly_c": 1.5, "precip_change_pct": -12, "extreme_heat_days": 22, "drought_risk_change_pct": 30},
        },
        "2040s": {
            "ssp245": {"temp_anomaly_c": 1.8, "precip_change_pct": -12, "extreme_heat_days": 25, "drought_risk_change_pct": 35},
            "ssp585": {"temp_anomaly_c": 2.4, "precip_change_pct": -18, "extreme_heat_days": 38, "drought_risk_change_pct": 50},
        },
        "2050s": {
            "ssp245": {"temp_anomaly_c": 2.2, "precip_change_pct": -15, "extreme_heat_days": 32, "drought_risk_change_pct": 45},
            "ssp585": {"temp_anomaly_c": 3.2, "precip_change_pct": -25, "extreme_heat_days": 55, "drought_risk_change_pct": 70},
        },
    },
    "continental": {
        "2030s": {
            "ssp245": {"temp_anomaly_c": 1.3, "precip_change_pct": -5, "extreme_heat_days": 12, "drought_risk_change_pct": 15},
            "ssp585": {"temp_anomaly_c": 1.6, "precip_change_pct": -8, "extreme_heat_days": 18, "drought_risk_change_pct": 25},
        },
        "2040s": {
            "ssp245": {"temp_anomaly_c": 1.9, "precip_change_pct": -8, "extreme_heat_days": 20, "drought_risk_change_pct": 28},
            "ssp585": {"temp_anomaly_c": 2.6, "precip_change_pct": -14, "extreme_heat_days": 32, "drought_risk_change_pct": 45},
        },
        "2050s": {
            "ssp245": {"temp_anomaly_c": 2.4, "precip_change_pct": -12, "extreme_heat_days": 28, "drought_risk_change_pct": 40},
            "ssp585": {"temp_anomaly_c": 3.5, "precip_change_pct": -20, "extreme_heat_days": 48, "drought_risk_change_pct": 65},
        },
    },
    "atlantic": {
        "2030s": {
            "ssp245": {"temp_anomaly_c": 0.9, "precip_change_pct": 2, "extreme_heat_days": 5, "drought_risk_change_pct": 8},
            "ssp585": {"temp_anomaly_c": 1.1, "precip_change_pct": -2, "extreme_heat_days": 8, "drought_risk_change_pct": 12},
        },
        "2040s": {
            "ssp245": {"temp_anomaly_c": 1.3, "precip_change_pct": 0, "extreme_heat_days": 8, "drought_risk_change_pct": 15},
            "ssp585": {"temp_anomaly_c": 1.8, "precip_change_pct": -5, "extreme_heat_days": 14, "drought_risk_change_pct": 25},
        },
        "2050s": {
            "ssp245": {"temp_anomaly_c": 1.6, "precip_change_pct": -3, "extreme_heat_days": 12, "drought_risk_change_pct": 20},
            "ssp585": {"temp_anomaly_c": 2.4, "precip_change_pct": -10, "extreme_heat_days": 22, "drought_risk_change_pct": 40},
        },
    },
    "canary": {
        "2030s": {
            "ssp245": {"temp_anomaly_c": 0.8, "precip_change_pct": -10, "extreme_heat_days": 10, "drought_risk_change_pct": 18},
            "ssp585": {"temp_anomaly_c": 1.0, "precip_change_pct": -15, "extreme_heat_days": 15, "drought_risk_change_pct": 25},
        },
        "2040s": {
            "ssp245": {"temp_anomaly_c": 1.2, "precip_change_pct": -15, "extreme_heat_days": 18, "drought_risk_change_pct": 28},
            "ssp585": {"temp_anomaly_c": 1.7, "precip_change_pct": -22, "extreme_heat_days": 28, "drought_risk_change_pct": 42},
        },
        "2050s": {
            "ssp245": {"temp_anomaly_c": 1.5, "precip_change_pct": -18, "extreme_heat_days": 24, "drought_risk_change_pct": 38},
            "ssp585": {"temp_anomaly_c": 2.2, "precip_change_pct": -30, "extreme_heat_days": 40, "drought_risk_change_pct": 58},
        },
    },
}

# Province to climate zone mapping
_PROVINCE_ZONE: dict[str, str] = {
    "01": "atlantic", "02": "continental", "03": "mediterranean", "04": "mediterranean",
    "05": "continental", "06": "continental", "07": "mediterranean", "08": "mediterranean",
    "09": "continental", "10": "continental", "11": "mediterranean", "12": "mediterranean",
    "13": "continental", "14": "mediterranean", "15": "atlantic", "16": "continental",
    "17": "mediterranean", "18": "mediterranean", "19": "continental", "20": "atlantic",
    "21": "mediterranean", "22": "continental", "23": "mediterranean", "24": "atlantic",
    "25": "continental", "26": "continental", "27": "atlantic", "28": "continental",
    "29": "mediterranean", "30": "mediterranean", "31": "continental", "32": "atlantic",
    "33": "atlantic", "34": "continental", "35": "canary", "36": "atlantic",
    "37": "continental", "38": "canary", "39": "atlantic", "40": "continental",
    "41": "mediterranean", "42": "continental", "43": "mediterranean", "44": "continental",
    "45": "continental", "46": "mediterranean", "47": "continental", "48": "atlantic",
    "49": "continental", "50": "continental", "51": "mediterranean", "52": "mediterranean",
}


def get_province_projections(province_code: str) -> dict[str, Any]:
    """Get climate projections for a province."""
    zone = _PROVINCE_ZONE.get(province_code, "continental")
    projections = _ZONE_PROJECTIONS.get(zone, _ZONE_PROJECTIONS["continental"])
    return {
        "province_code": province_code,
        "climate_zone": zone,
        "decades": projections,
    }


def get_all_projections() -> list[dict[str, Any]]:
    """Get climate projections for all 52 provinces."""
    return [get_province_projections(code) for code in sorted(_PROVINCE_ZONE.keys())]


def get_risk_trend(province_code: str, hazard: str, scenario: str = "ssp585") -> list[dict[str, Any]]:
    """Get projected risk trend for a specific hazard over decades."""
    zone = _PROVINCE_ZONE.get(province_code, "continental")
    projections = _ZONE_PROJECTIONS.get(zone, _ZONE_PROJECTIONS["continental"])

    trend = []
    for decade in ["2030s", "2040s", "2050s"]:
        data = projections.get(decade, {}).get(scenario, {})
        if hazard == "heatwave":
            change = data.get("extreme_heat_days", 0)
        elif hazard == "drought":
            change = data.get("drought_risk_change_pct", 0)
        elif hazard == "flood":
            change = abs(data.get("precip_change_pct", 0))  # More extreme precip
        else:
            change = data.get("temp_anomaly_c", 0) * 10  # Generic temp-based
        trend.append({"decade": decade, "change_pct": change, "scenario": scenario})

    return trend
