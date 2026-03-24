"""Prepare TimeSeriesDataSet-compatible data for TFT training.

Transforms daily historical data into pytorch_forecasting.TimeSeriesDataSet
format by reusing _load_and_enrich() from prepare_dataset.py.

Runnable as: python -m app.ml.training.prepare_tft_dataset
"""

from __future__ import annotations

import logging
import math
from pathlib import Path

import numpy as np
import pandas as pd

from app.data.province_data import PROVINCES
from app.ml.training.config import (
    DROUGHT_SPEI_THRESHOLD,
    FLOOD_PRECIP_HEAVY,
    FLOOD_PRECIP_MODERATE,
    FLOOD_SOIL_SATURATED,
    HEATWAVE_CONSECUTIVE_DAYS,
    HEATWAVE_MAX_THRESHOLD,
    HEATWAVE_MIN_THRESHOLD,
    PROCESSED_DIR,
    TFT_MAX_ENCODER_LENGTH,
    TFT_MAX_PREDICTION_LENGTH,
    WILDFIRE_DRY_DAYS_THRESHOLD,
    WILDFIRE_FWI_THRESHOLD,
    WILDFIRE_HUMIDITY_THRESHOLD,
)
from app.ml.training.prepare_dataset import _load_and_enrich

# Per-hazard feature splits
from app.ml.models.tft_flood import (
    STATIC_FEATURES as FLOOD_STATIC,
    TIME_VARYING_KNOWN as FLOOD_KNOWN,
    TIME_VARYING_UNKNOWN as FLOOD_UNKNOWN,
)
from app.ml.models.tft_wildfire import (
    STATIC_FEATURES as WILDFIRE_STATIC,
    TIME_VARYING_KNOWN as WILDFIRE_KNOWN,
    TIME_VARYING_UNKNOWN as WILDFIRE_UNKNOWN,
)
from app.ml.models.tft_heatwave import (
    STATIC_FEATURES as HEATWAVE_STATIC,
    TIME_VARYING_KNOWN as HEATWAVE_KNOWN,
    TIME_VARYING_UNKNOWN as HEATWAVE_UNKNOWN,
)
from app.ml.models.tft_drought import (
    STATIC_FEATURES as DROUGHT_STATIC,
    TIME_VARYING_KNOWN as DROUGHT_KNOWN,
    TIME_VARYING_UNKNOWN as DROUGHT_UNKNOWN,
)
from app.ml.models.tft_coldwave import (
    STATIC_FEATURES as COLDWAVE_STATIC,
    TIME_VARYING_KNOWN as COLDWAVE_KNOWN,
    TIME_VARYING_UNKNOWN as COLDWAVE_UNKNOWN,
)
from app.ml.models.tft_windstorm import (
    STATIC_FEATURES as WINDSTORM_STATIC,
    TIME_VARYING_KNOWN as WINDSTORM_KNOWN,
    TIME_VARYING_UNKNOWN as WINDSTORM_UNKNOWN,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)

TFT_DIR = PROCESSED_DIR / "tft"

# Feature-split registry keyed by hazard name
HAZARD_FEATURES: dict[str, dict[str, list[str]]] = {
    "flood": {
        "static": FLOOD_STATIC,
        "known": FLOOD_KNOWN,
        "unknown": FLOOD_UNKNOWN,
    },
    "wildfire": {
        "static": WILDFIRE_STATIC,
        "known": WILDFIRE_KNOWN,
        "unknown": WILDFIRE_UNKNOWN,
    },
    "heatwave": {
        "static": HEATWAVE_STATIC,
        "known": HEATWAVE_KNOWN,
        "unknown": HEATWAVE_UNKNOWN,
    },
    "drought": {
        "static": DROUGHT_STATIC,
        "known": DROUGHT_KNOWN,
        "unknown": DROUGHT_UNKNOWN,
    },
    "coldwave": {
        "static": COLDWAVE_STATIC,
        "known": COLDWAVE_KNOWN,
        "unknown": COLDWAVE_UNKNOWN,
    },
    "windstorm": {
        "static": WINDSTORM_STATIC,
        "known": WINDSTORM_KNOWN,
        "unknown": WINDSTORM_UNKNOWN,
    },
}

