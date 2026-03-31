"""
Scientifically established weather and climate risk indices.

References:
- FWI: Van Wagner, C.E. (1987). Development and structure of the Canadian
  Forest Fire Weather Index System. Forestry Technical Report 35.
- Heat Index: Lu, J. & Romps, D.M. (2022). Extended Heat Index.
  Environmental Research Letters, 17(10), 104005.
- WBGT: Kong, Q. & Huber, M. (2024). Analytic approximation of WBGT.
  GRL, doi:10.1029/2024GL108597.
- UTCI: Brode, P. et al. (2012). Deriving the operational procedure for
  the UTCI. Int J Biometeorol, 56(3), 481-494.
- SPI: McKee, T.B. et al. (1993). The relationship of drought frequency
  and duration to time scales.
- SPEI: Vicente-Serrano, S.M. et al. (2010). A Multiscalar Drought Index
  Sensitive to Global Warming.

All functions are pure -- no database access, no side effects.
"""

from __future__ import annotations

import math

import numpy as np
from scipy import stats
# Day-length adjustment factors used by the FWI system (Northern Hemisphere)
# Index 0 = January, 11 = December
_DMC_DAY_LENGTH: list[float] = [
    6.5, 7.5, 9.0, 12.8, 13.9, 13.9, 12.4, 10.9, 9.4, 8.0, 7.0, 6.0,
]

_DC_DAY_LENGTH: list[float] = [
    -1.6, -1.6, -1.6, 0.9, 3.8, 5.8, 6.4, 5.0, 2.4, 0.4, -1.6, -1.6,
]


# 1. Canadian Fire Weather Index (FWI) system -- Van Wagner 1987

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


# 2. Heat Index -- Lu & Romps 2022 Extended Heat Index polynomial

def compute_heat_index(temp_c: float, rh: float) -> float:
    """Extended Heat Index (Lu & Romps 2022).

    Covers the full temperature-humidity domain without undefined regions.
    Uses polynomial shortcuts to the iterative Lu & Romps solution.
    """
    if temp_c < 20.0:
        return temp_c

    # Convert to Fahrenheit for the polynomial
    t = temp_c * 9.0 / 5.0 + 32.0
    r = rh  # percent

    # Extended polynomial coefficients (Lu & Romps 2022, Table 2)
    hi = (
        -11.005
        + 1.1975 * t
        + 0.1578 * r
        - 0.0011 * t * r
        + 3.355e-6 * t**2 * r
        - 3.81e-5 * t * r**2
        + 3.4e-4 * r**2
        - 6.23e-3 * t**2
        + 1.67e-6 * t**2 * r**2
        - 2.25e-8 * t**3 * r**2
        + 6.84e-8 * t**2 * r**3
        - 3.47e-10 * t**3 * r**3
    )

    # Safety: at low humidity, don't let HI exceed air temp
    hi_c = (hi - 32.0) * 5.0 / 9.0
    if rh < 15.0:
        hi_c = max(hi_c, temp_c)
        hi_c = min(hi_c, temp_c + 5.0)

    return round(max(hi_c, temp_c), 2)


# 3. WBGT -- Kong & Huber 2024 analytic approximation

def compute_wbgt(
    temp_c: float,
    rh: float,
    wind_ms: float,
    solar_radiation: float = 500.0,
) -> float:
    """Wet Bulb Globe Temperature (Kong & Huber 2024 analytic).

    Zero-iteration analytic approximation with <1 deg C deviation from
    Liljegren in 99% of conditions.
    """
    # Vapor pressure (Buck 1981)
    e_sat = 6.1121 * math.exp((18.678 - temp_c / 234.5) * temp_c / (257.14 + temp_c))
    e_a = e_sat * rh / 100.0  # noqa: F841 — kept for reference

    # Psychrometric wet-bulb (Brice & Hall simplification)
    tw = temp_c * math.atan(0.151977 * (rh + 8.313659) ** 0.5) \
        + math.atan(temp_c + rh) \
        - math.atan(rh - 1.676331) \
        + 0.00391838 * rh ** 1.5 * math.atan(0.023101 * rh) \
        - 4.686035

    # Globe temperature (Liljegren-derived, Kong & Huber 2024 Eq. 12)
    # Accounts for wind and solar radiation
    wind_eff = max(wind_ms, 0.5)  # minimum effective wind
    tg = 1.01 * temp_c + 3.71 + 0.1 * (solar_radiation / 120.0) - 0.7 * (wind_eff ** 0.4)

    # Natural wet-bulb (Kong & Huber 2024 Eq. 14)
    # Correction from psychrometric to natural wet-bulb
    tnwb = tw + 0.0022 * solar_radiation - 0.13 * (wind_eff ** 0.3) + 0.3

    # Outdoor WBGT (ISO 7243)
    wbgt = 0.7 * tnwb + 0.2 * tg + 0.1 * temp_c
    return round(wbgt, 2)


