"""Prepare per-model training datasets from raw historical CSVs.

Reads raw CSVs, computes derived features (FWI, SPEI, temporal streaks),
generates domain-threshold labels, and outputs per-model datasets whose
feature columns match FEATURE_NAMES from each inference file exactly.
"""

from __future__ import annotations

import math
import warnings

import numpy as np
import pandas as pd

from app.data.province_data import PROVINCES
from app.ml.features.weather_indices import (
    compute_fwi_system,
    compute_heat_index,
    compute_spei,
    compute_spi,
    compute_utci,
    compute_wbgt,
)
from app.ml.training.config import (
    DATA_DIR,
    DROUGHT_SEQUENCE_LENGTH,
    HEATWAVE_CONSECUTIVE_DAYS,
    HEATWAVE_MAX_THRESHOLD,
    HEATWAVE_MIN_THRESHOLD,
    PROCESSED_DIR,
    RAW_DIR,
)

warnings.filterwarnings("ignore", category=RuntimeWarning)

# River-basin risk mapping (from terrain_features.py)
_BASIN_RISK: dict[str, float] = {
    "Segura": 0.8, "Júcar": 0.8, "Júcar/Segura": 0.8, "Júcar/Turia": 0.8,
    "Mediterranean": 0.7, "Mediterranean/Guadalquivir": 0.7,
    "Guadalquivir": 0.6, "Guadiana": 0.6,
    "Tajo": 0.5, "Ebro": 0.5, "Ebro/Júcar": 0.5, "Júcar/Tajo": 0.5,
    "Duero/Ebro": 0.4, "Cantabric": 0.4,
    "Duero": 0.3, "Atlantic NW": 0.3, "Atlantic": 0.35,
    "Miño": 0.3, "Island": 0.5,
}


def _safe(val, default=0.0):
    """Return val if finite, else default."""
    if val is None or (isinstance(val, float) and (math.isnan(val) or math.isinf(val))):
        return default
    return val


def _consecutive_condition(series: pd.Series) -> pd.Series:
    """Count consecutive True values ending at each row."""
    groups = (~series).cumsum()
    return series.groupby(groups).cumsum().astype(int)


def _wind_chill(temp: float, wind_kmh: float) -> float:
    """NWS wind chill formula. Only applies when temp < 10C and wind > 4.8 km/h."""
    if temp > 10 or wind_kmh < 4.8:
        return temp
    return 13.12 + 0.6215 * temp - 11.37 * (wind_kmh ** 0.16) + 0.3965 * temp * (wind_kmh ** 0.16)


