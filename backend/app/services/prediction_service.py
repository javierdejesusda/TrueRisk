"""Prediction service -- computes statistical forecasting models from weather history.

Provides GEV extreme-value analysis, linear regression, Bayesian classification,
exponential moving averages, distribution-appropriate anomaly detection, rule-based
classification, k-nearest-neighbor matching, Mann-Kendall trend tests,
Peaks-Over-Threshold / GPD analysis, bootstrap confidence intervals, and EWMA
control charts.
"""

from __future__ import annotations

import math
from datetime import timedelta

from app.utils.time import utcnow
from typing import Any

import numpy as np
from scipy import stats
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
    cutoff = utcnow() - timedelta(days=days)
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
    cutoff = utcnow() - timedelta(days=years * 365)
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


# C1/C2: GEV extreme-value distribution (replaces Gumbel method-of-moments)

def _gev_fallback(current: float) -> dict:
    return {
        "params": {"mu": 0, "beta": 1, "shape": 0, "loc": 0, "scale": 1},
        "currentValue": round(current, 2),
        "exceedanceProbability": 0.5,
        "returnPeriod": 2.0,
        "returnPeriodCapped": False,
        "maxCredibleReturnPeriod": 0,
        "pdfCurve": [],
        "returnLevels": [],
    }


def _gev_analysis(values: list[float], current: float) -> dict:
    if len(values) < 10:
        return _gev_fallback(current)

    arr = [v for v in values if not math.isnan(v)]
    if len(arr) < 10:
        return _gev_fallback(current)

    try:
        shape, loc, scale = stats.genextreme.fit(arr)
    except Exception:
        return _gev_fallback(current)

    scale = max(scale, 0.01)
    if math.isnan(shape) or math.isnan(loc) or math.isnan(scale):
        return _gev_fallback(current)

    cdf = float(stats.genextreme.cdf(current, shape, loc=loc, scale=scale))
    if math.isnan(cdf):
        cdf = 0.5
    exceedance = 1 - cdf
    return_period = 1 / max(exceedance, 1e-6)

    # C2: Cap return periods
    max_credible = 2 * len(arr) / 365
    return_period_capped = return_period > max_credible

    vmin, vmax = min(arr), max(arr)
    spread = max(vmax - vmin, 1e-6)
    x_start = vmin - 0.2 * spread
    x_end = vmax + 0.3 * spread
    steps = 60
    step_size = (x_end - x_start) / steps
    pdf_curve = []
    for i in range(steps + 1):
        x = x_start + i * step_size
        y = float(stats.genextreme.pdf(x, shape, loc=loc, scale=scale))
        if math.isnan(y) or math.isinf(y):
            y = 0.0
        pdf_curve.append({"x": round(x, 2), "y": round(y, 6)})

    return_levels = []
    for period in [2, 5, 10, 25, 50, 100]:
        p = 1 - 1.0 / period
        try:
            level = float(stats.genextreme.ppf(p, shape, loc=loc, scale=scale))
            if math.isnan(level) or math.isinf(level):
                level = vmax * (1 + period / 100)
        except Exception:
            level = vmax * (1 + period / 100)
        low_confidence = period > max_credible
        return_levels.append({
            "period": period,
            "value": round(level, 2),
            "lowConfidence": low_confidence,
        })

    # C10: Parametric CI for return levels (delta method approximation).
    # Full bootstrap is too expensive for a synchronous request (~7500 GEV fits).
    # Use the GEV Fisher-information asymptotic CI as a fast proxy.
    n_obs = len(arr)
    for rl in return_levels:
        if not rl.get("lowConfidence") and n_obs >= 30:
            se = scale / math.sqrt(n_obs)  # approximate standard error
            rl["ci"] = [  # type: ignore[assignment]
                round(rl["value"] - 1.96 * se * math.log(rl["period"]), 2),
                round(rl["value"] + 1.96 * se * math.log(rl["period"]), 2),
            ]

    # Backward-compat: mu/beta alongside shape/loc/scale
    mu = loc
    beta = scale

    return {
        "params": {
            "mu": round(mu, 4),
            "beta": round(beta, 4),
            "shape": round(shape, 4),
            "loc": round(loc, 4),
            "scale": round(scale, 4),
        },
        "currentValue": round(current, 2),
        "exceedanceProbability": round(float(exceedance), 4),
        "returnPeriod": round(min(float(return_period), 9999), 1),
        "returnPeriodCapped": return_period_capped,
        "maxCredibleReturnPeriod": round(max_credible, 1),
        "pdfCurve": pdf_curve,
        "returnLevels": return_levels,
    }


