"""SPEI (Standardized Precipitation-Evapotranspiration Index) at multiple
time scales, computed from daily weather observations.

This module bridges daily weather data to monthly SPEI calculation.  It
aggregates daily precipitation and temperature into monthly totals/means,
computes PET via Thornthwaite, derives the climatic water balance (P - PET),
and standardises using a log-logistic (Fisk) distribution when enough data
is available, with a normal-score fallback for shorter series.

References
----------
Vicente-Serrano, S.M. et al. (2010). A Multiscalar Drought Index Sensitive
to Global Warming: The Standardized Precipitation Evapotranspiration Index.
Journal of Climate, 23(7), 1696-1718.
"""

from __future__ import annotations

import math
from typing import Optional

import numpy as np
from scipy import stats

from app.ml.features.weather_indices import compute_pet_hargreaves, compute_pet_thornthwaite

# Minimum number of daily observations required per time scale
_MIN_DAYS: dict[str, int] = {
    "spei_1m": 30,
    "spei_3m": 60,
    "spei_6m": 150,
}

_NONE_RESULT: dict[str, Optional[float]] = {
    "spei_1m": None,
    "spei_3m": None,
    "spei_6m": None,
}


def _aggregate_daily_to_monthly(
    precip_daily: list[float],
    temp_daily: list[float],
    temp_max_daily: list[float] | None = None,
    temp_min_daily: list[float] | None = None,
) -> tuple[list[float], list[float], list[float], list[float]]:
    """Aggregate daily precipitation (sum) and temperature (mean/max/min) into
    approximate 30-day months, working from the end of the series backward.

    Returns (precip_monthly, temp_monthly, temp_max_monthly, temp_min_monthly)
    with the most recent month last.
    """
    n = len(precip_daily)
    if n < 30:
        return [], [], [], []

    precip = np.asarray(precip_daily, dtype=np.float64)
    temp = np.asarray(temp_daily, dtype=np.float64)

    # Derive max/min from mean if not provided
    if temp_max_daily is not None:
        temp_max = np.asarray(temp_max_daily, dtype=np.float64)
    else:
        temp_max = temp + 5.0
    if temp_min_daily is not None:
        temp_min = np.asarray(temp_min_daily, dtype=np.float64)
    else:
        temp_min = temp - 5.0

    # Work backward in 30-day blocks so the most recent month is complete
    monthly_precip: list[float] = []
    monthly_temp: list[float] = []
    monthly_temp_max: list[float] = []
    monthly_temp_min: list[float] = []

    idx = n
    while idx >= 30:
        start = idx - 30
        monthly_precip.append(float(np.sum(precip[start:idx])))
        monthly_temp.append(float(np.mean(temp[start:idx])))
        monthly_temp_max.append(float(np.mean(temp_max[start:idx])))
        monthly_temp_min.append(float(np.mean(temp_min[start:idx])))
        idx = start

    # Reverse so chronological order is preserved (oldest first)
    monthly_precip.reverse()
    monthly_temp.reverse()
    monthly_temp_max.reverse()
    monthly_temp_min.reverse()

    return monthly_precip, monthly_temp, monthly_temp_max, monthly_temp_min


def _standardize_series(values: np.ndarray) -> Optional[float]:
    """Standardize the last value of a water-balance series.

    Uses log-logistic (Fisk) distribution when the series is long enough
    (>= 10 values), otherwise falls back to normal z-score.

    Returns the SPEI value for the last element, or None on failure.
    """
    n = len(values)
    if n < 2:
        return None

    # Shift to positive domain for log-logistic fitting
    d_min = float(np.min(values))
    d_shifted = values - d_min + 1.0  # ensure all positive

    if n >= 10:
        # Preferred: log-logistic (Fisk) distribution
        try:
            c, loc, scale = stats.fisk.fit(d_shifted)
            cdf = float(stats.fisk.cdf(d_shifted[-1], c, loc=loc, scale=scale))
            cdf = max(1e-6, min(cdf, 1.0 - 1e-6))
            spei = float(stats.norm.ppf(cdf))
            if not (math.isnan(spei) or math.isinf(spei)):
                return round(spei, 4)
        except Exception:
            pass

    # Fallback: normal standardization (z-score)
    mean_d = float(np.mean(values))
    std_d = float(np.std(values, ddof=0))
    if std_d < 1e-10:
        # All values identical -- no anomaly
        return 0.0
    z = float((values[-1] - mean_d) / std_d)
    if math.isnan(z) or math.isinf(z):
        return None
    return round(z, 4)


