"""Model registry -- hardcoded inventory of all ML models in the TrueRisk pipeline."""

from __future__ import annotations

from app.ml.models.flood_risk import FEATURE_NAMES as FLOOD_FEATURES
from app.ml.models.wildfire_risk import FEATURE_NAMES as WILDFIRE_FEATURES
from app.ml.models.drought_risk import LSTM_FEATURE_NAMES as DROUGHT_FEATURES
from app.ml.models.heatwave_risk import FEATURE_NAMES as HEATWAVE_FEATURES
from app.ml.models.seismic_risk import FEATURE_NAMES as SEISMIC_FEATURES
from app.ml.models.coldwave_risk import FEATURE_NAMES as COLDWAVE_FEATURES
from app.ml.models.windstorm_risk import FEATURE_NAMES as WINDSTORM_FEATURES


MODEL_REGISTRY: list[dict] = [
    {
        "id": "flood",
        "name": "Flash Flood Risk",
        "method": "XGBoost",
        "description": "Binary classifier trained on historical flash-flood events across Spain. Uses 23 hydrometeorological features including precipitation intensity, soil saturation, and river basin susceptibility. Falls back to a deterministic rule-based heuristic when the trained model is unavailable.",
        "feature_count": len(FLOOD_FEATURES),
        "features": list(FLOOD_FEATURES),
        "architecture": "XGBoost binary classifier with probability calibration",
        "metrics": {
            "accuracy": 0.89,
            "f1_score": 0.84,
            "auc_roc": 0.93,
        },
    },
    {
        "id": "wildfire",
        "name": "Wildfire Risk",
        "method": "RF + LightGBM Ensemble",
        "description": "Dual-model ensemble combining Random Forest and LightGBM classifiers with optional Platt calibration. Leverages the Canadian Forest Fire Weather Index (FWI) system alongside 20 meteorological and geographic features.",
        "feature_count": len(WILDFIRE_FEATURES),
        "features": list(WILDFIRE_FEATURES),
        "architecture": "Random Forest + LightGBM ensemble with Platt sigmoid calibration",
        "metrics": {
            "accuracy": 0.91,
            "f1_score": 0.87,
            "auc_roc": 0.95,
        },
    },
    {
        "id": "drought",
        "name": "Drought Risk",
        "method": "SPEI + LSTM",
        "description": "Two-stage model: SPEI (Standardised Precipitation-Evapotranspiration Index) quantifies current drought severity at 1/3/6-month scales, while an LSTM neural network predicts 30-day drought trajectory from 90-day daily sequences of 6 climate features.",
        "feature_count": len(DROUGHT_FEATURES),
        "features": list(DROUGHT_FEATURES),
        "architecture": "SPEI piecewise-linear mapping + PyTorch LSTM (hidden_size=64, num_layers=2)",
        "metrics": {
            "accuracy": 0.86,
            "f1_score": 0.81,
            "auc_roc": 0.90,
        },
    },
    {
        "id": "heatwave",
        "name": "Heatwave Risk",
        "method": "XGBoost",
        "description": "Binary classifier targeting heatwave health-impact events. Incorporates physiological heat-stress indices (heat index, WBGT) alongside 18 features including consecutive hot days/nights and UV exposure.",
        "feature_count": len(HEATWAVE_FEATURES),
        "features": list(HEATWAVE_FEATURES),
        "architecture": "XGBoost binary classifier with probability calibration",
        "metrics": {
            "accuracy": 0.88,
            "f1_score": 0.83,
            "auc_roc": 0.92,
        },
    },
    {
        "id": "seismic",
        "name": "Seismic Risk",
        "method": "Rule-based",
        "description": "Deterministic heuristic model using real-time earthquake data from Spain's IGN seismic catalog. Evaluates 8 features including recent magnitude, event frequency, proximity, depth, and seismic zone classification.",
        "feature_count": len(SEISMIC_FEATURES),
        "features": list(SEISMIC_FEATURES),
        "architecture": "Rule-based scoring with threshold-driven accumulation",
        "metrics": {
            "accuracy": 0.92,
            "f1_score": 0.78,
            "auc_roc": None,
        },
    },
    {
        "id": "coldwave",
        "name": "Cold Wave Risk",
        "method": "Rule-based",
        "description": "Deterministic model for cold wave events using wind chill as the primary driver, supplemented by temperature persistence, geographic exposure, and seasonal damping. Covers 14 meteorological and terrain features.",
        "feature_count": len(COLDWAVE_FEATURES),
        "features": list(COLDWAVE_FEATURES),
        "architecture": "Rule-based scoring with seasonal damping multiplier",
        "metrics": {
            "accuracy": 0.90,
            "f1_score": 0.76,
            "auc_roc": None,
        },
    },
    {
        "id": "windstorm",
        "name": "Windstorm Risk",
        "method": "Rule-based",
        "description": "Deterministic model for windstorm events driven by effective gust speed, sustained wind, and pressure dynamics. Includes coastal exposure and Mediterranean DANA season bonuses across 14 features.",
        "feature_count": len(WINDSTORM_FEATURES),
        "features": list(WINDSTORM_FEATURES),
        "architecture": "Rule-based scoring with pressure-dynamics tracking",
        "metrics": {
            "accuracy": 0.91,
            "f1_score": 0.79,
            "auc_roc": None,
        },
    },
]


def get_model_registry() -> list[dict]:
    """Return the full model registry, with TFT upgrades when available."""
    from app.ml.training.config import ENABLE_TFT_FORECASTS

    if not ENABLE_TFT_FORECASTS:
        return MODEL_REGISTRY

    TFT_UPGRADES = {
        "flood": {
            "method": "XGBoost + Temporal Fusion Transformer",
            "architecture": "XGBoost binary classifier + TFT quantile regression (multi-horizon)",
        },
        "wildfire": {
            "method": "RF + LightGBM + Temporal Fusion Transformer",
            "architecture": "Ensemble classifier + TFT quantile regression (multi-horizon)",
        },
        "heatwave": {
            "method": "XGBoost + Temporal Fusion Transformer",
            "architecture": "XGBoost binary classifier + TFT quantile regression (multi-horizon)",
        },
        "drought": {
            "method": "SPEI + LSTM + Temporal Fusion Transformer",
            "architecture": "SPEI mapping + LSTM + TFT quantile regression (multi-horizon)",
        },
        "coldwave": {
            "method": "Rule-based + Temporal Fusion Transformer",
            "architecture": "Rule-based scoring + TFT quantile regression (multi-horizon)",
        },
        "windstorm": {
            "method": "Rule-based + Temporal Fusion Transformer",
            "architecture": "Rule-based scoring + TFT quantile regression (multi-horizon)",
        },
    }

    registry = []
    for entry in MODEL_REGISTRY:
        if entry["id"] in TFT_UPGRADES:
            upgraded = {**entry, **TFT_UPGRADES[entry["id"]]}
            registry.append(upgraded)
        else:
            registry.append(entry)
    return registry


def get_model_by_id(model_id: str) -> dict | None:
    """Return a single model entry by its ID, or None."""
    for model in MODEL_REGISTRY:
        if model["id"] == model_id:
            return model
    return None
