"""Windstorm risk TFT -- multi-horizon probabilistic forecast."""
from __future__ import annotations

from app.ml.models.tft_base import HazardTFT
from app.ml.models.windstorm_risk import FEATURE_NAMES

STATIC_FEATURES = ["elevation_m", "is_coastal", "is_mediterranean"]
TIME_VARYING_KNOWN = ["month", "season_sin", "season_cos"]
TIME_VARYING_UNKNOWN = [
    f
    for f in FEATURE_NAMES
    if f not in STATIC_FEATURES + TIME_VARYING_KNOWN
]

_tft = HazardTFT("windstorm")


def predict_windstorm_risk_tft(
    history_sequence: list[dict], static_features: dict
) -> dict | None:
    """Multi-horizon windstorm forecast. Returns None if TFT unavailable."""
    if not _tft.is_available:
        return None
    encoder_data = {
        f: [h.get(f, 0.0) for h in history_sequence] for f in TIME_VARYING_UNKNOWN
    }
    return _tft.predict(encoder_data, static_features)