TARGET_COLS = {
    "flood": "flood_score",
    "wildfire": "wildfire_score",
    "heatwave": "heatwave_score",
    "drought": "drought_score",
    "coldwave": "coldwave_score",
    "windstorm": "windstorm_score",
}


# ---------------------------------------------------------------------------
# Continuous score helpers (sigmoid-like mapping from raw signals to 0-100)
# ---------------------------------------------------------------------------


def _sigmoid_scale(x: float, midpoint: float, steepness: float = 0.15) -> float:
    """Map a raw value to 0-100 via a sigmoid centred on *midpoint*."""
    z = steepness * (x - midpoint)
    z = max(min(z, 20.0), -20.0)  # clamp to avoid overflow
    return 100.0 / (1.0 + math.exp(-z))


def _compute_flood_score(row: pd.Series) -> float:
    """Continuous flood risk score 0-100 from precipitation & soil moisture."""
    precip = row.get("precip_24h", 0.0) or 0.0
    soil = row.get("soil_moisture", 0.3) or 0.3
    # Lower midpoints to spread target distribution (was 30/0.5/15)
    precip_signal = _sigmoid_scale(precip, FLOOD_PRECIP_MODERATE, steepness=0.15)
    soil_signal = _sigmoid_scale(soil, 0.35, steepness=10.0)
    moderate_boost = _sigmoid_scale(precip, 5.0, steepness=0.20)
    combined = 0.5 * precip_signal + 0.3 * soil_signal + 0.2 * moderate_boost
    return float(np.clip(combined, 0.0, 100.0))


def _compute_wildfire_score(row: pd.Series) -> float:
    """Continuous wildfire risk score 0-100 from FWI, dry days, humidity."""
    fwi = row.get("fwi", 0.0) or 0.0
    dry = row.get("consecutive_dry_days", 0) or 0
    hum_min = row.get("humidity_min_7d", 50.0) or 50.0
    fwi_sig = _sigmoid_scale(fwi, WILDFIRE_FWI_THRESHOLD, steepness=0.12)
    dry_sig = _sigmoid_scale(dry, WILDFIRE_DRY_DAYS_THRESHOLD, steepness=0.3)
    hum_sig = _sigmoid_scale(-hum_min, -WILDFIRE_HUMIDITY_THRESHOLD, steepness=0.15)
    combined = 0.5 * fwi_sig + 0.25 * dry_sig + 0.25 * hum_sig
    return float(np.clip(combined, 0.0, 100.0))


def _compute_heatwave_score(row: pd.Series) -> float:
    """Continuous heatwave risk score 0-100 from temperature extremes."""
    tmax = row.get("temp_max", 25.0) or 25.0
    tmin = row.get("temp_min", 15.0) or 15.0
    hot_days = row.get("consecutive_hot_days", 0) or 0
    tmax_sig = _sigmoid_scale(tmax, HEATWAVE_MAX_THRESHOLD, steepness=0.25)
    tmin_sig = _sigmoid_scale(tmin, HEATWAVE_MIN_THRESHOLD, steepness=0.3)
    streak_sig = _sigmoid_scale(hot_days, HEATWAVE_CONSECUTIVE_DAYS, steepness=0.6)
    combined = 0.4 * tmax_sig + 0.3 * tmin_sig + 0.3 * streak_sig
    return float(np.clip(combined, 0.0, 100.0))


def _compute_drought_score(row: pd.Series) -> float:
    """Continuous drought risk score 0-100 from SPEI and soil moisture."""
    spei = row.get("spei_3m", 0.0) or 0.0
    soil = row.get("soil_moisture", 0.3) or 0.3
    # SPEI is negative when dry; invert so lower SPEI -> higher score
    spei_sig = _sigmoid_scale(-spei, -DROUGHT_SPEI_THRESHOLD, steepness=1.5)
    soil_sig = _sigmoid_scale(-soil, -0.15, steepness=10.0)
    combined = 0.6 * spei_sig + 0.4 * soil_sig
    return float(np.clip(combined, 0.0, 100.0))


