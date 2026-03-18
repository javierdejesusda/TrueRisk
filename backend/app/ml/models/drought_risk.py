"""Drought risk model -- SPEI computation + LSTM trajectory prediction.

Two-stage approach:
1.  SPEI (Standardised Precipitation-Evapotranspiration Index) is used to
    quantify current drought severity at 1-month and 3-month time-scales.
2.  An LSTM model (when trained) predicts the probability that drought will
    persist or worsen over the next 30 days, given a 90-day sequence of daily
    observations.

A composite drought score is computed as a weighted blend of SPEI-derived
severity, LSTM outlook, and soil-moisture deficit.
"""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).parent.parent / "saved_models" / "drought_lstm.pt"

# The LSTM expects 90-day sequences with 6 features per timestep.
LSTM_FEATURE_NAMES: list[str] = [
    "temperature",
    "precipitation",
    "soil_moisture",
    "humidity",
    "spei_1m",
    "spei_3m",
]

_model = None


def _load_model():
    """Lazy-load the PyTorch LSTM model from disk (once)."""
    global _model
    if _model is None and MODEL_PATH.exists():
        try:
            import torch

            from app.ml.models.drought_lstm_arch import DroughtLSTM

            _model = DroughtLSTM()
            _model.load_state_dict(
                torch.load(MODEL_PATH, map_location="cpu", weights_only=True)
            )
            _model.train(False)
            logger.info("Loaded drought LSTM model from %s", MODEL_PATH)
        except Exception:
            logger.exception("Failed to load drought LSTM model from %s", MODEL_PATH)
    return _model


# ---------------------------------------------------------------------------
# SPEI -> score mapping (piecewise-linear interpolation)
# ---------------------------------------------------------------------------

_SPEI_THRESHOLDS: list[tuple[float, float]] = [
    # (spei_upper_bound, score)
    (-2.0, 100.0),
    (-1.5, 80.0),
    (-1.0, 60.0),
    (-0.5, 40.0),
    (0.0, 20.0),
]


def spei_to_score(spei: float) -> float:
    """Map an SPEI value to a 0--100 drought severity score.

    Uses linear interpolation between the defined thresholds.  Values beyond
    the table endpoints are clamped to 0 or 100.
    """
    if spei <= _SPEI_THRESHOLDS[0][0]:
        return 100.0
    if spei > _SPEI_THRESHOLDS[-1][0]:
        return 0.0

    for i in range(len(_SPEI_THRESHOLDS) - 1):
        lower_spei, lower_score = _SPEI_THRESHOLDS[i]
        upper_spei, upper_score = _SPEI_THRESHOLDS[i + 1]
        if lower_spei < spei <= upper_spei:
            # Linear interpolation within this bracket
            t = (spei - lower_spei) / (upper_spei - lower_spei)
            return lower_score + t * (upper_score - lower_score)

    return 0.0


# ---------------------------------------------------------------------------
# LSTM inference helper
# ---------------------------------------------------------------------------

def _lstm_predict(sequence: list[list[float]]) -> float:
    """Run the LSTM model on a 90-day sequence and return P(drought persists).

    Returns 0.0 when the model is unavailable or the sequence is too short.
    """
    model = _load_model()
    if model is None:
        return 0.0

    if len(sequence) < 90:
        logger.debug(
            "Drought LSTM requires 90 timesteps but got %d -- skipping", len(sequence)
        )
        return 0.0

    try:
        import torch

        # Shape: (1, 90, 6)
        arr = np.array(sequence[-90:], dtype=np.float32)
        tensor = torch.from_numpy(arr).unsqueeze(0)
        with torch.no_grad():
            output = model(tensor)
            # Expect a single sigmoid output or logit
            prob = float(torch.sigmoid(output).squeeze())
        return max(0.0, min(1.0, prob))
    except Exception:
        logger.exception("Drought LSTM inference failed")
        return 0.0


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def predict_drought_risk(features: dict, sequence: list[list[float]] | None = None) -> float:
    """Return a drought-risk score in the range 0--100.

    Parameters
    ----------
    features : dict
        Must include at least ``spei_3m``.  Optionally ``spei_1m``, ``spei_6m``,
        and ``soil_moisture``.
    sequence : list[list[float]] | None
        90-day daily sequence of ``[temperature, precipitation, soil_moisture,
        humidity, spei_1m, spei_3m]`` for the LSTM.  Pass *None* when
        historical data is unavailable.
    """
    spei_3m = features.get("spei_3m")
    spei_6m = features.get("spei_6m")

    # If SPEI values are available, use the composite formula
    if spei_3m is not None:
        spei_3m_score = spei_to_score(spei_3m)
        spei_6m_score = spei_to_score(spei_6m) if spei_6m is not None else spei_3m_score

        # LSTM trajectory prediction
        lstm_prob = _lstm_predict(sequence or [])

        # Soil deficit score: 0 at saturation (1.0), 100 at bone-dry (0.0)
        soil = features.get("soil_moisture", 0.3) or 0.3
        soil_deficit_score = max(0.0, min(100.0, (1.0 - soil) * 100))

        composite = (
            0.50 * spei_3m_score
            + 0.20 * spei_6m_score
            + 0.20 * lstm_prob * 100
            + 0.10 * soil_deficit_score
        )
        return min(100.0, max(0.0, round(composite, 2)))

    # Fallback: rule-based when SPEI is unavailable
    return _rule_based_drought(features)


# ---------------------------------------------------------------------------
# Rule-based fallback
# ---------------------------------------------------------------------------

def _rule_based_drought(f: dict) -> float:
    """Heuristic drought score from consecutive dry days and soil moisture."""
    score = 0.0

    # -- Consecutive dry days (proxy for SPEI) --------------------------------
    dry_days = f.get("consecutive_dry_days", 0) or 0
    if dry_days > 60:
        score += 50
    elif dry_days > 40:
        score += 40
    elif dry_days > 25:
        score += 30
    elif dry_days > 14:
        score += 20
    elif dry_days > 7:
        score += 10

    # -- Soil moisture --------------------------------------------------------
    soil = f.get("soil_moisture", 0.3) or 0.3
    if soil < 0.1:
        score += 25
    elif soil < 0.2:
        score += 18
    elif soil < 0.3:
        score += 10
    elif soil < 0.4:
        score += 5

    # -- High temperature amplifies drought ----------------------------------
    temperature = f.get("temperature", 20) or 20
    if temperature > 38:
        score += 10
    elif temperature > 33:
        score += 6
    elif temperature > 28:
        score += 3

    # -- Low humidity ---------------------------------------------------------
    humidity = f.get("humidity", 50) or 50
    if humidity < 20:
        score += 8
    elif humidity < 30:
        score += 5

    # -- Low recent precipitation ---------------------------------------------
    precip_30d = f.get("precipitation_30d", 30) or 30
    if precip_30d < 5:
        score += 10
    elif precip_30d < 15:
        score += 6
    elif precip_30d < 30:
        score += 3

    return min(100.0, max(0.0, round(score, 2)))