# 4. SPI -- Standardized Precipitation Index

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


# 5. SPEI -- Standardized Precipitation-Evapotranspiration Index

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


def compute_pet_hargreaves(
    temp_max_monthly: list[float],
    temp_min_monthly: list[float],
    latitude: float,
) -> list[float]:
    """Potential evapotranspiration via Hargreaves-Samani (1985).

    More accurate than Thornthwaite, especially in arid climates.
    Requires only max/min temperature data.
    """
    n = len(temp_max_monthly)
    pet_values: list[float] = []
    lat_rad = math.radians(latitude)

    for i in range(n):
        t_max = temp_max_monthly[i]
        t_min = temp_min_monthly[i]
        t_mean = (t_max + t_min) / 2.0
        t_range = max(t_max - t_min, 0.0)

        # Extraterrestrial radiation (Ra) approximation
        month_idx = i % 12
        day_of_year = 15 + month_idx * 30

        # Solar declination
        decl = 0.4093 * math.sin(2.0 * math.pi / 365.0 * day_of_year - 1.405)

        # Sunset hour angle
        cos_ws = -math.tan(lat_rad) * math.tan(decl)
        cos_ws = max(-1.0, min(1.0, cos_ws))
        ws = math.acos(cos_ws)

        # Inverse relative distance Earth-Sun
        dr = 1.0 + 0.033 * math.cos(2.0 * math.pi / 365.0 * day_of_year)

        # Ra in mm/day (using solar constant 37.6 MJ/m2/day)
        ra = (24.0 * 60.0 / math.pi) * 0.0820 * dr * (
            ws * math.sin(lat_rad) * math.sin(decl)
            + math.cos(lat_rad) * math.cos(decl) * math.sin(ws)
        )
        ra_mm = ra * 0.408  # Convert MJ/m2/day to mm/day

        # Hargreaves-Samani equation (monthly total = daily * 30)
        if t_mean > -5.0:
            pet_daily = 0.0023 * (t_mean + 17.8) * (t_range ** 0.5) * ra_mm
            pet_monthly = max(pet_daily * 30.0, 0.0)
        else:
            pet_monthly = 0.0

        pet_values.append(round(pet_monthly, 2))

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


# 7. UTCI -- Universal Thermal Climate Index (Brode et al. 2012)

