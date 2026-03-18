"""
Static terrain and geographic features for Spanish provinces.

Looks up pre-computed geographic attributes from the province seed data
without database access. All functions are pure.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    pass


def _get_provinces() -> dict[str, dict]:
    """Lazy import of PROVINCES to avoid triggering database init at
    module load time (province_data.py imports app.database at the
    top level)."""
    from app.data.province_data import PROVINCES  # noqa: WPS433
    return PROVINCES


# River-basin flood risk mapping (empirical, 0-1 scale)
_RIVER_BASIN_RISK: dict[str, float] = {
    "Segura": 0.8,
    "Júcar": 0.8,
    "Guadalquivir": 0.6,
    "Tajo": 0.5,
    "Ebro": 0.5,
    "Duero": 0.3,
    "Atlantic NW": 0.3,
    "Cantabric": 0.4,
    "Mediterranean": 0.7,
}

_DEFAULT_BASIN_RISK: float = 0.3


def _basin_risk(river_basin: str) -> float:
    """Resolve river-basin flood risk, handling composite basins like
    'Júcar/Segura' by taking the maximum risk across sub-basins.
    """
    if not river_basin:
        return _DEFAULT_BASIN_RISK

    parts = [part.strip() for part in river_basin.split("/")]
    risks = [_RIVER_BASIN_RISK.get(p, _DEFAULT_BASIN_RISK) for p in parts]
    return max(risks)


def get_terrain_features(province_code: str) -> dict[str, float | bool]:
    """Look up static terrain features for a province.

    Parameters
    ----------
    province_code : str
        INE 2-digit province code (e.g. "46" for Valencia, "28" for Madrid).

    Returns
    -------
    dict with keys:
        elevation        -- metres above sea level
        river_basin_risk -- flood risk factor (0-1) derived from the basin
        coastal          -- bool, whether the province has coastline
        mediterranean    -- bool, whether on the Mediterranean side
        latitude         -- decimal degrees
        longitude        -- decimal degrees

    Raises
    ------
    KeyError -- if province_code is not found in the province dataset.
    """
    data = _get_provinces().get(province_code)
    if data is None:
        raise KeyError(
            f"Unknown province code '{province_code}'. "
            f"Expected a 2-digit INE code (01-52)."
        )

    return {
        "elevation": data["elevation_m"],
        "river_basin_risk": _basin_risk(data["river_basin"]),
        "coastal": data["coastal"],
        "mediterranean": data["mediterranean"],
        "latitude": data["latitude"],
        "longitude": data["longitude"],
    }