def _compute_coldwave_score(row: pd.Series) -> float:
    """Continuous cold wave risk score 0-100 from wind chill, temp min, streaks."""
    wind_chill = row.get("wind_chill", 10.0) or 10.0
    temp_min = row.get("temperature_min", 5.0) or 5.0
    cold_days = row.get("consecutive_cold_days", 0) or 0
    wc_sig = _sigmoid_scale(-wind_chill, 5.0, steepness=0.2)
    tm_sig = _sigmoid_scale(-temp_min, -2.0, steepness=0.25)
    cd_sig = _sigmoid_scale(cold_days, 3, steepness=0.5)
    combined = 0.4 * wc_sig + 0.3 * tm_sig + 0.3 * cd_sig
    return float(np.clip(combined, 0.0, 100.0))


def _compute_windstorm_score(row: pd.Series) -> float:
    """Continuous windstorm risk score 0-100 from wind gusts, speed, pressure."""
    gusts = row.get("wind_gusts", 0.0) or row.get("wind_gust_max", 0.0) or 0.0
    wind = row.get("wind_speed", 0.0) or 0.0
    p_change = row.get("pressure_tendency_1d", 0.0) or 0.0
    # Lower midpoints to spread target distribution (was 80/60/6)
    gust_sig = _sigmoid_scale(gusts, 45.0, steepness=0.08)
    wind_sig = _sigmoid_scale(wind, 30.0, steepness=0.10)
    pres_sig = _sigmoid_scale(-p_change, 3.0, steepness=0.5)
    combined = 0.5 * gust_sig + 0.25 * wind_sig + 0.25 * pres_sig
    return float(np.clip(combined, 0.0, 100.0))


SCORE_FUNCS = {
    "flood": _compute_flood_score,
    "wildfire": _compute_wildfire_score,
    "heatwave": _compute_heatwave_score,
    "drought": _compute_drought_score,
    "coldwave": _compute_coldwave_score,
    "windstorm": _compute_windstorm_score,
}


# ---------------------------------------------------------------------------
# Data loading and transformation
# ---------------------------------------------------------------------------


def load_combined_tft_dataframe() -> pd.DataFrame:
    """Load and enrich all provinces, add time_idx and target scores.

    Returns a single DataFrame with all provinces concatenated, sorted by
    (province_code, date), with an integer ``time_idx`` column.
    """
    codes = sorted(PROVINCES.keys())
    all_dfs: list[pd.DataFrame] = []

    logger.info("Loading and enriching %d provinces...", len(codes))
    for i, code in enumerate(codes):
        df = _load_and_enrich(code)
        if df is None:
            logger.warning("Province %s: no data, skipping", code)
            continue
        df = df.sort_values("date").reset_index(drop=True)
        all_dfs.append(df)
        if (i + 1) % 10 == 0 or i == len(codes) - 1:
            logger.info("  [%d/%d] provinces loaded", i + 1, len(codes))

    if not all_dfs:
        raise RuntimeError(
            "No province data found. Run download_historical.py first."
        )

    combined = pd.concat(all_dfs, ignore_index=True)
    combined.replace([np.inf, -np.inf], np.nan, inplace=True)

    # Sort globally by province then date to create monotonic time_idx per group
    combined.sort_values(["province_code", "date"], inplace=True)
    combined.reset_index(drop=True, inplace=True)

    # Create integer time_idx per province (0-based sequential days)
    combined["time_idx"] = combined.groupby("province_code").cumcount()

    # Compute continuous target scores
    logger.info("Computing target scores...")
    for hazard, func in SCORE_FUNCS.items():
        col = TARGET_COLS[hazard]
        combined[col] = combined.apply(func, axis=1).astype(np.float32)

    # Fill remaining NaN
    combined.fillna(0.0, inplace=True)

    logger.info(
        "Combined TFT dataset: %d rows, %d provinces",
        len(combined),
        combined["province_code"].nunique(),
    )
    return combined


