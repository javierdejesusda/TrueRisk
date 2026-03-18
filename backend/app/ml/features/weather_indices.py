"""
Scientifically established weather and climate risk indices.

References:
- FWI: Van Wagner, C.E. (1987). Development and structure of the Canadian
  Forest Fire Weather Index System. Forestry Technical Report 35.
- Heat Index: Rothfusz, L.P. (1990). The Heat Index "Equation".
  NWS Southern Region Technical Attachment SR 90-23.
- WBGT: Liljegren, J.C. et al. (2008). Modeling the Wet Bulb Globe
  Temperature Using Standard Meteorological Measurements.
- SPI: McKee, T.B. et al. (1993). The relationship of drought frequency
  and duration to time scales.
- SPEI: Vicente-Serrano, S.M. et al. (2010). A Multiscalar Drought Index
  Sensitive to Global Warming.

All functions are pure -- no database access, no side effects.
"""

from __future__ import annotations

import math
from typing import Optional

import numpy as np
from scipy import stats


# ---------------------------------------------------------------------------
# Day-length adjustment factors used by the FWI system (Northern Hemisphere)
# Index 0 = January, 11 = December
# ---------------------------------------------------------------------------
_DMC_DAY_LENGTH: list[float] = [
    6.5, 7.5, 9.0, 12.8, 13.9, 13.9, 12.4, 10.9, 9.4, 8.0, 7.0, 6.0,
]

_DC_DAY_LENGTH: list[float] = [
    -1.6, -1.6, -1.6, 0.9, 3.8, 5.8, 6.4, 5.0, 2.4, 0.4, -1.6, -1.6,
]


# ===================================================================
# 1. Canadian Fire Weather Index (FWI) system -- Van Wagner 1987
# ===================================================================

def compute_ffmc(
    temp: float,
    rh: float,
    wind: float,
    rain: float,
    prev_ffmc: float = 85.0,
) -> float:
    """Fine Fuel Moisture Code.

    Parameters
    ----------
    temp : float  -- temperature in degrees Celsius
    rh : float    -- relative humidity in percent (0-100)
    wind : float  -- wind speed in km/h
    rain : float  -- 24-hour accumulated rainfall in mm
    prev_ffmc : float -- previous day's FFMC (default 85.0)

    Returns
    -------
    float -- FFMC value (scale 0-101)
    """
    # Moisture content from previous FFMC
    mo = 147.2 * (101.0 - prev_ffmc) / (59.5 + prev_ffmc)

    # Rain phase
    if rain > 0.5:
        rf = rain - 0.5
        if mo <= 150.0:
            mr = (
                mo
                + 42.5 * rf * math.exp(-100.0 / (251.0 - mo))
                * (1.0 - math.exp(-6.93 / rf))
            )
        else:
            mr = (
                mo
                + 42.5 * rf * math.exp(-100.0 / (251.0 - mo))
                * (1.0 - math.exp(-6.93 / rf))
                + 0.0015 * (mo - 150.0) ** 2 * rf ** 0.5
            )
        mo = min(mr, 250.0)

    # Equilibrium moisture content for drying
    ed = (
        0.942 * rh ** 0.679
        + 11.0 * math.exp((rh - 100.0) / 10.0)
        + 0.18 * (21.1 - temp) * (1.0 - math.exp(-0.115 * rh))
    )

    if mo > ed:
        # Drying
        ko = (
            0.424 * (1.0 - (rh / 100.0) ** 1.7)
            + 0.0694 * wind ** 0.5 * (1.0 - (rh / 100.0) ** 8)
        )
        kd = ko * 0.581 * math.exp(0.0365 * temp)
        m = ed + (mo - ed) * 10.0 ** (-kd)
    else:
        # Wetting
        ew = (
            0.618 * rh ** 0.753
            + 10.0 * math.exp((rh - 100.0) / 10.0)
            + 0.18 * (21.1 - temp) * (1.0 - math.exp(-0.115 * rh))
        )
        if mo < ew:
            k1 = (
                0.424 * (1.0 - ((100.0 - rh) / 100.0) ** 1.7)
                + 0.0694 * wind ** 0.5
                * (1.0 - ((100.0 - rh) / 100.0) ** 8)
            )
            kw = k1 * 0.581 * math.exp(0.0365 * temp)
            m = ew - (ew - mo) * 10.0 ** (-kw)
        else:
            m = mo

    # Convert moisture content back to FFMC
    ffmc = 59.5 * (250.0 - m) / (147.2 + m)
    return max(0.0, min(ffmc, 101.0))