def _load_and_enrich(code: str) -> pd.DataFrame | None:
    """Load raw CSV for a province and compute all derived features."""
    path = RAW_DIR / f"{code}.csv"
    if not path.exists():
        return None

    df = pd.read_csv(path, parse_dates=["date"])
    if len(df) < 30:
        return None

    # Ensure province_code is a zero-padded string
    df["province_code"] = code

    prov = PROVINCES[code]

    # Rename columns for convenience
    col_map = {
        "temperature_2m_max": "temp_max",
        "temperature_2m_min": "temp_min",
        "temperature_2m_mean": "temp_mean",
        "precipitation_sum": "precip",
        "wind_speed_10m_max": "wind_speed",
        "wind_gusts_10m_max": "wind_gust_max",
        "relative_humidity_2m_mean": "humidity",
        "relative_humidity_2m_min": "humidity_min",
        "surface_pressure_mean": "pressure",
        "soil_moisture_0_to_7cm_mean": "soil_moisture",
        "dew_point_2m_mean": "dew_point",
        "cloud_cover_mean": "cloud_cover",
        "uv_index_max": "uv_index",
        "et0_fao_evapotranspiration": "et0",
    }
    df.rename(columns={k: v for k, v in col_map.items() if k in df.columns}, inplace=True)

    # Fill NaN with sensible defaults
    df["precip"] = df["precip"].fillna(0.0)
    df["soil_moisture"] = df["soil_moisture"].fillna(0.3)
    df["humidity"] = df["humidity"].fillna(50.0)
    df["humidity_min"] = df["humidity_min"].fillna(df["humidity"] - 10)
    df["cloud_cover"] = df["cloud_cover"].fillna(50.0)
    df["uv_index"] = df["uv_index"].fillna(5.0)
    df["wind_speed"] = df["wind_speed"].fillna(10.0)
    df["wind_gust_max"] = df["wind_gust_max"].fillna(df["wind_speed"] * 1.5)
    df["pressure"] = df["pressure"].fillna(1013.0)
    df["dew_point"] = df["dew_point"].fillna(df["temp_mean"] - 5 if "temp_mean" in df else 10.0)
    df["et0"] = df["et0"].fillna(3.0)
    df["temp_max"] = df["temp_max"].fillna(25.0)
    df["temp_min"] = df["temp_min"].fillna(15.0)
    df["temp_mean"] = df["temp_mean"].fillna((df["temp_max"] + df["temp_min"]) / 2)

    # -- NDVI data (from Copernicus Land historical download) --
    ndvi_path = RAW_DIR / "ndvi" / f"{code}.csv"
    if ndvi_path.exists():
        ndvi_df = pd.read_csv(ndvi_path, parse_dates=["date"])
        df = df.merge(ndvi_df[["date", "ndvi"]], on="date", how="left")
        df["ndvi"] = df["ndvi"].interpolate(method="linear").fillna(0.5)
        ndvi_rolling = df["ndvi"].rolling(30, min_periods=7).mean()
        df["ndvi_anomaly"] = (df["ndvi"] - ndvi_rolling).fillna(0.0)
    else:
        df["ndvi"] = 0.5
        df["ndvi_anomaly"] = 0.0

    # -- Solar irradiance (from NASA POWER historical download) --
    solar_path = RAW_DIR / "solar" / f"{code}.csv"
    if solar_path.exists():
        solar_df = pd.read_csv(solar_path, parse_dates=["date"])
        df = df.merge(solar_df[["date", "solar_irradiance"]], on="date", how="left")
        df["solar_irradiance"] = df["solar_irradiance"].interpolate(method="linear").fillna(200.0)
    else:
        df["solar_irradiance"] = 200.0

    # -- Temporal features --
    df["month"] = df["date"].dt.month
    df["season_sin"] = np.sin(2 * np.pi * df["month"] / 12)
    df["season_cos"] = np.cos(2 * np.pi * df["month"] / 12)

    # Precipitation rolling sums
    df["precip_1h"] = df["precip"] / 24  # rough hourly estimate
    df["precip_6h"] = df["precip"] / 4
    df["precip_24h"] = df["precip"]
    df["precip_48h"] = df["precip"].rolling(2, min_periods=1).sum()
    df["precip_7d"] = df["precip"].rolling(7, min_periods=1).sum()
    df["precip_30d"] = df["precip"].rolling(30, min_periods=1).sum()
    df["precip_momentum"] = df["precip"].rolling(3, min_periods=1).mean().fillna(0.0)

    # Flood: Antecedent Precipitation Index (exponential decay, K=0.85)
    precip_vals = df["precip"].tolist()
    api_values = [precip_vals[0] if precip_vals else 0.0]
    for i in range(1, len(df)):
        api_values.append(0.85 * api_values[-1] + precip_vals[i])
    df["antecedent_precip_index"] = api_values

    # Flood: multi-K Antecedent Precipitation Index (K=0.92, K=0.95)
    api_092 = [precip_vals[0] if precip_vals else 0.0]
    for i in range(1, len(df)):
        api_092.append(0.92 * api_092[-1] + precip_vals[i])
    df["antecedent_precip_index_092"] = api_092

    api_095 = [precip_vals[0] if precip_vals else 0.0]
    for i in range(1, len(df)):
        api_095.append(0.95 * api_095[-1] + precip_vals[i])
    df["antecedent_precip_index_095"] = api_095

    # Pressure tendency (daily data, so diff(1) = 1-day change)
    df["pressure_tendency_1d"] = df["pressure"].diff(1).fillna(0.0)

    # Soil moisture change
    df["soil_moisture_change_24h"] = df["soil_moisture"].diff(1).fillna(0.0)

    # Dew point depression
    df["dew_point_depression"] = df["temp_mean"] - df["dew_point"]

    # 7-day precip anomaly (vs 30-day rolling mean)
    rolling_mean = df["precip"].rolling(30, min_periods=7).mean().fillna(df["precip"].mean())
    df["precip_7day_anomaly"] = df["precip_7d"] / 7 - rolling_mean
    df["precip_7day_anomaly"] = df["precip_7day_anomaly"].fillna(0.0)

    # Flood: soil saturation excess (interaction of wet soil + recent rain)
    df["soil_saturation_excess"] = (
        df["soil_moisture"] * df["precip_7d"] / 7.0
    ).fillna(0.0)

    # Consecutive streak features
    df["is_rain"] = df["precip"] > 1.0
    df["is_dry"] = df["precip"] < 1.0
    df["is_hot_day"] = df["temp_max"] > 30.0
    df["is_hot_night"] = df["temp_min"] > 20.0

    df["consecutive_rain_days"] = _consecutive_condition(df["is_rain"])
    df["consecutive_dry_days"] = _consecutive_condition(df["is_dry"])
    df["consecutive_hot_days"] = _consecutive_condition(df["is_hot_day"])
    df["consecutive_hot_nights"] = _consecutive_condition(df["is_hot_night"])

    # Cold wave features
    df["is_cold_day"] = df["temp_max"] < 5.0
    df["is_cold_night"] = df["temp_min"] < 0.0
    df["consecutive_cold_days"] = _consecutive_condition(df["is_cold_day"])
    df["consecutive_cold_nights"] = _consecutive_condition(df["is_cold_night"])
    df["temperature_min_7d"] = df["temp_min"].rolling(7, min_periods=1).min()
    df["wind_chill"] = df.apply(
        lambda r: _wind_chill(_safe(r["temp_mean"], 10.0), _safe(r["wind_speed"], 10.0)),
        axis=1,
    )

    # Coldwave: temperature trend and persistence
    df["temp_trend_7d"] = df["temp_mean"].rolling(7, min_periods=2).apply(
        lambda x: np.polyfit(range(len(x)), x, 1)[0], raw=False
    ).fillna(0.0)
    df["is_cold_mean"] = df["temp_mean"] < 5.0
    df["cold_persistence"] = _consecutive_condition(df["is_cold_mean"])
    df.drop(columns=["is_cold_mean"], inplace=True, errors="ignore")
    df["temp_drop_7d"] = df["temp_max"].rolling(7, min_periods=1).max() - df["temp_min"]

    # Windstorm features
    df["wind_gusts"] = df["wind_gust_max"]
    df["precipitation_6h"] = df["precip"] / 4
    df["gust_factor"] = (df["wind_gust_max"] / df["wind_speed"].clip(lower=1.0)).fillna(1.0)
    df["wind_variability_3d"] = df["wind_speed"].rolling(3, min_periods=1).std().fillna(0.0)
    df["pressure_tendency_3d"] = df["pressure"].diff(3).fillna(0.0)
    df["pressure_min_3d"] = df["pressure"].rolling(3, min_periods=1).min()
    df["gust_speed_ratio_7d"] = (
        df["wind_gust_max"] / df["wind_speed"].clip(lower=1.0)
    ).rolling(7, min_periods=1).mean().fillna(1.0)
    df["pressure_tendency_7d"] = df["pressure"].diff(7).fillna(0.0)
    df["storm_energy_proxy"] = (
        df["gust_factor"] * df["pressure_tendency_1d"].abs().clip(upper=20.0)
    ).fillna(0.0)
    pressure_clim = df["pressure"].rolling(30, min_periods=7).mean()
    df["pressure_anomaly_30d"] = (df["pressure"] - pressure_clim).fillna(0.0)

    # Max precip intensity ratio
    df["max_precip_intensity_ratio"] = (
        df["precip"] / df["precip"].rolling(7, min_periods=1).mean().clip(lower=0.1)
    )

    # -- Geographic / terrain features (constant per province) --
    df["elevation_m"] = prov["elevation_m"]
    df["is_coastal"] = float(prov["coastal"])
    df["is_mediterranean"] = float(prov["mediterranean"])
    df["latitude"] = prov["latitude"]
    basin = prov["river_basin"]
    df["river_basin_risk"] = _BASIN_RISK.get(basin, 0.4)

    # -- FWI system (day by day) --
    ffmc_prev, dmc_prev, dc_prev = 85.0, 6.0, 15.0
    fwi_cols: dict[str, list[float]] = {"ffmc": [], "dmc": [], "dc": [], "isi": [], "bui": [], "fwi": []}
    for _, row in df.iterrows():
        fwi_out = compute_fwi_system(
            temp=_safe(row["temp_mean"], 20.0),
            rh=_safe(row["humidity"], 50.0),
            wind=_safe(row["wind_speed"], 10.0),
            rain=_safe(row["precip"], 0.0),
            prev_ffmc=ffmc_prev,
            prev_dmc=dmc_prev,
            prev_dc=dc_prev,
            month=int(row["month"]),
        )
        for k in fwi_cols:
            fwi_cols[k].append(fwi_out[k])
        ffmc_prev = fwi_out["ffmc"]
        dmc_prev = fwi_out["dmc"]
        dc_prev = fwi_out["dc"]

    for k, v in fwi_cols.items():
        df[k] = v

    # -- Heat indices --
    df["heat_index"] = df.apply(
        lambda r: compute_heat_index(_safe(r["temp_max"], 25.0), _safe(r["humidity"], 50.0)),
        axis=1,
    )
    df["wbgt"] = df.apply(
        lambda r: compute_wbgt(
            _safe(r["temp_max"], 25.0),
            _safe(r["humidity"], 50.0),
            _safe(r["wind_speed"], 10.0) / 3.6,
        ),
        axis=1,
    )
    df["utci"] = df.apply(
        lambda r: compute_utci(
            _safe(r["temp_max"], 25.0),
            _safe(r["humidity"], 50.0),
            _safe(r["wind_speed"], 10.0) / 3.6,
        ),
        axis=1,
    )

    # Heat wave day: 3+ consecutive days with max > 35 AND min > 20
    hw_condition = (df["temp_max"] > HEATWAVE_MAX_THRESHOLD) & (df["temp_min"] > HEATWAVE_MIN_THRESHOLD)
    hw_streak = _consecutive_condition(hw_condition)
    df["heat_wave_day"] = (hw_streak >= HEATWAVE_CONSECUTIVE_DAYS).astype(float)

    # Temperature anomaly (vs 30-day rolling mean)
    temp_rolling = df["temp_mean"].rolling(30, min_periods=7).mean()
    df["temperature_anomaly"] = df["temp_mean"] - temp_rolling
    df["temperature_anomaly"] = df["temperature_anomaly"].fillna(0.0)

    # Temperature trend proxy (backward-looking, no data leakage)
    df["temp_max_trend"] = df["temp_max"].rolling(3, min_periods=1).mean().fillna(df["temp_max"])

    # Rolling max/min for wildfire
    df["temperature_max_7d"] = df["temp_max"].rolling(7, min_periods=1).max()
    df["humidity_min_7d"] = df["humidity_min"].rolling(7, min_periods=1).min()
    df["precipitation_7d"] = df["precip_7d"]
    df["precipitation_30d"] = df["precip_30d"]

    # -- SPEI (monthly, for drought) --
    # Compute monthly aggregates
    df["year_month"] = df["date"].dt.to_period("M")
    monthly = df.groupby("year_month").agg(
        precip_monthly=("precip", "sum"),
        temp_monthly=("temp_mean", "mean"),
    ).reset_index()

    # Compute SPEI for each month
    spei_vals = []
    for i in range(len(monthly)):
        precip_so_far = monthly["precip_monthly"].iloc[: i + 1].tolist()
        temp_so_far = monthly["temp_monthly"].iloc[: i + 1].tolist()
        if len(precip_so_far) >= 10:
            spei_val = compute_spei(precip_so_far, temp_so_far, prov["latitude"])
        else:
            spei_val = 0.0
        spei_vals.append(spei_val)

    monthly["spei"] = spei_vals

    # Map SPEI back to daily
    month_spei_map = dict(zip(monthly["year_month"], monthly["spei"]))
    df["spei_3m"] = df["year_month"].map(month_spei_map).fillna(0.0)
    # 1-month SPEI approximation: use SPI on last 30 days precipitation
    spei_1m_vals = []
    precip_list = df["precip"].tolist()
    for i in range(len(df)):
        window = precip_list[max(0, i - 29) : i + 1]
        if len(window) >= 10:
            spei_1m_vals.append(compute_spi(window))
        else:
            spei_1m_vals.append(0.0)
    df["spei_1m"] = spei_1m_vals

    # 6-month SPEI (longer-term water deficit signal for drought)
    spei_6m_vals = []
    for i in range(len(df)):
        window = precip_list[max(0, i - 179) : i + 1]
        if len(window) >= 30:
            spei_6m_vals.append(compute_spi(window))
        else:
            spei_6m_vals.append(0.0)
    df["spei_6m"] = spei_6m_vals

    # Also rename some columns to match model feature names exactly
    df["temperature"] = df["temp_mean"]
    df["temperature_max"] = df["temp_max"]
    df["temperature_min"] = df["temp_min"]
    df["precipitation"] = df["precip"]

    df.drop(
        columns=[
            "year_month", "is_rain", "is_dry", "is_hot_day", "is_hot_night",
            "is_cold_day", "is_cold_night",
        ],
        inplace=True,
        errors="ignore",
    )

    return df


