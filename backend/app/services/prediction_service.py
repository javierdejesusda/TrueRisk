"""Prediction service -- computes statistical forecasting models from weather history.

Provides Gumbel extreme-value analysis, linear regression, Bayesian classification,
exponential moving averages, z-score anomaly detection, decision-tree classification,
and k-nearest-neighbor matching.
"""

from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.province import Province
from app.models.weather_record import WeatherRecord
from app.models.weather_daily_summary import WeatherDailySummary


async def _get_province(db: AsyncSession, province_code: str) -> Province:
    province = await db.get(Province, province_code)
    if province is None:
        raise ValueError(f"Province {province_code} not found")
    return province


async def _get_history(
    db: AsyncSession, province_code: str, days: int = 30
) -> list[WeatherRecord]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(WeatherRecord)
        .where(
            WeatherRecord.province_code == province_code,
            WeatherRecord.recorded_at >= cutoff,
        )
        .order_by(WeatherRecord.recorded_at.asc())
    )
    return list(result.scalars().all())


async def _get_daily_history(
    db: AsyncSession, province_code: str, years: int = 5
) -> list[WeatherDailySummary]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=years * 365)
    result = await db.execute(
        select(WeatherDailySummary)
        .where(
            WeatherDailySummary.province_code == province_code,
            WeatherDailySummary.date >= cutoff.date(),
        )
        .order_by(WeatherDailySummary.date.asc())
    )
    return list(result.scalars().all())


def _safe(val: Any, default: float = 0.0) -> float:
    if val is None:
        return default
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


# ---------------------------------------------------------------------------
# Gumbel extreme-value distribution
# ---------------------------------------------------------------------------

def _gumbel_params(values: list[float]) -> tuple[float, float]:
    """Estimate Gumbel location (mu) and scale (beta) via method of moments."""
    if len(values) < 2:
        return (0.0, 1.0)
    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    std = max(math.sqrt(variance), 0.01)
    beta = max(std * math.sqrt(6) / math.pi, 0.01)
    mu = mean - 0.5772 * beta
    return (round(mu, 4), round(max(beta, 0.01), 4))


def _gumbel_pdf(x: float, mu: float, beta: float) -> float:
    beta = max(beta, 0.01)
    z = (x - mu) / beta
    if abs(z) > 20:
        return 0.0
    return (1 / beta) * math.exp(-(z + math.exp(-z)))


def _gumbel_cdf(x: float, mu: float, beta: float) -> float:
    beta = max(beta, 0.01)
    z = (x - mu) / beta
    z = max(min(z, 20), -20)
    return math.exp(-math.exp(-z))


def _gumbel_analysis(values: list[float], current: float) -> dict:
    mu, beta = _gumbel_params(values)
    cdf = _gumbel_cdf(current, mu, beta)
    exceedance = 1 - cdf
    return_period = 1 / max(exceedance, 1e-6)

    vmin = min(values) if values else 0
    vmax = max(values) if values else 1
    spread = max(vmax - vmin, 1e-6)
    x_range_start = vmin - 0.2 * spread
    x_range_end = vmax + 0.3 * spread
    steps = 60
    step_size = (x_range_end - x_range_start) / steps
    pdf_curve = []
    for i in range(steps + 1):
        x = x_range_start + i * step_size
        pdf_curve.append({"x": round(x, 2), "y": round(_gumbel_pdf(x, mu, beta), 6)})

    return_levels = []
    for period in [2, 5, 10, 25, 50, 100]:
        p = 1 - 1.0 / period
        level = mu - beta * math.log(-math.log(p))
        return_levels.append({"period": period, "value": round(level, 2)})

    return {
        "params": {"mu": mu, "beta": beta},
        "currentValue": round(current, 2),
        "exceedanceProbability": round(exceedance, 4),
        "returnPeriod": round(min(return_period, 9999), 1),
        "pdfCurve": pdf_curve,
        "returnLevels": return_levels,
    }


