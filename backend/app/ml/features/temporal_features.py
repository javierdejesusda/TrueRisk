"""
Temporal / rolling-window feature engineering from weather record sequences.

All functions are pure -- no database access.  Input is a list of weather
record dicts ordered most-recent-first.
"""

from __future__ import annotations

import math

import numpy as np


def _safe_get(record: dict, key: str, default: float = 0.0) -> float:
    """Return a numeric value from *record*, falling back to *default*."""
    val = record.get(key)
    if val is None:
        return default
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def _rolling_sum(
    records: list[dict],
    key: str,
    count: int,
) -> float:
    """Sum *key* over the first *count* records (most-recent-first)."""
    total = 0.0
    for i, rec in enumerate(records):
        if i >= count:
            break
        total += _safe_get(rec, key)
    return round(total, 2)


def _consecutive_days(
    records: list[dict],
    key: str,
    predicate,
) -> int:
    """Count consecutive records from the start that satisfy *predicate*."""
    count = 0
    for rec in records:
        val = _safe_get(rec, key)
        if predicate(val):
            count += 1
        else:
            break
    return count


def _linear_slope(values: list[float]) -> float:
    """Ordinary least-squares slope over an ordered sequence.

    *values* should be in chronological order (oldest first) so a
    positive slope indicates an increasing trend.
    """
    n = len(values)
    if n < 2:
        return 0.0
    x = np.arange(n, dtype=np.float64)
    y = np.asarray(values, dtype=np.float64)
    x_mean = np.mean(x)
    y_mean = np.mean(y)
    denom = float(np.sum((x - x_mean) ** 2))
    if denom == 0.0:
        return 0.0
    slope = float(np.sum((x - x_mean) * (y - y_mean)) / denom)
    return round(slope, 6)


def compute_temporal_features(
    weather_records: list[dict],
) -> dict[str, float]:
    """Derive temporal / rolling-window features from weather records.

    Parameters
    ----------
    weather_records : list[dict]
        Weather observations ordered **most-recent-first**.  Each dict
        should contain some subset of the following keys (missing keys
        are gracefully handled):

        - ``precipitation`` -- mm of rainfall
        - ``temperature``   -- air temperature in degrees Celsius
        - ``temperature_min`` -- daily minimum temperature
        - ``pressure``      -- atmospheric pressure in hPa
        - ``soil_moisture`` -- soil moisture (any consistent unit)
        - ``date`` or ``recorded_at`` -- used for month extraction

    Returns
    -------
    dict[str, float] with keys:
        precip_6h, precip_24h, precip_48h, precip_7d, precip_30d,
        consecutive_dry_days, consecutive_wet_days,
        consecutive_hot_days, consecutive_hot_nights,
        pressure_tendency_1d, pressure_tendency_3d,
        soil_moisture_trend, temperature_anomaly,
        month_sin, month_cos
    """
    n = len(weather_records)
    if n == 0:
        return _empty_features()
    # Precipitation rolling sums
    # Treat each record as roughly one period; callers decide granularity
    # (e.g., hourly records -> 6 records = 6h, daily -> 6 days).
    precip_key = "precipitation"

    precip_6h = _rolling_sum(weather_records, precip_key, 6)
    precip_24h = _rolling_sum(weather_records, precip_key, 24)
    precip_48h = _rolling_sum(weather_records, precip_key, 48)
    precip_7d = _rolling_sum(weather_records, precip_key, 7 * 24)
    precip_30d = _rolling_sum(weather_records, precip_key, 30 * 24)

    # Consecutive-day streaks (daily granularity expected)
    consecutive_dry = _consecutive_days(
        weather_records, precip_key, lambda v: v < 1.0,
    )
    consecutive_wet = _consecutive_days(
        weather_records, precip_key, lambda v: v >= 1.0,
    )
    consecutive_hot = _consecutive_days(
        weather_records, "temperature", lambda v: v > 35.0,
    )
    consecutive_hot_nights = _consecutive_days(
        weather_records, "temperature_min", lambda v: v > 20.0,
    )

    # Pressure tendencies
    pressure_tendency_1d = 0.0
    pressure_tendency_3d = 0.0
    if n >= 2:
        p_now = _safe_get(weather_records[0], "pressure")
        p_prev = _safe_get(weather_records[1], "pressure")
        pressure_tendency_1d = round(p_now - p_prev, 2)
        if n >= 4:
            p_3d = _safe_get(weather_records[3], "pressure")
            pressure_tendency_3d = round(p_now - p_3d, 2)

    # Soil moisture trend (linear slope over last 7 records, oldest-first)
    sm_window = min(n, 7)
    sm_values = [
        _safe_get(weather_records[i], "soil_moisture")
        for i in range(sm_window - 1, -1, -1)  # reverse to chronological
    ]
    soil_moisture_trend = _linear_slope(sm_values)

    # Temperature anomaly: current temp minus mean of last 30 records
    temp_now = _safe_get(weather_records[0], "temperature")
    temp_window = min(n, 30)
    temp_values = [
        _safe_get(weather_records[i], "temperature")
        for i in range(temp_window)
    ]
    temp_mean = sum(temp_values) / len(temp_values) if temp_values else 0.0
    temperature_anomaly = round(temp_now - temp_mean, 2)

    # Cyclical month encoding
    current_month = _extract_month(weather_records[0])
    month_sin = round(math.sin(2.0 * math.pi * current_month / 12.0), 6)
    month_cos = round(math.cos(2.0 * math.pi * current_month / 12.0), 6)

    return {
        "precip_6h": precip_6h,
        "precip_24h": precip_24h,
        "precip_48h": precip_48h,
        "precip_7d": precip_7d,
        "precip_30d": precip_30d,
        "consecutive_dry_days": float(consecutive_dry),
        "consecutive_wet_days": float(consecutive_wet),
        "consecutive_hot_days": float(consecutive_hot),
        "consecutive_hot_nights": float(consecutive_hot_nights),
        "pressure_tendency_1d": pressure_tendency_1d,
        "pressure_tendency_3d": pressure_tendency_3d,
        "soil_moisture_trend": soil_moisture_trend,
        "temperature_anomaly": temperature_anomaly,
        "month_sin": month_sin,
        "month_cos": month_cos,
    }


# Helpers

def _extract_month(record: dict) -> int:
    """Best-effort extraction of the month (1-12) from a record."""
    for key in ("date", "recorded_at", "timestamp"):
        val = record.get(key)
        if val is None:
            continue
        # If it's already a datetime-like object
        if hasattr(val, "month"):
            return int(val.month)
        # Try parsing an ISO-format string (YYYY-MM-DD...)
        s = str(val)
        if len(s) >= 7 and s[4] == "-":
            try:
                return int(s[5:7])
            except ValueError:
                pass
    # Fallback: January
    return 1


def _empty_features() -> dict[str, float]:
    """Return a zeroed-out feature dict when no records are available."""
    return {
        "precip_6h": 0.0,
        "precip_24h": 0.0,
        "precip_48h": 0.0,
        "precip_7d": 0.0,
        "precip_30d": 0.0,
        "consecutive_dry_days": 0.0,
        "consecutive_wet_days": 0.0,
        "consecutive_hot_days": 0.0,
        "consecutive_hot_nights": 0.0,
        "pressure_tendency_1d": 0.0,
        "pressure_tendency_3d": 0.0,
        "soil_moisture_trend": 0.0,
        "temperature_anomaly": 0.0,
        "month_sin": 0.0,
        "month_cos": 0.0,
    }
