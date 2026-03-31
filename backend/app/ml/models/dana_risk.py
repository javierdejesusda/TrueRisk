"""DANA (Depresion Aislada en Niveles Altos) compound event detection model.

DANA is Spain's deadliest weather pattern -- a cut-off low that stalls over
the warm Mediterranean, feeding intense convection, extreme rainfall, wind,
and flash flooding simultaneously.  The Oct 2024 Valencia DANA killed 200+
people.

This model detects the *compound* nature of DANA events.  Individual signals
(heavy rain, strong wind, pressure drop) each contribute moderate risk, but
when 3+ signals fire simultaneously the score increases exponentially --
reflecting the real-world danger of compound events.

Key detection signals:
  - Mediterranean/coastal province during Sep-Nov (peak) or May-Dec (extended)
  - Extreme precipitation (>50mm/6h or >100mm/24h)
  - Rapid pressure drop (>6 hPa in 6 hours)
  - High wind gusts (>70 km/h)
  - High humidity (>75%)
  - Warm temperatures fueling convection (>18C)

Returns a score 0-100.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

FEATURE_NAMES = [
    "is_mediterranean",
    "is_coastal",
    "month",
    "latitude",
    "precip_24h",
    "precip_6h",
    "temperature",
    "pressure_change_6h",
    "wind_gusts",
    "humidity",
    "cape_current",
    "precip_forecast_6h",
]

_model = None

_MODEL_PATH = Path(__file__).parent.parent / "saved_models" / "dana_xgboost.joblib"


def _load_dana_model():
    """Lazy-load DANA XGBoost model if available."""
    global _model
    if _model is None and _MODEL_PATH.exists():
        try:
            import joblib
            _model = joblib.load(_MODEL_PATH)
            logger.info("Loaded DANA XGBoost model from %s", _MODEL_PATH)
        except Exception:
            logger.warning("Failed to load DANA model, using rule-based only")
    return _model


def predict_dana_risk(features: dict[str, Any]) -> float:
    """Return DANA compound event risk 0-100.

    Uses 60/40 ensemble of ML model + rule-based when trained model
    is available. Falls back to pure rule-based otherwise.
    """
    rule_score = _rule_based_dana(features)
    model = _load_dana_model()
    if model is not None:
        try:
            import numpy as np
            feature_values = np.array([[features.get(f, 0.0) or 0.0 for f in FEATURE_NAMES]])
            ml_prob = model.predict_proba(feature_values)[0, 1]
            ml_score = ml_prob * 100
            return round(0.6 * ml_score + 0.4 * rule_score, 1)
        except Exception:
            pass
    return rule_score


def get_trained_model():
    """Return the loaded DANA model or None."""
    return _load_dana_model()


def _rule_based_dana(f: dict[str, Any]) -> float:
    is_med = f.get("is_mediterranean", False)
    is_coastal = f.get("is_coastal", False)
    month = f.get("month", 6) or 6
    precip_24h = f.get("precip_24h", 0.0) or 0.0
    precip_6h = f.get("precip_6h", 0.0) or 0.0
    temperature = f.get("temperature", 15.0) or 15.0
    pressure_change = f.get("pressure_change_6h", 0.0) or 0.0
    wind_gusts = f.get("wind_gusts", 0.0) or 0.0
    humidity = f.get("humidity", 50.0) or 50.0

    # Convert boolean-like values
    if isinstance(is_med, (int, float)):
        is_med = bool(is_med)
    if isinstance(is_coastal, (int, float)):
        is_coastal = bool(is_coastal)

    # 1. Individual signal scores (each 0-20 range, total max ~100 raw)
    signal_scores: list[float] = []
    active_signals = 0

    # Signal 1: Extreme precipitation (24h)
    precip_24h_pts = 0.0
    if precip_24h > 200:
        precip_24h_pts = 20.0
    elif precip_24h > 100:
        precip_24h_pts = 15.0
    elif precip_24h > 50:
        precip_24h_pts = 10.0
    elif precip_24h > 20:
        precip_24h_pts = 5.0
    signal_scores.append(precip_24h_pts)
    if precip_24h_pts >= 10:
        active_signals += 1

    # Signal 2: Intense short-duration precipitation (6h)
    precip_6h_pts = 0.0
    if precip_6h > 100:
        precip_6h_pts = 15.0
    elif precip_6h > 50:
        precip_6h_pts = 10.0
    elif precip_6h > 25:
        precip_6h_pts = 5.0
    signal_scores.append(precip_6h_pts)
    if precip_6h_pts >= 10:
        active_signals += 1

    # Signal 3: Rapid pressure drop (negative = falling)
    pressure_pts = 0.0
    if pressure_change < -12:
        pressure_pts = 15.0
    elif pressure_change < -8:
        pressure_pts = 12.0
    elif pressure_change < -6:
        pressure_pts = 8.0
    elif pressure_change < -3:
        pressure_pts = 4.0
    signal_scores.append(pressure_pts)
    if pressure_pts >= 8:
        active_signals += 1

    # Signal 4: High wind gusts
    wind_pts = 0.0
    if wind_gusts > 120:
        wind_pts = 15.0
    elif wind_gusts > 90:
        wind_pts = 12.0
    elif wind_gusts > 70:
        wind_pts = 8.0
    elif wind_gusts > 50:
        wind_pts = 4.0
    signal_scores.append(wind_pts)
    if wind_pts >= 8:
        active_signals += 1

    # Signal 5: High humidity (moisture availability for convection)
    humidity_pts = 0.0
    if humidity > 90:
        humidity_pts = 10.0
    elif humidity > 80:
        humidity_pts = 7.0
    elif humidity > 75:
        humidity_pts = 5.0
    signal_scores.append(humidity_pts)
    if humidity_pts >= 5:
        active_signals += 1

    # Signal 6: CAPE (Convective Available Potential Energy)
    # High CAPE indicates strong convective instability -- a key DANA precursor
    cape = f.get("cape_current", 0.0) or 0.0
    cape_pts = 0.0
    if cape > 2500:
        cape_pts = 15.0
    elif cape > 1500:
        cape_pts = 10.0
    elif cape > 1000:
        cape_pts = 6.0
    elif cape > 500:
        cape_pts = 3.0
    signal_scores.append(cape_pts)
    if cape_pts >= 6:
        active_signals += 1

    # Signal 7: Forecast precipitation next 6h (imminent heavy rain)
    precip_forecast_6h = f.get("precip_forecast_6h", 0.0) or 0.0
    precip_forecast_pts = 0.0
    if precip_forecast_6h > 100:
        precip_forecast_pts = 15.0
    elif precip_forecast_6h > 50:
        precip_forecast_pts = 10.0
    elif precip_forecast_6h > 25:
        precip_forecast_pts = 6.0
    elif precip_forecast_6h > 10:
        precip_forecast_pts = 3.0
    signal_scores.append(precip_forecast_pts)
    if precip_forecast_pts >= 6:
        active_signals += 1

    # 2. Base score from individual signals
    base_score = sum(signal_scores)
    # 3. Compound amplification -- THIS is what makes DANA deadly
    #    3+ simultaneous signals => exponential risk increase
    if active_signals >= 5:
        compound_multiplier = 1.6
    elif active_signals >= 4:
        compound_multiplier = 1.4
    elif active_signals >= 3:
        compound_multiplier = 1.25
    else:
        compound_multiplier = 1.0

    score = base_score * compound_multiplier

    # 4. Geographic modifiers
    # Mediterranean provinces are DANA's primary target
    if is_med:
        score += 8
    # Coastal provinces face additional storm-surge / flash-flood risk
    if is_coastal:
        score += 4

    # Warm-temperature convection bonus (DANA needs warm Mediterranean SST)
    if temperature > 22:
        score += 5
    elif temperature > 18:
        score += 3
    # 5. Seasonal modulation
    #    Peak DANA season: Sep-Nov; extended: May-Dec; off-season: Jan-Apr
    if month in (9, 10, 11):
        # Peak season -- no damping
        pass
    elif month in (5, 6, 12):
        # Extended season -- moderate damping
        score *= 0.6
    elif month in (7, 8):
        # Summer -- rare but possible; strong damping
        score *= 0.3
    else:
        # Jan-Apr -- very unlikely
        score *= 0.15

    return min(100.0, max(0.0, round(score, 2)))
