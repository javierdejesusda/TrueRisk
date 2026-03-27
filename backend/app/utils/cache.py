"""Simple in-memory TTL cache for hot data paths."""

from __future__ import annotations

import time
from typing import Any


class TTLCache:
    """Thread-safe (GIL-protected) in-memory cache with per-key TTL."""

    def __init__(self, default_ttl: int = 300):
        self._store: dict[str, Any] = {}
        self._expiry: dict[str, float] = {}
        self._default_ttl = default_ttl

    def get(self, key: str) -> Any | None:
        if key in self._store:
            if time.monotonic() < self._expiry[key]:
                return self._store[key]
            del self._store[key]
            del self._expiry[key]
        return None

    def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        self._store[key] = value
        self._expiry[key] = time.monotonic() + (ttl or self._default_ttl)

    def invalidate(self, key: str) -> None:
        self._store.pop(key, None)
        self._expiry.pop(key, None)

    def clear(self) -> None:
        self._store.clear()
        self._expiry.clear()


# Shared cache instances
risk_cache = TTLCache(default_ttl=3600)       # Risk scores: 1 hour
province_cache = TTLCache(default_ttl=86400)  # Provinces: 24 hours (static data)
weather_cache = TTLCache(default_ttl=600)     # Weather: 10 minutes
