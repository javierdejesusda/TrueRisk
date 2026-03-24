"""Convenience wrapper for the Canadian FWI system.

Delegates to the Van Wagner (1987) implementation in
:mod:`app.ml.features.weather_indices`.  The wrapper uses parameter names
that match the weather data available in the risk service (e.g.
``temp_c``, ``humidity_pct``, ``wind_kmh``, ``rain_mm``).
"""

from __future__ import annotations

from app.ml.features.weather_indices import compute_fwi_system


def compute_fwi_components(
    temp_c: float,
    humidity_pct: float,
    wind_kmh: float,
    rain_mm: float,
    prev_ffmc: float = 85.0,
    prev_dmc: float = 6.0,
    prev_dc: float = 15.0,
    month: int | None = None,
) -> dict[str, float]:
    """Compute all six Canadian FWI system components.

    Parameters
    ----------
    temp_c : float
        Air temperature in degrees Celsius.
    humidity_pct : float
        Relative humidity in percent (0-100).
    wind_kmh : float
        Wind speed in km/h.
    rain_mm : float
        24-hour accumulated rainfall in mm.
    prev_ffmc : float
        Previous day's FFMC (default 85.0 -- standard spring startup).
    prev_dmc : float
        Previous day's DMC (default 6.0 -- standard spring startup).
    prev_dc : float
        Previous day's DC (default 15.0 -- standard spring startup).
    month : int or None
        Month number (1-12).  Used for day-length adjustments in DMC/DC.
        Defaults to ``1`` (January) when not provided.

    Returns
    -------
    dict[str, float]
        Keys: ``ffmc``, ``dmc``, ``dc``, ``isi``, ``bui``, ``fwi``.
    """
    if month is None:
        from datetime import datetime, timezone

        month = datetime.now(timezone.utc).month

    return compute_fwi_system(
        temp=temp_c,
        rh=humidity_pct,
        wind=wind_kmh,
        rain=rain_mm,
        prev_ffmc=prev_ffmc,
        prev_dmc=prev_dmc,
        prev_dc=prev_dc,
        month=month,
    )