# Linear regression (simple OLS on recent hourly steps)

def _linear_regression(values: list[float]) -> dict:
    n = len(values)
    if n < 10:
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
        data.append({"step": step, "fitted": round(slope * step + intercept, 2)})

    result = {
        "slope": round(slope, 4),
        "intercept": round(intercept, 2),
        "rSquared": round(max(r_squared, 0), 4),
        "projected6h": round(slope * (n + 5) + intercept, 2),
        "projected12h": round(slope * (n + 11) + intercept, 2),
        "data": data,
    }
    if n < 30:
        result["low_confidence"] = True
        result["sample_count"] = n
    return result


# C4: Bayesian event classification (KDE likelihood when >=20 obs)

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

        latest_value = float(records[-1].get(field, 0) or 0)

        # C4: KDE likelihood when enough observations
        field_values = [float(r.get(field, 0) or 0) for r in prior_source]
        if len(field_values) >= 20:
            try:
                kde = stats.gaussian_kde(field_values)
                likelihood = float(kde(latest_value)[0])
                # Normalize: scale to [0,1] using max PDF as reference
                max_pdf = float(kde(kde.dataset).max())
                likelihood = min(likelihood / max(max_pdf, 1e-6), 1.0)
            except Exception:
                # Fall back to sigmoid ramp
                if below:
                    distance = (threshold - latest_value) / max(abs(threshold), 1)
                    likelihood = max(0.0, min(1.0, 0.5 + distance * 0.5))
                else:
                    distance = (latest_value - threshold) / max(abs(threshold), 1)
                    likelihood = max(0.0, min(1.0, 0.5 + distance * 0.5))
        else:
            # Sigmoid ramp fallback
            if below:
                distance = (threshold - latest_value) / max(abs(threshold), 1)
                likelihood = max(0.0, min(1.0, 0.5 + distance * 0.5))
            else:
                distance = (latest_value - threshold) / max(abs(threshold), 1)
                likelihood = max(0.0, min(1.0, 0.5 + distance * 0.5))

        # Ensure a small minimum so prior always contributes
        likelihood = max(likelihood, 0.01)

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


# C11: Exponential Moving Average with EWMA control charts

def _ema_analysis(values: list[float], alpha: float = 0.3) -> dict:
    if not values:
        return {
            "data": [], "trend": "stable", "rateOfChange": 0,
            "controlLimits": {"ucl": 0, "lcl": 0, "sigma": 0},
            "outOfControl": False,
        }

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

    # C11: EWMA control limits
    mean_val = sum(values) / len(values) if len(values) > 0 else 0
    raw_std = (
        (sum((v - mean_val) ** 2 for v in values) / len(values)) ** 0.5
        if len(values) > 1
        else 0
    )
    sigma_ema = raw_std * math.sqrt(alpha / (2 - alpha)) if alpha < 2 else raw_std
    ucl = smoothed[-1] + 3 * sigma_ema
    lcl = smoothed[-1] - 3 * sigma_ema
    out_of_control = smoothed[-1] > ucl or smoothed[-1] < lcl

    return {
        "data": data,
        "trend": trend,
        "rateOfChange": round(roc, 4),
        "controlLimits": {
            "ucl": round(ucl, 2),
            "lcl": round(lcl, 2),
            "sigma": round(sigma_ema, 4),
        },
        "outOfControl": out_of_control,
    }