def compute_dmc(
    temp: float,
    rh: float,
    rain: float,
    prev_dmc: float = 6.0,
    month: int = 1,
) -> float:
    """Duff Moisture Code.

    Parameters
    ----------
    temp : float     -- temperature in degrees Celsius
    rh : float       -- relative humidity in percent
    rain : float     -- 24-hour accumulated rainfall in mm
    prev_dmc : float -- previous day's DMC (default 6.0)
    month : int      -- month number (1-12)

    Returns
    -------
    float -- DMC value (typically 0-500+)
    """
    if temp < -1.1:
        temp = -1.1

    le = _DMC_DAY_LENGTH[month - 1]  # effective day-length

    # Rain phase
    po = prev_dmc
    if rain > 1.5:
        re = 0.92 * rain - 1.27
        mo = 20.0 + math.exp(5.6348 - po / 43.43)
        if po <= 33.0:
            b = 100.0 / (0.5 + 0.3 * po)
        elif po <= 65.0:
            b = 14.0 - 1.3 * math.log(po)
        else:
            b = 6.2 * math.log(po) - 17.2
        mr = mo + 1000.0 * re / (48.77 + b * re)
        pr = 244.72 - 43.43 * math.log(mr - 20.0)
        po = max(pr, 0.0)

    # Drying phase
    k = 1.894 * (temp + 1.1) * (100.0 - rh) * le * 1e-6
    dmc = po + 100.0 * k
    return max(0.0, dmc)


def compute_dc(
    temp: float,
    rain: float,
    prev_dc: float = 15.0,
    month: int = 1,
) -> float:
    """Drought Code.

    Parameters
    ----------
    temp : float    -- temperature in degrees Celsius
    rain : float    -- 24-hour accumulated rainfall in mm
    prev_dc : float -- previous day's DC (default 15.0)
    month : int     -- month number (1-12)

    Returns
    -------
    float -- DC value (typically 0-800+)
    """
    if temp < -2.8:
        temp = -2.8

    lf = _DC_DAY_LENGTH[month - 1]

    # Rain phase
    qo = prev_dc
    if rain > 2.8:
        rd = 0.83 * rain - 1.27
        qo_moisture = 800.0 * math.exp(-prev_dc / 400.0)
        qr = qo_moisture + 3.937 * rd
        dr = 400.0 * math.log(800.0 / qr)
        qo = max(dr, 0.0)

    # Drying phase -- potential evapotranspiration
    v = 0.36 * (temp + 2.8) + lf
    v = max(v, 0.0)
    dc = qo + 0.5 * v
    return max(0.0, dc)


def compute_isi(wind: float, ffmc: float) -> float:
    """Initial Spread Index.

    Parameters
    ----------
    wind : float -- wind speed in km/h
    ffmc : float -- Fine Fuel Moisture Code

    Returns
    -------
    float -- ISI value
    """
    # Moisture content from FFMC
    m = 147.2 * (101.0 - ffmc) / (59.5 + ffmc)

    fw = math.exp(0.05039 * wind)
    ff = 91.9 * math.exp(-0.1386 * m) * (1.0 + m ** 5.31 / 4.93e7)
    isi = 0.208 * fw * ff
    return isi


def compute_bui(dmc: float, dc: float) -> float:
    """Buildup Index.

    Parameters
    ----------
    dmc : float -- Duff Moisture Code
    dc : float  -- Drought Code

    Returns
    -------
    float -- BUI value
    """
    if dmc <= 0.0:
        return 0.0

    if dmc <= 0.4 * dc:
        bui = 0.8 * dmc * dc / (dmc + 0.4 * dc)
    else:
        bui = dmc - (1.0 - 0.8 * dc / (dmc + 0.4 * dc)) * (
            0.92 + (0.0114 * dmc) ** 1.7
        )
    return max(0.0, bui)


def compute_fwi(isi: float, bui: float) -> float:
    """Fire Weather Index.

    Parameters
    ----------
    isi : float -- Initial Spread Index
    bui : float -- Buildup Index

    Returns
    -------
    float -- FWI value
    """
    if bui > 80.0:
        fd = 1000.0 / (25.0 + 108.64 * math.exp(-0.023 * bui))
    else:
        fd = 0.626 * bui ** 0.809 + 2.0

    b = 0.1 * isi * fd

    if b > 1.0:
        fwi = math.exp(2.72 * (0.434 * math.log(b)) ** 0.647)
    else:
        fwi = b

    return fwi


def compute_fwi_system(
    temp: float,
    rh: float,
    wind: float,
    rain: float,
    prev_ffmc: float = 85.0,
    prev_dmc: float = 6.0,
    prev_dc: float = 15.0,
    month: int = 1,
) -> dict[str, float]:
    """Compute the full Canadian FWI system in one call.

    Returns a dict with keys: ffmc, dmc, dc, isi, bui, fwi
    """
    ffmc = compute_ffmc(temp, rh, wind, rain, prev_ffmc)
    dmc = compute_dmc(temp, rh, rain, prev_dmc, month)
    dc = compute_dc(temp, rain, prev_dc, month)
    isi = compute_isi(wind, ffmc)
    bui = compute_bui(dmc, dc)
    fwi = compute_fwi(isi, bui)

    return {
        "ffmc": round(ffmc, 2),
        "dmc": round(dmc, 2),
        "dc": round(dc, 2),
        "isi": round(isi, 2),
        "bui": round(bui, 2),
        "fwi": round(fwi, 2),
    }