def _compute_scale(
    monthly_precip: list[float],
    monthly_temp: list[float],
    latitude: float,
    n_months: int,
    temp_max_monthly: list[float] | None = None,
    temp_min_monthly: list[float] | None = None,
) -> Optional[float]:
    """Compute SPEI for a single time scale.

    1. Compute PET via Hargreaves-Samani (preferred) or Thornthwaite (fallback).
    2. Derive water balance D = P - PET.
    3. Build rolling sums of D over *n_months*.
    4. Standardize the resulting series.
    """
    total = len(monthly_precip)
    if total < n_months:
        return None

    # Compute PET -- prefer Hargreaves-Samani when max/min temps available
    if temp_max_monthly is not None and temp_min_monthly is not None:
        pet = compute_pet_hargreaves(temp_max_monthly, temp_min_monthly, latitude)
    else:
        pet = compute_pet_thornthwaite(monthly_temp, latitude)
    precip_arr = np.asarray(monthly_precip, dtype=np.float64)
    pet_arr = np.asarray(pet, dtype=np.float64)

    # Monthly water balance
    d = precip_arr - pet_arr

    # Rolling sum over n_months
    if n_months == 1:
        rolled = d
    else:
        length = total - n_months + 1
        if length < 1:
            return None
        rolled = np.array([
            float(np.sum(d[i : i + n_months]))
            for i in range(length)
        ])

    if len(rolled) < 2:
        # Can't standardize a single value without context
        # But we can still return a heuristic: if water balance is negative
        # it indicates drought
        val = float(rolled[-1])
        if val < -50:
            return -2.0
        elif val < 0:
            return -1.0
        elif val > 50:
            return 1.0
        else:
            return 0.0

    return _standardize_series(rolled)


def compute_spei(
    precip_daily: list[float],
    temp_daily: list[float],
    latitude: float,
    temp_max_daily: list[float] | None = None,
    temp_min_daily: list[float] | None = None,
) -> dict[str, Optional[float]]:
    """Compute SPEI at 1-month, 3-month, and 6-month time scales from daily
    weather observations.

    Parameters
    ----------
    precip_daily : list[float]
        Daily precipitation totals in mm, ordered chronologically (oldest
        first).  Ideally 180+ days for SPEI-6m.
    temp_daily : list[float]
        Daily mean temperature in degrees Celsius, same length as
        *precip_daily*.
    latitude : float
        Station/province latitude in degrees (used for PET day-length
        correction).
    temp_max_daily : list[float], optional
        Daily maximum temperatures. If provided (along with temp_min_daily),
        Hargreaves-Samani PET is used instead of Thornthwaite.
    temp_min_daily : list[float], optional
        Daily minimum temperatures.

    Returns
    -------
    dict with keys ``spei_1m``, ``spei_3m``, ``spei_6m``.
    Values are floats (standard deviations from mean) or ``None`` when
    there is insufficient data to compute.
    """
    if len(precip_daily) != len(temp_daily):
        return dict(_NONE_RESULT)

    n_days = len(precip_daily)

    # Not enough data for even 1-month SPEI
    if n_days < _MIN_DAYS["spei_1m"]:
        return dict(_NONE_RESULT)

    # Derive max/min from mean if not provided
    if temp_max_daily is None:
        temp_max_daily = [t + 5.0 for t in temp_daily]
    if temp_min_daily is None:
        temp_min_daily = [t - 5.0 for t in temp_daily]

    # Aggregate daily data into ~30-day months
    monthly_precip, monthly_temp, monthly_temp_max, monthly_temp_min = (
        _aggregate_daily_to_monthly(
            precip_daily, temp_daily, temp_max_daily, temp_min_daily,
        )
    )

    if not monthly_precip:
        return dict(_NONE_RESULT)

    result: dict[str, Optional[float]] = {}

    for key, n_months in (("spei_1m", 1), ("spei_3m", 3), ("spei_6m", 6)):
        if n_days < _MIN_DAYS[key]:
            result[key] = None
        else:
            result[key] = _compute_scale(
                monthly_precip, monthly_temp, latitude, n_months,
                temp_max_monthly=monthly_temp_max,
                temp_min_monthly=monthly_temp_min,
            )

    return result