# C3: Distribution-appropriate z-score anomaly detection

def _zscore_analysis(records: list[dict], latest: dict) -> list[dict]:
    field_map = {
        "temperature": ("temperature", "gaussian"),
        "humidity": ("humidity", "gaussian"),
        "precipitation": ("precipitation", "gamma"),
        "windSpeed": ("wind_speed", "weibull"),
        "pressure": ("pressure", "gaussian"),
    }

    results = []
    for display_name, (db_field, dist_type) in field_map.items():
        values = [_safe(r.get(db_field)) for r in records if r.get(db_field) is not None]
        current = _safe(latest.get(db_field))
        if len(values) < 2:
            results.append({
                "field": display_name, "value": current, "mean": 0,
                "stdDev": 0, "zScore": 0, "isAnomaly": False, "distribution": dist_type,
            })
            continue

        mean = sum(values) / len(values)
        variance = sum((v - mean) ** 2 for v in values) / len(values)
        std = math.sqrt(variance) if variance > 0 else 0.0

        if std < 0.01:
            results.append({
                "field": display_name,
                "value": round(current, 2),
                "mean": round(mean, 2),
                "stdDev": 0.0,
                "zScore": 0.0,
                "isAnomaly": False,
                "distribution": dist_type,
            })
            continue

        # C3: Distribution-appropriate z-score via PIT
        z = 0.0
        if dist_type == "gamma" and min(values) >= 0:
            try:
                pos = [v for v in values if v > 0]
                if len(pos) >= 5:
                    a, floc, fscale = stats.gamma.fit(pos, floc=0)
                    if current <= 0:
                        zero_frac = len([v for v in values if v <= 0]) / len(values)
                        zero_frac = max(1e-6, min(zero_frac, 1 - 1e-6))
                        z = float(stats.norm.ppf(zero_frac))
                    else:
                        cdf = stats.gamma.cdf(current, a, loc=floc, scale=fscale)
                        cdf = max(1e-6, min(cdf, 1 - 1e-6))
                        z = float(stats.norm.ppf(cdf))
                else:
                    z = (current - mean) / std
            except Exception:
                z = (current - mean) / std
        elif dist_type == "weibull" and min(values) >= 0:
            try:
                pos = [v for v in values if v > 0]
                if len(pos) >= 5:
                    c, floc, fscale = stats.weibull_min.fit(pos, floc=0)
                    if current <= 0:
                        zero_frac = len([v for v in values if v <= 0]) / len(values)
                        zero_frac = max(1e-6, min(zero_frac, 1 - 1e-6))
                        z = float(stats.norm.ppf(zero_frac))
                    else:
                        cdf = stats.weibull_min.cdf(current, c, loc=floc, scale=fscale)
                        cdf = max(1e-6, min(cdf, 1 - 1e-6))
                        z = float(stats.norm.ppf(cdf))
                else:
                    z = (current - mean) / std
            except Exception:
                z = (current - mean) / std
        else:
            z = (current - mean) / std

        if math.isnan(z) or math.isinf(z):
            z = 0.0

        results.append({
            "field": display_name,
            "value": round(current, 2),
            "mean": round(mean, 2),
            "stdDev": round(std, 2),
            "zScore": round(z, 2),
            "isAnomaly": abs(z) >= 2,
            "distribution": dist_type,
        })

    return results


# C5: Rule-based classifier (renamed from decision tree)