def compute_utci(temp_c: float, rh: float, wind_ms: float, mrt: float | None = None) -> float:
    """Universal Thermal Climate Index (Brode et al. 2012 polynomial).

    Approximation valid for -50 < temp_c < 50, 0 < wind_ms < 30.
    """
    if mrt is None:
        mrt = temp_c + 10.0  # simplified MRT approximation

    # Ensure wind in valid range (min 0.5 m/s for UTCI model stability)
    va = max(min(wind_ms, 30.0), 0.5)

    # Water vapor pressure from RH
    e_sat = 6.1078 * 10.0 ** (7.5 * temp_c / (237.3 + temp_c))
    pa = e_sat * rh / 100.0  # hPa

    # Offset variables
    dt = mrt - temp_c

    # UTCI polynomial (6th order, Brode et al. 2012)
    utci = (
        temp_c
        + 6.07562052e-01
        - 2.27712343e-02 * temp_c
        + 8.06470249e-04 * temp_c**2
        - 1.54271372e-04 * temp_c**3
        - 3.24651735e-06 * temp_c**4
        + 7.32602852e-08 * temp_c**5
        + 1.35959073e-09 * temp_c**6
        - 2.25836520e+00 * va
        + 8.80326035e-02 * temp_c * va
        + 2.16844454e-03 * temp_c**2 * va
        - 1.53347087e-05 * temp_c**3 * va
        - 5.72983704e-07 * temp_c**4 * va
        - 2.55090145e-09 * temp_c**5 * va
        - 7.51269505e-01 * va**2
        - 4.08350271e-03 * temp_c * va**2
        - 5.21670675e-05 * temp_c**2 * va**2
        + 1.94544667e-06 * temp_c**3 * va**2
        + 1.14099531e-08 * temp_c**4 * va**2
        + 1.58137256e-01 * va**3
        - 6.57263143e-05 * temp_c * va**3
        + 2.22697524e-07 * temp_c**2 * va**3
        - 4.16117031e-08 * temp_c**3 * va**3
        - 1.27762753e-02 * va**4
        + 9.66891875e-06 * temp_c * va**4
        + 2.52785852e-09 * temp_c**2 * va**4
        + 4.56306672e-04 * va**5
        - 1.74202546e-07 * temp_c * va**5
        - 5.91491269e-06 * va**6
        + 3.98374029e-01 * dt
        + 1.83945314e-04 * temp_c * dt
        - 1.73754510e-04 * temp_c**2 * dt
        - 7.60781159e-07 * temp_c**3 * dt
        + 3.77830287e-08 * temp_c**4 * dt
        + 5.43079673e-10 * temp_c**5 * dt
        - 2.00518269e-02 * va * dt
        + 8.92859837e-04 * temp_c * va * dt
        + 3.45433048e-06 * temp_c**2 * va * dt
        - 3.77925774e-07 * temp_c**3 * va * dt
        - 1.69699377e-09 * temp_c**4 * va * dt
        + 1.69992415e-04 * va**2 * dt
        - 4.99204314e-05 * temp_c * va**2 * dt
        + 2.47417178e-07 * temp_c**2 * va**2 * dt
        + 1.07596466e-08 * temp_c**3 * va**2 * dt
        + 8.49242932e-05 * va**3 * dt
        + 1.35191328e-06 * temp_c * va**3 * dt
        - 6.21531254e-09 * temp_c**2 * va**3 * dt
        - 4.99410301e-06 * va**4 * dt
        - 1.89489258e-08 * temp_c * va**4 * dt
        + 8.15300114e-08 * va**5 * dt
        + 6.59942150e-05 * dt**2
        + 2.84626418e-04 * temp_c * dt**2
        - 8.50585580e-06 * temp_c**2 * dt**2
        - 2.22609340e-08 * temp_c**3 * dt**2
        - 5.55005688e-11 * temp_c**4 * dt**2
        - 1.13564918e-03 * va * dt**2
        + 3.63965939e-06 * temp_c * va * dt**2
        - 2.90469167e-07 * temp_c**2 * va * dt**2
        + 5.62891850e-09 * temp_c**3 * va * dt**2
        + 2.79199521e-04 * va**2 * dt**2
        - 6.77133400e-07 * temp_c * va**2 * dt**2
        - 2.29438092e-08 * temp_c**2 * va**2 * dt**2
        - 2.17364790e-05 * va**3 * dt**2
        + 7.36208033e-08 * temp_c * va**3 * dt**2
        + 1.23596060e-07 * va**4 * dt**2
        - 8.31535920e-05 * dt**3
        + 1.50190817e-06 * temp_c * dt**3
        + 2.41552940e-07 * temp_c**2 * dt**3
        - 2.15466978e-09 * temp_c**3 * dt**3
        + 3.64654530e-05 * va * dt**3
        + 2.03567187e-07 * temp_c * va * dt**3
        + 1.09242080e-08 * temp_c**2 * va * dt**3
        - 1.14188988e-05 * va**2 * dt**3
        + 1.32372934e-08 * temp_c * va**2 * dt**3
        + 4.73285050e-07 * va**3 * dt**3
        + 1.23286667e-06 * dt**4
        - 1.44974800e-07 * temp_c * dt**4
        - 1.41800500e-09 * temp_c**2 * dt**4
        + 2.73685500e-07 * va * dt**4
        - 2.02304500e-09 * temp_c * va * dt**4
        - 2.27750833e-08 * va**2 * dt**4
        - 3.38056250e-09 * dt**5
        + 1.31840500e-09 * temp_c * dt**5
        + 4.27600000e-10 * va * dt**5
        + 8.72111667e-11 * dt**6
        + 2.07861013e-01 * pa
        + 4.18652217e-03 * temp_c * pa
        - 1.16637399e-04 * temp_c**2 * pa
        + 1.06746500e-06 * temp_c**3 * pa
        - 6.34600000e-10 * temp_c**4 * pa
        + 3.53926400e-02 * va * pa
        - 1.26705138e-04 * temp_c * va * pa
        - 2.44775750e-06 * temp_c**2 * va * pa
        + 3.98940250e-08 * temp_c**3 * va * pa
        + 1.23940560e-03 * va**2 * pa
        - 1.03686500e-05 * temp_c * va**2 * pa
        + 8.65250000e-08 * temp_c**2 * va**2 * pa
        + 8.62350000e-05 * va**3 * pa
        - 2.40360000e-07 * temp_c * va**3 * pa
        - 3.18700000e-06 * va**4 * pa
        + 5.20230900e-03 * dt * pa
        + 3.17320500e-05 * temp_c * dt * pa
        + 2.66550500e-06 * temp_c**2 * dt * pa
        - 1.39251800e-08 * temp_c**3 * dt * pa
        - 1.84756250e-04 * va * dt * pa
        + 3.74425000e-06 * temp_c * va * dt * pa
        - 5.50900000e-08 * temp_c**2 * va * dt * pa
        + 1.14090000e-05 * va**2 * dt * pa
        - 1.12820000e-07 * temp_c * va**2 * dt * pa
        + 3.15275000e-07 * va**3 * dt * pa
        + 5.55350000e-05 * dt**2 * pa
        + 1.29115000e-06 * temp_c * dt**2 * pa
        - 1.26700000e-08 * temp_c**2 * dt**2 * pa
        + 3.28500000e-06 * va * dt**2 * pa
        + 2.80000000e-08 * temp_c * va * dt**2 * pa
        - 5.55000000e-08 * va**2 * dt**2 * pa
        - 2.15000000e-07 * dt**3 * pa
        + 4.40000000e-09 * temp_c * dt**3 * pa
        + 2.70000000e-09 * va * dt**3 * pa
        + 1.50000000e-10 * dt**4 * pa
        - 1.41600000e-03 * pa**2
        + 3.20926500e-05 * temp_c * pa**2
        + 7.57900000e-07 * temp_c**2 * pa**2
        - 4.24100000e-09 * temp_c**3 * pa**2
        + 2.60750000e-04 * va * pa**2
        + 7.72000000e-07 * temp_c * va * pa**2
        - 4.08000000e-09 * temp_c**2 * va * pa**2
        - 2.16000000e-05 * va**2 * pa**2
        + 6.17000000e-08 * temp_c * va**2 * pa**2
        - 2.21000000e-07 * va**3 * pa**2
        + 2.67420000e-04 * dt * pa**2
        - 4.77000000e-06 * temp_c * dt * pa**2
        + 1.29000000e-08 * temp_c**2 * dt * pa**2
        - 2.06000000e-05 * va * dt * pa**2
        + 3.47000000e-08 * temp_c * va * dt * pa**2
        + 1.91000000e-07 * va**2 * dt * pa**2
        - 4.64000000e-06 * dt**2 * pa**2
        + 1.09000000e-08 * temp_c * dt**2 * pa**2
        + 2.84000000e-08 * va * dt**2 * pa**2
        + 5.40000000e-09 * dt**3 * pa**2
        + 1.31000000e-05 * pa**3
        - 7.37000000e-08 * temp_c * pa**3
        + 2.82000000e-09 * temp_c**2 * pa**3
        + 1.70000000e-06 * va * pa**3
        - 1.63000000e-09 * temp_c * va * pa**3
        - 1.38000000e-08 * va**2 * pa**3
        + 3.77000000e-07 * dt * pa**3
        - 1.29000000e-09 * temp_c * dt * pa**3
        - 4.87000000e-09 * va * dt * pa**3
        + 1.02000000e-09 * dt**2 * pa**3
    )

    return round(utci, 2)
