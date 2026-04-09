"""Simple in-memory TTL cache for hot data paths."""

from __future__ import annotations

import asyncio
import time
from typing import Any, Awaitable, Callable, TypeVar


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


T = TypeVar("T")


class Singleflight:
    """Coalesce concurrent calls for the same key into a single in-flight task.

    When many clients request the same uncached upstream resource at once
    (e.g. ``/api/v1/weather/current/03`` on a cold cache), without coalescing
    each request triggers its own outbound API call, causing thundering herds
    and upstream 429 rate limiting. Singleflight ensures only one call is in
    flight per key; all other callers await the same result.
    """

    def __init__(self) -> None:
        self._inflight: dict[str, asyncio.Future[Any]] = {}

    async def do(self, key: str, fn: Callable[[], Awaitable[T]]) -> T:
        existing = self._inflight.get(key)
        if existing is not None:
            return await existing  # type: ignore[return-value]

        loop = asyncio.get_running_loop()
        future: asyncio.Future[T] = loop.create_future()
        self._inflight[key] = future  # type: ignore[assignment]
        try:
            result = await fn()
        except BaseException as exc:  # noqa: BLE001 — propagate to waiters
            future.set_exception(exc)
            raise
        else:
            future.set_result(result)
            return result
        finally:
            self._inflight.pop(key, None)


# Shared cache instances
risk_cache = TTLCache(default_ttl=3600)       # Risk scores: 1 hour
province_cache = TTLCache(default_ttl=86400)  # Provinces: 24 hours (static data)
weather_cache = TTLCache(default_ttl=600)     # Weather: 10 minutes
weather_singleflight = Singleflight()