def _rule_based_classifier(latest: dict) -> dict:
    rules: list[str] = []
    temp = _safe(latest.get("temperature"), 20)
    precip = _safe(latest.get("precipitation"))
    wind = _safe(latest.get("wind_speed"))
    humidity = _safe(latest.get("humidity"), 50)

    if precip > 10:
        rules.append("Heavy precipitation (>10mm/h)")
    if precip > 5 and humidity > 80:
        rules.append("High humidity + moderate rain -> flood risk")
    if temp > 35:
        rules.append("Extreme heat (>35C)")
    if temp > 30 and humidity < 30:
        rules.append("Hot & dry -> wildfire risk")
    if temp < 5:
        rules.append("Cold snap (<5C)")
    if wind > 60:
        rules.append("Storm-force winds (>60 km/h)")
    if wind > 40 and precip > 5:
        rules.append("Strong wind + rain -> severe weather")

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


# Backward-compat alias
_decision_tree = _rule_based_classifier


# C6/C7: K-Nearest Neighbors (6D, z-normalized, full analog pool)

_HISTORICAL_EVENTS: list[dict[str, Any]] = [
    {"year": 2019, "event": "DANA Alicante", "outcome": "catastrophic flooding",
     "temp": 22, "precip": 90, "wind": 70, "humidity": 95, "pressure": 1005, "soil_moisture": 0.6},
    {"year": 2020, "event": "Storm Gloria", "outcome": "coastal flooding",
     "temp": 8, "precip": 45, "wind": 90, "humidity": 88, "pressure": 998, "soil_moisture": 0.5},
    {"year": 2022, "event": "June heatwave", "outcome": "extreme heat 45C",
     "temp": 44, "precip": 0, "wind": 15, "humidity": 12, "pressure": 1018, "soil_moisture": 0.1},
    {"year": 2023, "event": "Drought Andalucia", "outcome": "reservoir deficit 30%",
     "temp": 32, "precip": 2, "wind": 10, "humidity": 25, "pressure": 1020, "soil_moisture": 0.08},
    {"year": 2024, "event": "Valencia DANA", "outcome": "severe flash floods",
     "temp": 20, "precip": 80, "wind": 65, "humidity": 92, "pressure": 1003, "soil_moisture": 0.55},
    {"year": 2021, "event": "Filomena", "outcome": "heavy snowfall Madrid",
     "temp": -2, "precip": 30, "wind": 50, "humidity": 90, "pressure": 1010, "soil_moisture": 0.7},
    {"year": 2023, "event": "August wildfires", "outcome": "wildfire Tenerife",
     "temp": 38, "precip": 0, "wind": 45, "humidity": 15, "pressure": 1015, "soil_moisture": 0.05},
    {"year": 2020, "event": "Saharan dust", "outcome": "poor air quality",
     "temp": 35, "precip": 0, "wind": 30, "humidity": 20, "pressure": 1012, "soil_moisture": 0.15},
]


def _classify_day(s: "WeatherDailySummary") -> tuple[str, str]:
    """Classify a daily summary into a descriptive event label and outcome."""
    temp_min = getattr(s, "temperature_min", None)

    # Extreme events first
    if s.precipitation_sum > 30:
        return "Heavy rain", f"precip {s.precipitation_sum:.0f}mm"
    if s.temperature_max > 38:
        return "Extreme heat", f"max {s.temperature_max:.1f}°C"
    if temp_min is not None and temp_min < -5:
        return "Hard freeze", f"min {temp_min:.1f}°C"
    if s.wind_speed_max > 60:
        return "Strong winds", f"gusts {s.wind_speed_max:.0f}km/h"

    # Notable events
    if s.precipitation_sum > 10:
        return "Moderate rain", f"precip {s.precipitation_sum:.0f}mm"
    if s.temperature_max > 35:
        return "Hot day", f"max {s.temperature_max:.1f}°C"
    if temp_min is not None and temp_min < 0:
        return "Frost", f"min {temp_min:.1f}°C"
    if s.wind_speed_max > 40:
        return "Windy", f"gusts {s.wind_speed_max:.0f}km/h"

    # Moderate events
    if s.precipitation_sum > 2:
        return "Light rain", f"{s.precipitation_sum:.1f}mm, {s.temperature_avg:.1f}°C"
    if s.precipitation_sum < 0.1 and s.temperature_max > 30:
        return "Hot & dry", f"{s.temperature_max:.1f}°C, no rain"
    if s.temperature_max > 28:
        return "Warm day", f"max {s.temperature_max:.1f}°C"
    if s.temperature_max < 10:
        return "Cold day", f"max {s.temperature_max:.1f}°C"

    # Mild conditions — describe by dominant characteristic
    humidity = s.humidity_avg or 50
    if humidity > 80:
        return "Humid & mild", f"{s.temperature_avg:.1f}°C, {humidity:.0f}% RH"
    if s.precipitation_sum < 0.1 and s.temperature_max < 25:
        return "Dry & cool", f"{s.temperature_avg:.1f}°C, dry"

    return "Mild day", f"{s.temperature_avg:.1f}°C, {s.precipitation_sum:.1f}mm"


