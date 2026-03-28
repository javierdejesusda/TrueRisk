"""Compute derived features from daily weather history for TFT inference.

Mirrors the feature engineering in prepare_dataset.py but operates on a list
of daily weather dicts rather than raw CSV files.  The output dicts contain
all features expected by the TFT models so that encoder_data can be built
directly via ``h.get(feature_name, 0.0)``.
"""

from __future__ import annotations

import math
from typing import Any

from app.ml.features.weather_indices import (
    compute_fwi_system,
    compute_heat_index,
    compute_spi,
    compute_utci,
    compute_wbgt,
)


def _safe(val, default: float = 0.0) -> float:
    if val is None or (isinstance(val, float) and (math.isnan(val) or math.isinf(val))):
        return default
    return float(val)


def _wind_chill(temp: float, wind_kmh: float) -> float:
    if temp > 10 or wind_kmh < 4.8:
        return temp
    return (
        13.12 + 0.6215 * temp
        - 11.37 * (wind_kmh ** 0.16)
        + 0.3965 * temp * (wind_kmh ** 0.16)
    )


def enrich_daily_history(
    days: list[dict[str, Any]],
    province_meta: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Add all derived features to a chronological list of daily weather dicts.

    Parameters
    ----------
    days : list[dict]
        Daily weather records in **chronological** order (oldest first).
        Expected keys (all optional, defaults applied):
            temp_max, temp_min, temp_mean, precip, wind_speed, wind_gust_max,
            humidity, humidity_min, pressure, soil_moisture, dew_point,
            cloud_cover, uv_index, et0, month
    province_meta : dict, optional
        Static province features (elevation_m, is_coastal, etc.).

    Returns
    -------
    list[dict] with all derived feature keys added.
    """
    n = len(days)
    if n == 0:
        return days

    # --- Extract arrays for vectorised rolling computations ----------------
    precip = [_safe(d.get("precip", 0.0)) for d in days]
    temp_max = [_safe(d.get("temp_max", 25.0), 25.0) for d in days]
    temp_min = [_safe(d.get("temp_min", 15.0), 15.0) for d in days]
    temp_mean = [_safe(d.get("temp_mean"), (temp_max[i] + temp_min[i]) / 2) for i, d in enumerate(days)]
    wind_speed = [_safe(d.get("wind_speed", 10.0), 10.0) for d in days]
    wind_gust = [_safe(d.get("wind_gust_max", 0.0) or d.get("wind_gusts", 0.0), wind_speed[i] * 1.5) for i, d in enumerate(days)]
    humidity = [_safe(d.get("humidity", 50.0), 50.0) for d in days]
    humidity_min = [_safe(d.get("humidity_min", humidity[i] - 10)) for i, d in enumerate(days)]
    pressure = [_safe(d.get("pressure", 1013.0), 1013.0) for d in days]
    soil_moisture = [_safe(d.get("soil_moisture", 0.3), 0.3) for d in days]
    dew_point = [_safe(d.get("dew_point", temp_mean[i] - 5)) for i, d in enumerate(days)]
    # cloud_cover and uv_index are passed through from raw dicts, not pre-extracted

    # --- Helper: rolling window ops ----------------------------------------
    def _rolling_sum(arr, window):
        out = []
        for i in range(len(arr)):
            start = max(0, i - window + 1)
            out.append(sum(arr[start:i + 1]))
        return out

    def _rolling_mean(arr, window, min_periods=1):
        out = []
        for i in range(len(arr)):
            start = max(0, i - window + 1)
            w = arr[start:i + 1]
            out.append(sum(w) / len(w) if len(w) >= min_periods else 0.0)
        return out

    def _rolling_min(arr, window):
        out = []
        for i in range(len(arr)):
            start = max(0, i - window + 1)
            out.append(min(arr[start:i + 1]))
        return out

    def _rolling_max(arr, window):
        out = []
        for i in range(len(arr)):
            start = max(0, i - window + 1)
            out.append(max(arr[start:i + 1]))
        return out

    def _rolling_std(arr, window):
        out = []
        for i in range(len(arr)):
            start = max(0, i - window + 1)
            w = arr[start:i + 1]
            if len(w) < 2:
                out.append(0.0)
            else:
                m = sum(w) / len(w)
                out.append((sum((x - m) ** 2 for x in w) / len(w)) ** 0.5)
        return out

    def _diff(arr, lag):
        return [arr[i] - arr[i - lag] if i >= lag else 0.0 for i in range(len(arr))]

    def _consecutive(condition: list[bool]) -> list[int]:
        out = []
        streak = 0
        for c in condition:
            streak = streak + 1 if c else 0
            out.append(streak)
        return out

    # --- Precipitation features --------------------------------------------
    precip_7d = _rolling_sum(precip, 7)
    precip_30d = _rolling_sum(precip, 30)
    precip_3d_mean = _rolling_mean(precip, 3)
    precip_7d_mean = _rolling_mean(precip, 7)
    precip_30d_mean = _rolling_mean(precip, 30, min_periods=7)

    # Antecedent Precipitation Index (K=0.85)
    api = [precip[0]]
    for i in range(1, n):
        api.append(0.85 * api[-1] + precip[i])

    # Antecedent Precipitation Index (K=0.92)
    api_092 = [precip[0]]
    for i in range(1, n):
        api_092.append(0.92 * api_092[-1] + precip[i])

    # Antecedent Precipitation Index (K=0.95)
    api_095 = [precip[0]]
    for i in range(1, n):
        api_095.append(0.95 * api_095[-1] + precip[i])

    # --- Pressure features -------------------------------------------------
    p_tend_1d = _diff(pressure, 1)
    p_tend_3d = _diff(pressure, 3)
    p_tend_7d = _diff(pressure, 7)
    p_min_3d = _rolling_min(pressure, 3)
    p_30d_mean = _rolling_mean(pressure, 30, min_periods=7)

    # --- Wind features -----------------------------------------------------
    gust_factor = [wind_gust[i] / max(wind_speed[i], 1.0) for i in range(n)]
    wind_var_3d = _rolling_std(wind_speed, 3)
    gust_ratio_7d = _rolling_mean(gust_factor, 7)

    # --- Temperature features ----------------------------------------------
    temp_min_7d = _rolling_min(temp_min, 7)
    temp_max_7d = _rolling_max(temp_max, 7)
    humidity_min_7d = _rolling_min(humidity_min, 7)
    temp_mean_30d = _rolling_mean(temp_mean, 30, min_periods=7)
    temp_max_3d_mean = _rolling_mean(temp_max, 3)

    # --- Streak features ---------------------------------------------------
    rain_days = [p > 1.0 for p in precip]
    dry_days = [p < 1.0 for p in precip]
    hot_days = [t > 30.0 for t in temp_max]
    hot_nights = [t > 20.0 for t in temp_min]
    cold_days_cond = [t < 5.0 for t in temp_max]
    cold_nights_cond = [t < 0.0 for t in temp_min]
    cold_mean_cond = [t < 5.0 for t in temp_mean]

    consec_rain = _consecutive(rain_days)
    consec_dry = _consecutive(dry_days)
    consec_hot = _consecutive(hot_days)
    consec_hot_night = _consecutive(hot_nights)
    consec_cold_day = _consecutive(cold_days_cond)
    consec_cold_night = _consecutive(cold_nights_cond)
    consec_cold_mean = _consecutive(cold_mean_cond)

    # Heat wave: 3+ consecutive days with max>35 AND min>20
    hw_cond = [temp_max[i] > 35.0 and temp_min[i] > 20.0 for i in range(n)]
    hw_streak = _consecutive(hw_cond)

    # Temperature trend (7-day linear slope)
    def _linear_slope_at(arr, i, window=7):
        start = max(0, i - window + 1)
        w = arr[start:i + 1]
        nn = len(w)
        if nn < 2:
            return 0.0
        x_mean = (nn - 1) / 2.0
        y_mean = sum(w) / nn
        num = sum((j - x_mean) * (w[j] - y_mean) for j in range(nn))
        den = sum((j - x_mean) ** 2 for j in range(nn))
        return num / den if den > 0 else 0.0

    temp_trend_7d = [_linear_slope_at(temp_mean, i) for i in range(n)]
    temp_drop_7d = [_rolling_max(temp_max, 7)[i] - temp_min[i] for i in range(n)]

    # --- FWI system (day-by-day state machine) -----------------------------
    ffmc_prev, dmc_prev, dc_prev = 85.0, 6.0, 15.0
    fwi_data: dict[str, list[float]] = {k: [] for k in ("ffmc", "dmc", "dc", "isi", "bui", "fwi")}
    for i in range(n):
        month = days[i].get("month", 6) or 6
        out = compute_fwi_system(
            temp=temp_mean[i], rh=humidity[i], wind=wind_speed[i],
            rain=precip[i], prev_ffmc=ffmc_prev, prev_dmc=dmc_prev,
            prev_dc=dc_prev, month=int(month),
        )
        for k in fwi_data:
            fwi_data[k].append(out[k])
        ffmc_prev, dmc_prev, dc_prev = out["ffmc"], out["dmc"], out["dc"]

    # --- SPEI / SPI approximation ------------------------------------------
    spei_1m = []
    spei_6m = []
    for i in range(n):
        w30 = precip[max(0, i - 29):i + 1]
        spei_1m.append(compute_spi(w30) if len(w30) >= 10 else 0.0)
        w180 = precip[max(0, i - 179):i + 1]
        spei_6m.append(compute_spi(w180) if len(w180) >= 30 else 0.0)

    # Monthly SPEI (3-month) approximation
    spei_3m_val = 0.0
    if n >= 30:
        w90 = precip[max(0, n - 90):]
        spei_3m_val = compute_spi(w90) if len(w90) >= 10 else 0.0

    # --- Heat indices ------------------------------------------------------
    heat_idx = [compute_heat_index(temp_max[i], humidity[i]) for i in range(n)]
    wbgt = [compute_wbgt(temp_max[i], humidity[i], wind_speed[i] / 3.6) for i in range(n)]
    utci = [compute_utci(temp_max[i], humidity[i], wind_speed[i] / 3.6) for i in range(n)]
    wind_chill = [_wind_chill(temp_mean[i], wind_speed[i]) for i in range(n)]

    # --- Enrich each day dict ----------------------------------------------
    enriched = []
    for i in range(n):
        d = dict(days[i])  # shallow copy

        # Raw field aliases (match training column names)
        d["temperature"] = temp_mean[i]
        d["temperature_max"] = temp_max[i]
        d["temperature_min"] = temp_min[i]
        d["precipitation"] = precip[i]
        d["wind_gusts"] = wind_gust[i]

        # Month / seasonal encoding
        month = d.get("month", 6) or 6
        d["month"] = month
        d["season_sin"] = math.sin(2 * math.pi * month / 12)
        d["season_cos"] = math.cos(2 * math.pi * month / 12)

        # Precipitation features
        d["precip_1h"] = precip[i] / 24
        d["precip_6h"] = precip[i] / 4
        d["precip_24h"] = precip[i]
        d["precip_48h"] = sum(precip[max(0, i - 1):i + 1])
        d["precip_7d"] = precip_7d[i]
        d["precip_30d"] = precip_30d[i]
        d["precip_momentum"] = precip_3d_mean[i]
        d["precipitation_7d"] = precip_7d[i]
        d["precipitation_30d"] = precip_30d[i]
        d["precipitation_6h"] = precip[i] / 4
        d["precip_7day_anomaly"] = (precip_7d_mean[i] - precip_30d_mean[i]) if precip_30d_mean[i] else 0.0
        d["max_precip_intensity_ratio"] = precip[i] / max(precip_7d_mean[i], 0.1)
        d["consecutive_rain_days"] = float(consec_rain[i])
        d["consecutive_dry_days"] = float(consec_dry[i])
        d["antecedent_precip_index"] = api[i]
        d["antecedent_precip_index_092"] = api_092[i]
        d["antecedent_precip_index_095"] = api_095[i]
        d["soil_saturation_excess"] = soil_moisture[i] * precip_7d[i] / 7.0

        # Pressure features
        d["pressure_tendency_1d"] = p_tend_1d[i]
        d["pressure_tendency_3d"] = p_tend_3d[i]
        d["pressure_tendency_7d"] = p_tend_7d[i]
        d["pressure_min_3d"] = p_min_3d[i]
        d["pressure_anomaly_30d"] = pressure[i] - p_30d_mean[i] if p_30d_mean[i] else 0.0

        # Soil moisture
        d["soil_moisture_change_24h"] = soil_moisture[i] - soil_moisture[i - 1] if i > 0 else 0.0
        d["dew_point_depression"] = temp_mean[i] - dew_point[i]

        # Wind features
        d["gust_factor"] = gust_factor[i]
        d["wind_variability_3d"] = wind_var_3d[i]
        d["gust_speed_ratio_7d"] = gust_ratio_7d[i]
        d["storm_energy_proxy"] = gust_factor[i] * min(abs(p_tend_1d[i]), 20.0)

        # Temperature features
        d["temperature_min_7d"] = temp_min_7d[i]
        d["temperature_max_7d"] = temp_max_7d[i]
        d["humidity_min_7d"] = humidity_min_7d[i]
        d["temperature_anomaly"] = temp_mean[i] - temp_mean_30d[i] if temp_mean_30d[i] else 0.0
        d["temp_max_trend"] = temp_max_3d_mean[i]

        # Streak features
        d["consecutive_hot_days"] = float(consec_hot[i])
        d["consecutive_hot_nights"] = float(consec_hot_night[i])
        d["heat_wave_day"] = float(hw_streak[i] >= 3)
        d["consecutive_cold_days"] = float(consec_cold_day[i])
        d["consecutive_cold_nights"] = float(consec_cold_night[i])
        d["cold_persistence"] = float(consec_cold_mean[i])
        d["temp_trend_7d"] = temp_trend_7d[i]
        d["temp_drop_7d"] = temp_drop_7d[i]

        # Heat / cold indices
        d["heat_index"] = heat_idx[i]
        d["wbgt"] = wbgt[i]
        d["utci"] = utci[i]
        d["wind_chill"] = wind_chill[i]

        # FWI system
        for k in fwi_data:
            d[k] = fwi_data[k][i]

        # SPEI
        d["spei_1m"] = spei_1m[i]
        d["spei_3m"] = spei_3m_val
        d["spei_6m"] = spei_6m[i]

        # Defaults for data not available at inference time
        d.setdefault("ndvi", 0.5)
        d.setdefault("ndvi_anomaly", 0.0)
        d.setdefault("solar_irradiance", 200.0)
        d.setdefault("et0", 3.0)

        enriched.append(d)

    return enriched