# ---------------------------------------------------------------------------
# Linear regression (simple OLS on recent hourly steps)
# ---------------------------------------------------------------------------

def _linear_regression(values: list[float]) -> dict:
    n = len(values)
    if n < 2:
        return {
            "slope": 0, "intercept": 0, "rSquared": 0,
            "projected6h": 0, "projected12h": 0, "data": [],
        }

    xs = list(range(n))
    x_mean = (n - 1) / 2
    y_mean = sum(values) / n
    ss_xy = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, values))
    ss_xx = sum((x - x_mean) ** 2 for x in xs)
    slope = ss_xy / max(ss_xx, 1e-9)
    intercept = y_mean - slope * x_mean

    ss_res = sum((y - (slope * x + intercept)) ** 2 for x, y in zip(xs, values))
    ss_tot = sum((y - y_mean) ** 2 for y in values)
    r_squared = 1 - ss_res / max(ss_tot, 1e-9) if ss_tot > 0 else 0

    data = [
        {"step": i, "actual": round(v, 2), "fitted": round(slope * i + intercept, 2)}
        for i, v in enumerate(values)
    ]
    for h in range(1, 13):
        step = n - 1 + h
        data.append({"step": step, "actual": 0.0, "fitted": round(slope * step + intercept, 2)})

    return {
        "slope": round(slope, 4),
        "intercept": round(intercept, 2),
        "rSquared": round(max(r_squared, 0), 4),
        "projected6h": round(slope * (n + 5) + intercept, 2),
        "projected12h": round(slope * (n + 11) + intercept, 2),
        "data": data,
    }


# ---------------------------------------------------------------------------
# Bayesian event classification
# ---------------------------------------------------------------------------

_EVENT_THRESHOLDS: dict[str, dict[str, Any]] = {
    "flood": {"field": "precipitation", "threshold": 10.0},
    "heat_wave": {"field": "temperature", "threshold": 35.0},
    "cold_snap": {"field": "temperature", "threshold": 5.0, "below": True},
    "wind_storm": {"field": "wind_speed", "threshold": 60.0},
}


def _bayesian_analysis(records: list[dict], baseline: list[dict] | None = None) -> list[dict]:
    n = len(records)
    if n == 0:
        return [
            {"type": k, "probability": 0, "prior": 0, "likelihood": 0}
            for k in _EVENT_THRESHOLDS
        ]

    # Use longer baseline for priors if available
    prior_source = baseline if baseline else records

    results = []
    for event, cfg in _EVENT_THRESHOLDS.items():
        field = str(cfg["field"])
        threshold = float(cfg["threshold"])
        below = bool(cfg.get("below", False))

        count = 0
        for r in prior_source:
            v = float(r.get(field, 0) or 0)
            if below:
                if v < threshold:
                    count += 1
            else:
                if v > threshold:
                    count += 1

        prior = count / len(prior_source)
        # Likelihood: how extreme is the latest reading relative to threshold
        latest = float(records[-1].get(field, 0) or 0)
        if below:
            likelihood = max(0, (threshold - latest) / max(threshold, 1)) if latest < threshold else 0
        else:
            likelihood = max(0, (latest - threshold) / max(threshold, 1)) if latest > threshold else 0
        likelihood = min(likelihood, 1.0)

        posterior = prior * likelihood
        normalizer = prior * likelihood + (1 - prior) * max(1 - likelihood, 0.01)
        posterior = posterior / normalizer if normalizer > 0 else 0

        results.append({
            "type": event,
            "probability": round(posterior, 4),
            "prior": round(prior, 4),
            "likelihood": round(likelihood, 4),
        })

    return results


# ---------------------------------------------------------------------------
# Exponential Moving Average
# ---------------------------------------------------------------------------