def _build_knn_events_from_summaries(
    daily_summaries: list[WeatherDailySummary],
) -> list[dict[str, Any]]:
    """Build analog pool from ALL daily summaries, classified by dominant condition."""
    events: list[dict[str, Any]] = []
    for s in daily_summaries:
        event, outcome = _classify_day(s)

        events.append({
            "year": s.date.year,
            "event": f"{event} ({s.date.isoformat()})",
            "outcome": outcome,
            "temp": s.temperature_max,
            "precip": s.precipitation_sum,
            "wind": s.wind_speed_max,
            "humidity": s.humidity_avg or 50,
            "pressure": s.pressure_avg or 1013,
            "soil_moisture": getattr(s, "soil_moisture_avg", 0.3) or 0.3,
        })
    return events


def _knn_matches(latest: dict, k: int = 5, events: list[dict] | None = None) -> list[dict]:
    dims = ["temp", "precip", "wind", "humidity", "pressure", "soil_moisture"]
    query = [
        _safe(latest.get("temperature"), 20),
        _safe(latest.get("precipitation")),
        _safe(latest.get("wind_speed")),
        _safe(latest.get("humidity"), 50),
        _safe(latest.get("pressure"), 1013),
        _safe(latest.get("soil_moisture"), 0.3),
    ]

    source_events = events if events else _HISTORICAL_EVENTS

    # Compute mean/std from event pool for z-normalization
    pool = [[float(evt.get(d, 0)) for d in dims] for evt in source_events]
    if not pool:
        return []

    pool_arr = np.array(pool, dtype=np.float64)
    means = pool_arr.mean(axis=0)
    stds = np.maximum(pool_arr.std(axis=0), 1e-6)

    # Normalize query
    q_norm = [(query[i] - means[i]) / stds[i] for i in range(len(dims))]

    scored: list[dict[str, Any]] = []
    for evt in source_events:
        evt_vals = [float(evt.get(d, 0)) for d in dims]
        e_norm = [(evt_vals[i] - means[i]) / stds[i] for i in range(len(dims))]
        dist = math.sqrt(sum((q - e) ** 2 for q, e in zip(q_norm, e_norm)))
        scored.append({
            "event": evt["event"],
            "distance": round(dist, 2),
            "outcome": evt["outcome"],
            "year": evt["year"],
        })

    scored.sort(key=lambda x: float(x["distance"]))
    return scored[:k]


# C8: Mann-Kendall trend test

def _mann_kendall_test(values: list[float]) -> dict:
    """Mann-Kendall trend test with Sen's slope."""
    if len(values) < 10:
        return {
            "trend": "no data",
            "p_value": 1.0,
            "slope": 0.0,
            "intercept": 0.0,
            "significanceLevel": "none",
        }

    try:
        import pymannkendall as mk

        result = mk.original_test(values)

        if result.p < 0.01:
            sig = "very_significant"
        elif result.p < 0.05:
            sig = "significant"
        elif result.p < 0.10:
            sig = "marginally_significant"
        else:
            sig = "not_significant"

        return {
            "trend": result.trend,
            "p_value": round(result.p, 4),
            "slope": round(result.slope, 6),
            "intercept": round(result.intercept, 4),
            "significanceLevel": sig,
        }
    except Exception:
        return {
            "trend": "error",
            "p_value": 1.0,
            "slope": 0.0,
            "intercept": 0.0,
            "significanceLevel": "none",
        }