def build_tft_dataset(hazard: str, combined: pd.DataFrame | None = None):
    """Build a pytorch_forecasting.TimeSeriesDataSet for the given hazard.

    Args:
        hazard: One of "flood", "wildfire", "heatwave", "drought".
        combined: Pre-loaded DataFrame (optional; loaded if not provided).

    Returns:
        A ``TimeSeriesDataSet`` ready for DataLoader creation.
    """
    from pytorch_forecasting import TimeSeriesDataSet

    if hazard not in HAZARD_FEATURES:
        raise ValueError(f"Unknown hazard '{hazard}'. Choose from {list(HAZARD_FEATURES)}")

    if combined is None:
        combined = load_combined_tft_dataframe()

    feat = HAZARD_FEATURES[hazard]
    target = TARGET_COLS[hazard]

    # Collect all feature columns needed
    all_features = list(
        dict.fromkeys(feat["static"] + feat["known"] + feat["unknown"])
    )

    # Ensure all columns exist
    missing = [c for c in all_features + [target] if c not in combined.columns]
    if missing:
        raise ValueError(f"Missing columns for {hazard} TFT: {missing}")

    # Subset columns
    keep_cols = ["time_idx", "province_code", "date", target] + all_features
    keep_cols = list(dict.fromkeys(keep_cols))  # deduplicate
    df = combined[keep_cols].copy()

    # Ensure province_code is string (group variable)
    df["province_code"] = df["province_code"].astype(str)

    # Determine max time_idx for training cutoff (needed for the dataset)
    max_time = df["time_idx"].max()
    training_cutoff = max_time - TFT_MAX_PREDICTION_LENGTH

    logger.info(
        "Building TimeSeriesDataSet for '%s': target=%s, "
        "%d static, %d known, %d unknown features, encoder=%d, decoder=%d",
        hazard,
        target,
        len(feat["static"]),
        len(feat["known"]),
        len(feat["unknown"]),
        TFT_MAX_ENCODER_LENGTH,
        TFT_MAX_PREDICTION_LENGTH,
    )

    # Determine which real-valued columns are time-varying vs static
    time_varying_known = [c for c in feat["known"] if c not in feat["static"]]
    time_varying_unknown = [c for c in feat["unknown"] if c not in feat["static"]]

    dataset = TimeSeriesDataSet(
        df[df["time_idx"] <= training_cutoff],
        time_idx="time_idx",
        target=target,
        group_ids=["province_code"],
        max_encoder_length=TFT_MAX_ENCODER_LENGTH,
        max_prediction_length=TFT_MAX_PREDICTION_LENGTH,
        static_reals=feat["static"] if feat["static"] else [],
        time_varying_known_reals=time_varying_known if time_varying_known else [],
        time_varying_unknown_reals=time_varying_unknown + [target],
        allow_missing_timesteps=True,
    )

    logger.info("TimeSeriesDataSet built: %d samples", len(dataset))
    return dataset


# ---------------------------------------------------------------------------
# Persist processed data
# ---------------------------------------------------------------------------


def save_processed(combined: pd.DataFrame) -> Path:
    """Save the combined TFT-ready DataFrame to disk."""
    TFT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = TFT_DIR / "tft_combined.parquet"
    combined.to_parquet(out_path, index=False)
    logger.info("Saved processed TFT data to %s", out_path)
    return out_path


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------


def main() -> None:
    logger.info("=== Preparing TFT datasets ===")

    combined = load_combined_tft_dataframe()
    save_processed(combined)

    # Validate that datasets can be built for each hazard
    for hazard in HAZARD_FEATURES:
        try:
            ds = build_tft_dataset(hazard, combined)
            logger.info("  %s: %d samples OK", hazard, len(ds))
        except Exception:
            logger.exception("  %s: FAILED to build dataset", hazard)

    logger.info("=== TFT dataset preparation complete ===")


if __name__ == "__main__":
    main()