# ---------------------------------------------------------------------------
# Label generation -- ground truth from real event data
# ---------------------------------------------------------------------------

_EVENTS_DIR = DATA_DIR / "events"


def _load_event_labels(event_file: str, combined: pd.DataFrame) -> pd.Series:
    """Load binary labels from a real-event CSV and join to the combined df.

    Event CSVs have columns: date, province_code (+ optional severity).
    Returns a Series of 0/1 aligned to `combined`.
    """
    path = _EVENTS_DIR / event_file
    if not path.exists():
        raise FileNotFoundError(
            f"Event file {path} not found. Run download_events.py first."
        )

    events = pd.read_csv(path, parse_dates=["date"])
    events["province_code"] = events["province_code"].astype(str).str.zfill(2)

    # Create a set of (date, province_code) tuples for fast lookup
    event_set = set(zip(events["date"].dt.date, events["province_code"]))

    labels = combined.apply(
        lambda r: 1 if (r["date"].date(), r["province_code"]) in event_set else 0,
        axis=1,
    )
    return labels


# ---------------------------------------------------------------------------
# Dataset builders
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Feature names -- must match inference files exactly.
# Same 23/18/20/6 features the inference code expects.
# ---------------------------------------------------------------------------

FLOOD_FEATURES = [
    "precip_1h", "precip_6h", "precip_24h", "precip_48h",
    "precip_momentum", "humidity", "soil_moisture",
    "soil_moisture_change_24h", "wind_speed", "pressure",
    "pressure_tendency_1d", "dew_point_depression", "cloud_cover",
    "elevation_m", "is_coastal", "is_mediterranean", "river_basin_risk",
    "month", "season_sin", "season_cos", "precip_7day_anomaly",
    "consecutive_rain_days", "max_precip_intensity_ratio",
    "antecedent_precip_index", "antecedent_precip_index_092",
    "antecedent_precip_index_095", "soil_saturation_excess",
]