# C9: Peaks Over Threshold + GPD

def _pot_gpd_analysis(
    values: list[float], current: float, threshold_pct: int = 95
) -> dict:
    """Peaks Over Threshold with Generalized Pareto Distribution."""
    if len(values) < 30:
        return {
            "threshold": 0,
            "nExceedances": 0,
            "shape": 0,
            "scale": 1,
            "returnLevels": [],
        }

    threshold = float(sorted(values)[int(len(values) * threshold_pct / 100)])
    exceedances = [v - threshold for v in values if v > threshold]

    if len(exceedances) < 5:
        return {
            "threshold": round(threshold, 2),
            "nExceedances": len(exceedances),
            "shape": 0,
            "scale": 1,
            "returnLevels": [],
        }

    try:
        shape, _loc, scale = stats.genpareto.fit(exceedances, floc=0)
        scale = max(scale, 0.01)

        n_total = len(values)
        n_exceed = len(exceedances)
        rate = n_exceed / n_total

        return_levels = []
        for period in [2, 5, 10, 25, 50]:
            m = period * 365  # daily obs
            if shape != 0:
                level = threshold + (scale / shape) * ((m * rate) ** shape - 1)
            else:
                level = threshold + scale * math.log(m * rate)
            return_levels.append({"period": period, "value": round(float(level), 2)})

        return {
            "threshold": round(threshold, 2),
            "nExceedances": n_exceed,
            "shape": round(float(shape), 4),
            "scale": round(float(scale), 4),
            "returnLevels": return_levels,
        }
    except Exception:
        return {
            "threshold": round(threshold, 2),
            "nExceedances": len(exceedances),
            "shape": 0,
            "scale": 1,
            "returnLevels": [],
        }


# C10: Bootstrap confidence intervals