def _ema_analysis(values: list[float], alpha: float = 0.3) -> dict:
    if not values:
        return {"data": [], "trend": "stable", "rateOfChange": 0}

    smoothed = [values[0]]
    for v in values[1:]:
        smoothed.append(alpha * v + (1 - alpha) * smoothed[-1])

    # Downsample to max ~60 points for the chart
    step = max(1, len(values) // 60)
    data = [
        {
            "step": i,
            "raw": round(values[i], 2),
            "smoothed": round(smoothed[i], 2),
        }
        for i in range(0, len(values), step)
    ]

    if len(smoothed) >= 2:
        roc = smoothed[-1] - smoothed[-2]
    else:
        roc = 0

    if roc > 0.5:
        trend = "rising"
    elif roc < -0.5:
        trend = "falling"
    else:
        trend = "stable"

    return {"data": data, "trend": trend, "rateOfChange": round(roc, 4)}


# ---------------------------------------------------------------------------
# Z-Score anomaly detection
# ---------------------------------------------------------------------------

def _zscore_analysis(records: list[dict], latest: dict) -> list[dict]:
    field_map = {
        "temperature": "temperature",
        "humidity": "humidity",
        "precipitation": "precipitation",
        "windSpeed": "wind_speed",
        "pressure": "pressure",
    }

    results = []
    for display_name, db_field in field_map.items():
        values = [_safe(r.get(db_field)) for r in records if r.get(db_field) is not None]
        current = _safe(latest.get(db_field))
        if len(values) < 2:
            results.append({
                "field": display_name, "value": current, "mean": 0,
                "stdDev": 0, "zScore": 0, "isAnomaly": False,
            })
            continue

        mean = sum(values) / len(values)
        variance = sum((v - mean) ** 2 for v in values) / len(values)
        std = math.sqrt(variance) if variance > 0 else 1e-6
        z = (current - mean) / std

        results.append({
            "field": display_name,
            "value": round(current, 2),
            "mean": round(mean, 2),
            "stdDev": round(std, 2),
            "zScore": round(z, 2),
            "isAnomaly": abs(z) >= 2,
        })

    return results


# ---------------------------------------------------------------------------
# Decision tree (rule-based)
# ---------------------------------------------------------------------------

def _decision_tree(latest: dict) -> dict:
    rules: list[str] = []
    temp = _safe(latest.get("temperature"), 20)
    precip = _safe(latest.get("precipitation"))
    wind = _safe(latest.get("wind_speed"))
    humidity = _safe(latest.get("humidity"), 50)

    if precip > 10:
        rules.append("Heavy precipitation (>10mm/h)")
    if precip > 5 and humidity > 80:
        rules.append("High humidity + moderate rain → flood risk")
    if temp > 35:
        rules.append("Extreme heat (>35°C)")
    if temp > 30 and humidity < 30:
        rules.append("Hot & dry → wildfire risk")
    if temp < 5:
        rules.append("Cold snap (<5°C)")
    if wind > 60:
        rules.append("Storm-force winds (>60 km/h)")
    if wind > 40 and precip > 5:
        rules.append("Strong wind + rain → severe weather")

    if not rules:
        rules.append("No extreme conditions detected")

    # Classify
    if precip > 10 or (precip > 5 and humidity > 80):
        event_type = "flood"
        confidence = min(0.5 + precip / 40, 1.0)
    elif temp > 35:
        event_type = "heat_wave"
        confidence = min(0.4 + (temp - 35) / 15, 1.0)
    elif wind > 60:
        event_type = "wind_storm"
        confidence = min(0.5 + (wind - 60) / 60, 1.0)
    elif temp < 5:
        event_type = "cold_snap"
        confidence = min(0.4 + (5 - temp) / 15, 1.0)
    else:
        event_type = "none"
        confidence = 0.1

    return {
        "type": event_type,
        "confidence": round(confidence, 2),
        "matchedRules": rules,
    }


# ---------------------------------------------------------------------------
# K-Nearest Neighbors (historical event matching)
# ---------------------------------------------------------------------------

_HISTORICAL_EVENTS: list[dict[str, Any]] = [
    {"year": 2019, "event": "DANA Alicante", "outcome": "catastrophic flooding", "temp": 22, "precip": 90, "wind": 70, "humidity": 95},
    {"year": 2020, "event": "Storm Gloria", "outcome": "coastal flooding", "temp": 8, "precip": 45, "wind": 90, "humidity": 88},
    {"year": 2022, "event": "June heatwave", "outcome": "extreme heat 45°C", "temp": 44, "precip": 0, "wind": 15, "humidity": 12},
    {"year": 2023, "event": "Drought Andalucía", "outcome": "reservoir deficit 30%", "temp": 32, "precip": 2, "wind": 10, "humidity": 25},
    {"year": 2024, "event": "Valencia DANA", "outcome": "severe flash floods", "temp": 20, "precip": 80, "wind": 65, "humidity": 92},
    {"year": 2021, "event": "Filomena", "outcome": "heavy snowfall Madrid", "temp": -2, "precip": 30, "wind": 50, "humidity": 90},
    {"year": 2023, "event": "August wildfires", "outcome": "wildfire Tenerife", "temp": 38, "precip": 0, "wind": 45, "humidity": 15},
    {"year": 2020, "event": "Saharan dust", "outcome": "poor air quality", "temp": 35, "precip": 0, "wind": 30, "humidity": 20},
]


def _build_knn_events_from_summaries(daily_summaries: list[WeatherDailySummary]) -> list[dict[str, Any]]:
    """Extract extreme weather days from daily summaries for KNN matching."""
    events: list[dict[str, Any]] = []
    for s in daily_summaries:
        is_extreme = (
            s.precipitation_sum > 30
            or s.temperature_max > 38
            or s.wind_speed_max > 60
            or (s.temperature_max > 30 and s.precipitation_sum < 0.1)
        )
        if not is_extreme:
            continue

        if s.precipitation_sum > 30:
            outcome = f"heavy rain ({s.precipitation_sum:.0f}mm)"
            event = "Heavy precipitation"
        elif s.temperature_max > 38:
            outcome = f"extreme heat ({s.temperature_max:.1f}C)"
            event = "Heat extreme"
        elif s.wind_speed_max > 60:
            outcome = f"strong winds ({s.wind_speed_max:.0f}km/h)"
            event = "Wind event"
        else:
            outcome = f"hot dry spell ({s.temperature_max:.1f}C, {s.precipitation_sum:.1f}mm)"
            event = "Dry heat"

        events.append({
            "year": s.date.year,
            "event": f"{event} ({s.date.isoformat()})",
            "outcome": outcome,
            "temp": s.temperature_max,
            "precip": s.precipitation_sum,
            "wind": s.wind_speed_max,
            "humidity": s.humidity_avg or 50,
        })
    return events


def _knn_matches(latest: dict, k: int = 5, events: list[dict] | None = None) -> list[dict]:
    t = _safe(latest.get("temperature"), 20)
    p = _safe(latest.get("precipitation"))
    w = _safe(latest.get("wind_speed"))
    h = _safe(latest.get("humidity"), 50)

    source_events = events if events else _HISTORICAL_EVENTS
    scored: list[dict[str, Any]] = []
    for evt in source_events:
        et, ep, ew, eh = float(evt["temp"]), float(evt["precip"]), float(evt["wind"]), float(evt["humidity"])
        dist = math.sqrt(
            ((t - et) / 10) ** 2
            + ((p - ep) / 20) ** 2
            + ((w - ew) / 20) ** 2
            + ((h - eh) / 20) ** 2
        )
        scored.append({
            "event": evt["event"],
            "distance": round(dist, 2),
            "outcome": evt["outcome"],
            "year": evt["year"],
        })

    scored.sort(key=lambda x: float(x["distance"]))
    return scored[:k]


# ---------------------------------------------------------------------------
# Main orchestrator
# ---------------------------------------------------------------------------

async def compute_predictions(db: AsyncSession, province_code: str) -> dict:
    """Compute all statistical prediction models for a province."""
    await _get_province(db, province_code)
    records = await _get_history(db, province_code, days=30)

    if not records:
        raise ValueError("No weather history available for predictions")

    # Fetch multi-year daily summaries for statistically meaningful analysis
    daily_summaries = await _get_daily_history(db, province_code, years=5)

    record_dicts = [
        {
            "temperature": r.temperature,
            "humidity": r.humidity,
            "precipitation": r.precipitation,
            "wind_speed": r.wind_speed,
            "wind_direction": r.wind_direction,
            "wind_gusts": r.wind_gusts,
            "pressure": r.pressure,
            "soil_moisture": r.soil_moisture,
            "uv_index": r.uv_index,
            "dew_point": r.dew_point,
            "cloud_cover": r.cloud_cover,
        }
        for r in records
    ]

    latest = record_dicts[-1]

    temps = [_safe(r["temperature"]) for r in record_dicts]
    precips = [_safe(r["precipitation"]) for r in record_dicts]
    winds = [_safe(r["wind_speed"]) for r in record_dicts]

    # Use last 48 hourly values for regression/EMA charts
    recent_temps = temps[-48:] if len(temps) > 48 else temps

    # Use daily data for Gumbel (statistically meaningful with years of data)
    if daily_summaries:
        daily_precips = [s.precipitation_sum for s in daily_summaries]
        daily_temp_maxes = [s.temperature_max for s in daily_summaries]
        daily_wind_maxes = [s.wind_speed_max for s in daily_summaries]
    else:
        daily_precips = precips
        daily_temp_maxes = temps
        daily_wind_maxes = winds

    # Build 365-day baseline from daily summaries for z-score
    if daily_summaries:
        baseline_records = [
            {
                "temperature": s.temperature_avg,
                "humidity": s.humidity_avg,
                "precipitation": s.precipitation_sum,
                "wind_speed": s.wind_speed_avg,
                "pressure": s.pressure_avg,
            }
            for s in daily_summaries[-365:]
        ]
    else:
        baseline_records = record_dicts

    # Build multi-year Bayesian baseline
    daily_baseline = [
        {
            "temperature": s.temperature_max,
            "humidity": s.humidity_avg,
            "precipitation": s.precipitation_sum,
            "wind_speed": s.wind_speed_max,
        }
        for s in daily_summaries
    ] if daily_summaries else None

    # Build KNN events from real historical extremes
    knn_events = _build_knn_events_from_summaries(daily_summaries) if daily_summaries else []
    if len(knn_events) < 5:
        knn_events = _HISTORICAL_EVENTS  # fallback to hardcoded

    return {
        "gumbel": {
            "precipitation": _gumbel_analysis(daily_precips, _safe(latest["precipitation"])),
            "temperature": _gumbel_analysis(daily_temp_maxes, _safe(latest["temperature"])),
            "windSpeed": _gumbel_analysis(daily_wind_maxes, _safe(latest["wind_speed"])),
        },
        "regression": _linear_regression(recent_temps),
        "bayesian": _bayesian_analysis(record_dicts, baseline=daily_baseline),
        "ema": _ema_analysis(recent_temps),
        "zScore": _zscore_analysis(baseline_records, latest),
        "decisionTree": _decision_tree(latest),
        "knn": _knn_matches(latest, events=knn_events),
        "current": {
            "temperature": round(_safe(latest["temperature"]), 1),
            "humidity": round(_safe(latest["humidity"]), 1),
            "precipitation": round(_safe(latest["precipitation"]), 2),
            "windSpeed": round(_safe(latest["wind_speed"]), 1),
            "pressure": round(_safe(latest["pressure"], 1013), 1),
        },
        "dataQuality": {
            "hourlyRecords": len(records),
            "dailySummaries": len(daily_summaries),
            "oldestDailyDate": daily_summaries[0].date.isoformat() if daily_summaries else None,
            "newestDailyDate": daily_summaries[-1].date.isoformat() if daily_summaries else None,
        },
    }
