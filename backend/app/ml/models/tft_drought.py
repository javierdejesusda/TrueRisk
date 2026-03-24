"""Drought risk TFT -- multi-horizon probabilistic forecast."""
from __future__ import annotations

from app.ml.models.tft_base import HazardTFT

STATIC_FEATURES = ["latitude", "elevation_m", "is_coastal"]
TIME_VARYING_KNOWN = ["month", "season_sin", "season_cos"]
TIME_VARYING_UNKNOWN = [
    "temperature",
    "precipitation",
    "soil_moisture",
    "humidity",
    "spei_1m",
    "spei_3m",
    "spei_6m",
    "et0",
    "consecutive_dry_days",
    "ndvi",
]

_tft = HazardTFT("drought")


def predict_drought_risk_tft(
    history_sequence: list[dict], static_features: dict
) -> dict | None:
    """Multi-horizon drought forecast. Returns None if TFT unavailable."""
    if not _tft.is_available:
        return None
    encoder_data = {
        f: [h.get(f, 0.0) for h in history_sequence]
        for f in TIME_VARYING_KNOWN + TIME_VARYING_UNKNOWN
    }
    return _tft.predict(encoder_data, static_features)