def _bootstrap_ci(
    values: list[float],
    stat_func: Any,
    n_boot: int = 500,
    block_size: int = 7,
    alpha: float = 0.05,
) -> tuple[float, float]:
    """Block bootstrap CI preserving weekly temporal correlation."""
    if len(values) < 20:
        val = stat_func(values)
        return (val, val)

    arr = np.array(values)
    n = len(arr)
    n_blocks = max(1, n // block_size)

    boot_stats: list[float] = []
    rng = np.random.default_rng(42)
    for _ in range(n_boot):
        block_starts = rng.integers(0, n - block_size + 1, size=n_blocks)
        sample = np.concatenate([arr[s : s + block_size] for s in block_starts])[:n]
        boot_stats.append(stat_func(sample.tolist()))

    boot_stats.sort()
    lo = boot_stats[int(n_boot * alpha / 2)]
    hi = boot_stats[int(n_boot * (1 - alpha / 2))]
    return (round(lo, 4), round(hi, 4))


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

    # Require minimum 30 daily summaries before using daily data path;
    # otherwise the statistics are degenerate (e.g. 1 record -> zero variance)
    has_enough_daily = len(daily_summaries) >= 30

    # For regression/EMA: use daily avg temps when hourly data is sparse (<30 records).
    # This gives meaningful trend charts from 5 years of daily data instead of 5 flat points.
    if len(temps) >= 30:
        recent_temps = temps[-48:] if len(temps) > 48 else temps
    elif has_enough_daily:
        recent_temps = [_safe(s.temperature_avg) for s in daily_summaries[-60:]]
    else:
        recent_temps = temps

    # Use daily data for GEV (statistically meaningful with years of data)
    if has_enough_daily:
        daily_precips = [_safe(s.precipitation_sum) for s in daily_summaries]
        daily_temp_maxes = [_safe(s.temperature_max) for s in daily_summaries]
        daily_wind_maxes = [_safe(s.wind_speed_max) for s in daily_summaries]
    else:
        daily_precips = precips
        daily_temp_maxes = temps
        daily_wind_maxes = winds

    # Build 365-day baseline from daily summaries for z-score
    baseline_records: list[dict[str, Any]] = []
    if has_enough_daily:
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

    # Build multi-year Bayesian baseline + recent records for likelihood
    if has_enough_daily:
        daily_baseline = [
            {
                "temperature": s.temperature_max,
                "humidity": s.humidity_avg,
                "precipitation": s.precipitation_sum,
                "wind_speed": s.wind_speed_max,
            }
            for s in daily_summaries
        ]
        # Use recent 30 daily summaries for Bayesian likelihood when hourly is sparse
        if len(record_dicts) < 30:
            bayesian_recent = [
                {
                    "temperature": s.temperature_max,
                    "humidity": s.humidity_avg or 50,
                    "precipitation": s.precipitation_sum,
                    "wind_speed": s.wind_speed_max,
                }
                for s in daily_summaries[-30:]
            ]
        else:
            bayesian_recent = record_dicts
    else:
        daily_baseline = None
        bayesian_recent = record_dicts

    # C7: Build KNN events from ALL daily summaries (not just extremes)
    knn_events = _build_knn_events_from_summaries(daily_summaries) if has_enough_daily else []
    if len(knn_events) < 3:
        fill_count = min(5 - len(knn_events), len(_HISTORICAL_EVENTS))
        knn_events = knn_events + _HISTORICAL_EVENTS[:fill_count]

    # C5: Rule-based classifier (backward-compat: both keys)
    rule_result = _rule_based_classifier(latest)

    # C8: Mann-Kendall trend tests on daily series
    mk_results = {}
    if has_enough_daily:
        mk_results["temperature"] = _mann_kendall_test(daily_temp_maxes)
        mk_results["precipitation"] = _mann_kendall_test(daily_precips)
        mk_results["windSpeed"] = _mann_kendall_test(daily_wind_maxes)
    else:
        mk_results["temperature"] = _mann_kendall_test(temps)
        mk_results["precipitation"] = _mann_kendall_test(precips)
        mk_results["windSpeed"] = _mann_kendall_test(winds)

    # C9: POT+GPD on daily series
    pot_results = {}
    if has_enough_daily:
        pot_results["precipitation"] = _pot_gpd_analysis(
            daily_precips, _safe(latest["precipitation"])
        )
        pot_results["temperature"] = _pot_gpd_analysis(
            daily_temp_maxes, _safe(latest["temperature"])
        )
        pot_results["windSpeed"] = _pot_gpd_analysis(
            daily_wind_maxes, _safe(latest["wind_speed"])
        )
    else:
        pot_results["precipitation"] = _pot_gpd_analysis(precips, _safe(latest["precipitation"]))
        pot_results["temperature"] = _pot_gpd_analysis(temps, _safe(latest["temperature"]))
        pot_results["windSpeed"] = _pot_gpd_analysis(winds, _safe(latest["wind_speed"]))

    return {
        "gumbel": {
            "precipitation": _gev_analysis(daily_precips, _safe(latest["precipitation"])),
            "temperature": _gev_analysis(daily_temp_maxes, _safe(latest["temperature"])),
            "windSpeed": _gev_analysis(daily_wind_maxes, _safe(latest["wind_speed"])),
        },
        "regression": _linear_regression(recent_temps),
        "bayesian": _bayesian_analysis(bayesian_recent, baseline=daily_baseline),
        "ema": _ema_analysis(recent_temps),
        "zScore": _zscore_analysis(baseline_records, latest),
        "decisionTree": rule_result,
        "ruleBasedClassifier": rule_result,
        "knn": _knn_matches(latest, events=knn_events),
        "mannKendall": mk_results,
        "pot": pot_results,
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