# ===================================================================
# 2. Heat Index -- Rothfusz regression (NWS standard)
# ===================================================================

def compute_heat_index(temp_c: float, rh: float) -> float:
    """NWS Heat Index using the Rothfusz regression equation.

    Parameters
    ----------
    temp_c : float -- air temperature in degrees Celsius
    rh : float     -- relative humidity in percent (0-100)

    Returns
    -------
    float -- heat index in degrees Celsius
    """
    if temp_c < 27.0 or rh < 40.0:
        return temp_c

    # Convert to Fahrenheit for the regression
    t = temp_c * 9.0 / 5.0 + 32.0

    hi = (
        -42.379
        + 2.04901523 * t
        + 10.14333127 * rh
        - 0.22475541 * t * rh
        - 0.00683783 * t ** 2
        - 0.05481717 * rh ** 2
        + 0.00122874 * t ** 2 * rh
        + 0.00085282 * t * rh ** 2
        - 0.00000199 * t ** 2 * rh ** 2
    )

    # Convert back to Celsius
    hi_c = (hi - 32.0) * 5.0 / 9.0
    return round(hi_c, 2)


# ===================================================================
# 3. WBGT -- Simplified Liljegren model
# ===================================================================

def compute_wbgt(
    temp_c: float,
    rh: float,
    wind_ms: float,
    solar_radiation: float = 500.0,
) -> float:
    """Wet Bulb Globe Temperature (simplified Liljegren approximation).

    Parameters
    ----------
    temp_c : float          -- air temperature in degrees Celsius
    rh : float              -- relative humidity in percent (0-100)
    wind_ms : float         -- wind speed in m/s
    solar_radiation : float -- solar radiation in W/m2 (default 500)

    Returns
    -------
    float -- WBGT in degrees Celsius
    """
    # Wet-bulb temperature approximation (Stull 2011 formula)
    tw = (
        temp_c * math.atan(0.151977 * (rh + 8.313659) ** 0.5)
        + math.atan(temp_c + rh)
        - math.atan(rh - 1.676331)
        + 0.00391838 * rh ** 1.5 * math.atan(0.023101 * rh)
        - 4.686035
    )

    # Globe temperature approximation (simplified)
    tg = 1.01 * temp_c + 2.1

    # Outdoor WBGT
    wbgt = 0.7 * tw + 0.2 * tg + 0.1 * temp_c
    return round(wbgt, 2)


# ===================================================================
# 4. SPI -- Standardized Precipitation Index
# ===================================================================

def compute_spi(precip_series: list[float]) -> float:
    """Standardized Precipitation Index.

    Fits a gamma distribution to the precipitation series, then
    transforms the CDF to a standard normal quantile.

    Parameters
    ----------
    precip_series : list[float]
        Precipitation values over a time window (e.g., monthly totals).
        Must contain at least 30 values for a meaningful fit.

    Returns
    -------
    float -- SPI value (standard deviations from the mean).
             Positive = wetter than normal, negative = drier.
             Returns 0.0 if the series is too short or all zeros.
    """
    arr = np.asarray(precip_series, dtype=np.float64)

    if len(arr) < 10:
        return 0.0

    # Proportion of zeros
    n = len(arr)
    zeros = np.sum(arr <= 0.0)
    q = zeros / n  # probability of zero

    nonzero = arr[arr > 0.0]
    if len(nonzero) < 5:
        return 0.0

    # Fit gamma to non-zero values
    try:
        alpha, _loc, beta = stats.gamma.fit(nonzero, floc=0)
    except Exception:
        return 0.0

    # CDF value for the last observation
    x = arr[-1]
    if x <= 0.0:
        cdf = q
    else:
        cdf = q + (1.0 - q) * stats.gamma.cdf(x, alpha, scale=beta)

    # Clamp to avoid infinities at the tails
    cdf = np.clip(cdf, 1e-6, 1.0 - 1e-6)

    spi = float(stats.norm.ppf(cdf))
    return round(spi, 4)


# ===================================================================
# 5. SPEI -- Standardized Precipitation-Evapotranspiration Index
# ===================================================================

