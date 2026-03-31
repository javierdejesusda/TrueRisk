"""In-memory tracker for data source health and freshness."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

# All known data sources that should always appear in the dashboard.
KNOWN_SOURCES = [
    "open_meteo",
    "nasa_firms",
    "ign_seismic",
    "aemet",
    "copernicus_ems",
    "copernicus_cams",
    "copernicus_land",
    "openaq",
    "saih",
    "usgs",
    "ree_energy",
    "ine_demographics",
    "nasa_power",
    "ecmwf_seasonal",
]

# Max acceptable age (minutes) per source before considered stale
STALENESS_THRESHOLDS: dict[str, int] = {
    "open_meteo": 30,
    "aemet": 30,
    "nasa_firms": 60,
    "usgs": 60,
    "ign_seismic": 60,
    "copernicus_cams": 120,
    "copernicus_ems": 120,
    "copernicus_land": 2880,
    "openaq": 60,
    "saih": 30,
    "ree_energy": 60,
    "ine_demographics": 2880,
    "nasa_power": 2880,
    "copernicus_efas": 1440,
    "ecmwf_seasonal": 2880,
}


class DataHealthTracker:
    """Tracks success/failure state for each external data source."""

    def __init__(self) -> None:
        self._sources: dict[str, dict[str, Any]] = {}

    def register_sources(self, names: list[str]) -> None:
        """Pre-register sources so they appear even before their first fetch."""
        for name in names:
            self._sources.setdefault(name, self._empty_entry())

    def record_success(self, source_name: str, records_count: int = 0) -> None:
        """Record a successful fetch for *source_name*."""
        entry = self._sources.setdefault(source_name, self._empty_entry())
        entry["last_success"] = datetime.now(tz=timezone.utc).isoformat()
        entry["consecutive_failures"] = 0
        entry["total_records_last_fetch"] = records_count

    def record_failure(self, source_name: str, error_message: str) -> None:
        """Record a failed fetch for *source_name*, incrementing the failure counter."""
        entry = self._sources.setdefault(source_name, self._empty_entry())
        entry["consecutive_failures"] += 1
        entry["last_failure"] = datetime.now(tz=timezone.utc).isoformat()
        entry["last_error_message"] = error_message

    def get_status(self, source_name: str) -> dict[str, Any] | None:
        """Return the current status dict for *source_name*, or None if unknown."""
        entry = self._sources.get(source_name)
        if entry is None:
            return None
        return dict(entry)

    def get_all_statuses(self) -> dict[str, dict[str, Any]]:
        """Return a shallow copy of all tracked source statuses."""
        return {name: dict(entry) for name, entry in self._sources.items()}

    # Internal helpers

    @staticmethod
    def _empty_entry() -> dict[str, Any]:
        return {
            "last_success": None,
            "last_failure": None,
            "consecutive_failures": 0,
            "last_error_message": None,
            "total_records_last_fetch": 0,
        }


# Module-level singleton used throughout the application.
health_tracker = DataHealthTracker()
health_tracker.register_sources(KNOWN_SOURCES)