HEATWAVE_FEATURES = [
    "temperature", "temperature_max", "temperature_min", "heat_index", "wbgt",
    "utci", "consecutive_hot_days", "consecutive_hot_nights", "heat_wave_day",
    "humidity", "wind_speed", "uv_index", "temperature_anomaly",
    "temp_max_trend", "month", "latitude", "elevation_m",
    "is_coastal", "cloud_cover", "solar_irradiance",
]

WILDFIRE_FEATURES = [
    "ffmc", "dmc", "dc", "isi", "bui", "fwi",
    "temperature", "temperature_max_7d", "humidity", "humidity_min_7d",
    "wind_speed", "wind_gust_max", "precipitation_7d", "precipitation_30d",
    "consecutive_dry_days", "soil_moisture", "uv_index", "elevation_m",
    "month", "is_coastal", "ndvi", "ndvi_anomaly",
]

DROUGHT_LSTM_FEATURES = [
    "temperature", "precipitation", "soil_moisture",
    "humidity", "spei_1m", "spei_3m",
]

COLDWAVE_FEATURES = [
    "temperature", "temperature_min", "temperature_min_7d", "wind_chill",
    "consecutive_cold_days", "consecutive_cold_nights", "humidity",
    "wind_speed", "precip_24h", "month", "latitude", "elevation_m",
    "is_coastal", "cloud_cover", "season_sin", "season_cos",
    "temp_trend_7d", "cold_persistence", "temp_drop_7d",
]

