"""Drought risk TFT -- multi-horizon probabilistic forecast."""
from __future__ import annotations

from app.ml.models.drought_risk import LSTM_FEATURE_NAMES as FEATURE_NAMES
from app.ml.models.tft_base import HazardTFT

STATIC_FEATURES: list[str] = []
TIME_VARYING_KNOWN: list[str] = []
TIME_VARYING_UNKNOWN = [
    f
    for f in FEATURE_NAMES
    if f not in STATIC_FEATURES + TIME_VARYING_KNOWN
]

_tft = HazardTFT("drought")


def predict_drought_risk_tft(
    history_sequence: list[dict], static_features: dict
) -> dict | None:
    """Multi-horizon drought forecast. Returns None if TFT unavailable."""
    if not _tft.is_available:
        return None
    encoder_data = {
        f: [h.get(f, 0.0) for h in history_sequence] for f in TIME_VARYING_UNKNOWN
    }
    return _tft.predict(encoder_data, static_features)