def compute_pet_thornthwaite(
    temp_monthly: list[float],
    latitude: float,
) -> list[float]:
    """Potential evapotranspiration via the Thornthwaite (1948) method.

    Parameters
    ----------
    temp_monthly : list[float]
        Monthly mean temperatures in degrees Celsius (12 values for
        Jan-Dec, or an arbitrary length time series of monthly temps).
    latitude : float
        Latitude in degrees (used for day-length correction).

    Returns
    -------
    list[float] -- Monthly PET values in mm.
    """
    temps = np.asarray(temp_monthly, dtype=np.float64)
    # Clamp negative temperatures to zero for PET calculation
    temps_pos = np.maximum(temps, 0.0)

    # Heat index (annual sum, computed over full series repeating as 12-month)
    n = len(temps_pos)
    # Use the mean annual heat index from the series
    if n >= 12:
        # Average each calendar month across years
        full_years = n // 12
        remainder = n % 12
        monthly_means = np.zeros(12)
        for m in range(12):
            indices = list(range(m, full_years * 12, 12))
            if m < remainder:
                indices.append(full_years * 12 + m)
            monthly_means[m] = np.mean(temps_pos[indices])
    else:
        monthly_means = np.zeros(12)
        monthly_means[:n] = temps_pos

    heat_indices = (monthly_means / 5.0) ** 1.514
    annual_heat_index = float(np.sum(heat_indices))

    if annual_heat_index <= 0.0:
        return [0.0] * n

    # Exponent
    a = (
        6.75e-7 * annual_heat_index ** 3
        - 7.71e-5 * annual_heat_index ** 2
        + 1.792e-2 * annual_heat_index
        + 0.49239
    )

    # Mean day-length correction factors (hours/12) by latitude
    # Approximation using declination
    pet_values: list[float] = []
    for i in range(n):
        t = temps_pos[i]
        if t <= 0.0:
            pet_values.append(0.0)
            continue

        # Month index (0-11, cycling)
        month_idx = i % 12

        # Day-length approximation based on latitude and month
        # Declination angle for mid-month
        day_of_year = 15 + month_idx * 30  # approximate mid-month day
        declination = 23.45 * math.sin(
            math.radians(360.0 / 365.0 * (day_of_year - 81))
        )
        lat_rad = math.radians(latitude)
        dec_rad = math.radians(declination)

        # Hour angle at sunset
        cos_ha = -math.tan(lat_rad) * math.tan(dec_rad)
        cos_ha = max(-1.0, min(1.0, cos_ha))
        ha = math.acos(cos_ha)
        day_length_hours = 2.0 * math.degrees(ha) / 15.0

        # Correction factor
        correction = (day_length_hours / 12.0) * (30.0 / 30.0)

        # Unadjusted PET
        pet = 16.0 * (10.0 * t / annual_heat_index) ** a
        pet *= correction
        pet_values.append(round(max(pet, 0.0), 2))

    return pet_values


def compute_spei(
    precip_series: list[float],
    temp_series: list[float],
    latitude: float,
) -> float:
    """Standardized Precipitation-Evapotranspiration Index.

    Parameters
    ----------
    precip_series : list[float]
        Monthly precipitation totals in mm.
    temp_series : list[float]
        Monthly mean temperatures in degrees Celsius.
        Must be the same length as precip_series.
    latitude : float
        Latitude in degrees (for PET calculation).

    Returns
    -------
    float -- SPEI value (standard deviations from mean).
             Positive = wetter than normal, negative = drier.
             Returns 0.0 if the series is too short.
    """
    if len(precip_series) != len(temp_series):
        raise ValueError(
            "precip_series and temp_series must have the same length"
        )

    n = len(precip_series)
    if n < 10:
        return 0.0

    # Compute PET
    pet = compute_pet_thornthwaite(temp_series, latitude)

    # Climatic water balance: D = P - PET
    d = np.asarray(precip_series, dtype=np.float64) - np.asarray(pet)

    # Shift to positive domain for log-logistic fitting
    d_min = float(np.min(d))
    if d_min < 0:
        d_shifted = d - d_min + 1.0
    else:
        d_shifted = d + 1.0  # ensure all positive

    # Fit a log-logistic distribution (Fisk distribution in scipy)
    # Log-logistic: scipy.stats.fisk
    try:
        c, loc, scale = stats.fisk.fit(d_shifted)
    except Exception:
        # Fall back to normal standardization
        mean_d = float(np.mean(d))
        std_d = float(np.std(d))
        if std_d == 0.0:
            return 0.0
        return round(float((d[-1] - mean_d) / std_d), 4)

    # CDF value for the last observation
    x_last = d_shifted[-1]
    cdf = float(stats.fisk.cdf(x_last, c, loc=loc, scale=scale))

    # Clamp to avoid infinities
    cdf = max(1e-6, min(cdf, 1.0 - 1e-6))

    spei = float(stats.norm.ppf(cdf))
    return round(spei, 4)