WINDSTORM_FEATURES = [
    "wind_speed", "wind_gusts", "gust_factor", "wind_variability_3d",
    "pressure", "pressure_tendency_1d", "pressure_tendency_3d",
    "pressure_min_3d", "humidity", "precipitation_6h",
    "gust_speed_ratio_7d", "pressure_tendency_7d", "storm_energy_proxy",
    "pressure_anomaly_30d", "is_coastal", "is_mediterranean",
    "elevation_m", "month", "season_sin", "season_cos",
]


def main() -> None:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    codes = sorted(PROVINCES.keys())
    all_dfs: list[pd.DataFrame] = []

    print(f"Processing {len(codes)} provinces...")
    for i, code in enumerate(codes):
        df = _load_and_enrich(code)
        if df is not None:
            all_dfs.append(df)
            print(f"  [{i + 1}/{len(codes)}] Province {code}: {len(df)} rows")
        else:
            print(f"  [{i + 1}/{len(codes)}] Province {code}: SKIPPED (no data)")

    if not all_dfs:
        print("ERROR: No data loaded. Run download_historical.py first.")
        return

    combined = pd.concat(all_dfs, ignore_index=True)
    print(f"\nCombined dataset: {len(combined)} rows")

    # Replace inf with NaN, then fill
    combined.replace([np.inf, -np.inf], np.nan, inplace=True)

    # ===================================================================
    # Labels from real event data (no data leakage)
    # ===================================================================
    print("\nLoading ground-truth event labels...")

    # --- Flood dataset (real GloFAS discharge exceedance labels) ---
    flood_label = _load_event_labels("flood_events.csv", combined)
    flood_df = combined[FLOOD_FEATURES].copy()
    flood_df.fillna(0.0, inplace=True)
    flood_df["label"] = flood_label
    flood_df.to_csv(PROCESSED_DIR / "flood_train.csv", index=False)
    pos_rate = flood_label.mean() * 100
    print(f"Flood:    {len(flood_df)} rows, {pos_rate:.1f}% positive (GloFAS discharge)")

    # --- Heatwave dataset (real WMO P95 exceedance labels) ---
    hw_label = _load_event_labels("heatwave_events.csv", combined)
    hw_df = combined[HEATWAVE_FEATURES].copy()
    hw_df.fillna(0.0, inplace=True)
    hw_df["label"] = hw_label
    hw_df.to_csv(PROCESSED_DIR / "heatwave_train.csv", index=False)
    pos_rate = hw_label.mean() * 100
    print(f"Heatwave: {len(hw_df)} rows, {pos_rate:.1f}% positive (WMO P95)")

    # --- Wildfire dataset (real satellite/proxy fire detection labels) ---
    wf_label = _load_event_labels("wildfire_events.csv", combined)
    wf_df = combined[WILDFIRE_FEATURES].copy()
    wf_df.fillna(0.0, inplace=True)
    wf_df["label"] = wf_label
    wf_df.to_csv(PROCESSED_DIR / "wildfire_train.csv", index=False)
    pos_rate = wf_label.mean() * 100
    print(f"Wildfire: {len(wf_df)} rows, {pos_rate:.1f}% positive (satellite proxy)")

    # --- Cold Wave dataset (P5 Tmin exceedance labels) ---
    cw_label = _load_event_labels("coldwave_events.csv", combined)
    cw_df = combined[COLDWAVE_FEATURES].copy()
    cw_df.fillna(0.0, inplace=True)
    cw_df["label"] = cw_label
    cw_df.to_csv(PROCESSED_DIR / "coldwave_train.csv", index=False)
    pos_rate = cw_label.mean() * 100
    print(f"Coldwave: {len(cw_df)} rows, {pos_rate:.1f}% positive (P5 Tmin)")

    # --- Windstorm dataset (P99 gust exceedance labels) ---
    ws_label = _load_event_labels("windstorm_events.csv", combined)
    ws_df = combined[WINDSTORM_FEATURES].copy()
    ws_df.fillna(0.0, inplace=True)
    ws_df["label"] = ws_label
    ws_df.to_csv(PROCESSED_DIR / "windstorm_train.csv", index=False)
    pos_rate = ws_label.mean() * 100
    print(f"Windstorm: {len(ws_df)} rows, {pos_rate:.1f}% positive (P99 gusts)")

    # --- Drought LSTM sequences (real soil-moisture deficit labels) ---
    print("\nBuilding drought LSTM sequences...")
    drought_events = pd.read_csv(
        _EVENTS_DIR / "drought_events.csv", parse_dates=["date"]
    )
    drought_events["province_code"] = drought_events["province_code"].astype(str).str.zfill(2)
    drought_event_set = set(
        zip(drought_events["date"].dt.date, drought_events["province_code"])
    )

    sequences_X: list[np.ndarray] = []
    sequences_y: list[int] = []

    for code in codes:
        prov_data = combined[combined["province_code"] == code].sort_values("date").reset_index(drop=True)
        if len(prov_data) < DROUGHT_SEQUENCE_LENGTH + 1:
            continue

        feat_matrix = prov_data[DROUGHT_LSTM_FEATURES].fillna(0.0).values

        for start in range(0, len(prov_data) - DROUGHT_SEQUENCE_LENGTH):
            end = start + DROUGHT_SEQUENCE_LENGTH
            seq = feat_matrix[start:end]

            # Label: is the target day a drought event day?
            target_date = prov_data.iloc[end]["date"].date()
            label = 1 if (target_date, code) in drought_event_set else 0

            sequences_X.append(seq)
            sequences_y.append(label)

    X_arr = np.array(sequences_X, dtype=np.float32)
    y_arr = np.array(sequences_y, dtype=np.int64)

    # Replace any NaN/inf in the array
    X_arr = np.nan_to_num(X_arr, nan=0.0, posinf=0.0, neginf=0.0)

    np.savez(
        PROCESSED_DIR / "drought_sequences.npz",
        X=X_arr,
        y=y_arr,
    )
    pos_rate = y_arr.mean() * 100
    print(f"Drought:  {len(y_arr)} sequences ({X_arr.shape}), {pos_rate:.1f}% positive (soil deficit)")

    print("\nAll datasets saved to", PROCESSED_DIR)


if __name__ == "__main__":
    main()
