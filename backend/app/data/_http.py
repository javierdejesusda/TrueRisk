"""Resilient HTTP GET with retry and structured timeouts for data sources."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from typing import Any

import httpx
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
    before_sleep_log,
)

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class SourceTimeout:
    """Per-source connect and read timeout configuration."""
    connect: float = 5.0
    read: float = 25.0


TIMEOUTS: dict[str, SourceTimeout] = {
    "open_meteo":           SourceTimeout(connect=5.0, read=25.0),
    "open_meteo_upper_air": SourceTimeout(connect=5.0, read=10.0),
    "aemet":                SourceTimeout(connect=5.0, read=25.0),
    "nasa_firms":           SourceTimeout(connect=5.0, read=25.0),
    "usgs":                 SourceTimeout(connect=5.0, read=25.0),
    "ign_seismic":          SourceTimeout(connect=5.0, read=10.0),
    "copernicus_efas":      SourceTimeout(connect=10.0, read=50.0),
    "copernicus_cams":      SourceTimeout(connect=5.0, read=25.0),
    "copernicus_land":      SourceTimeout(connect=10.0, read=50.0),
    "copernicus_ems":       SourceTimeout(connect=5.0, read=25.0),
    "openaq":               SourceTimeout(connect=5.0, read=25.0),
    "ree_energy":           SourceTimeout(connect=5.0, read=25.0),
    "ine_demographics":     SourceTimeout(connect=5.0, read=25.0),
    "nasa_power":           SourceTimeout(connect=5.0, read=25.0),
    "ecmwf_seasonal":       SourceTimeout(connect=10.0, read=50.0),
    "saih":                 SourceTimeout(connect=5.0, read=25.0),
}

# Maximum concurrent outbound requests allowed per source. Open-Meteo's
# free tier rate-limits aggressively; capping concurrency prevents the
# scheduler + user traffic from bursting past the quota.
_SOURCE_CONCURRENCY: dict[str, int] = {
    "open_meteo": 4,
    "aemet":      2,
    "nasa_firms": 3,
    "usgs":       4,
}
_DEFAULT_CONCURRENCY = 8

_RETRYABLE_STATUS_CODES = frozenset({429, 500, 502, 503, 504})

_MAX_RETRY_AFTER = 120.0  # Cap Retry-After to 2 minutes

# Shared async client pool — one httpx.AsyncClient per (loop, source, follow)
# key. Reusing clients keeps the connection pool warm (no TLS handshake per
# request) and is roughly 3-5x faster than the "new client per call" pattern
# the previous implementation used. Keyed by event-loop id so pytest-asyncio
# tests don't reuse a client bound to a closed loop.
_clients: dict[str, httpx.AsyncClient] = {}
_semaphores: dict[str, asyncio.Semaphore] = {}


class RetryableHTTPStatusError(Exception):
    """Raised when an HTTP response has a retryable status code."""
    def __init__(self, response: httpx.Response):
        self.response = response
        super().__init__(f"HTTP {response.status_code}")


def _parse_retry_after(response: httpx.Response) -> float | None:
    """Extract the delay (in seconds) from a Retry-After header, if present."""
    value = response.headers.get("retry-after")
    if not value:
        return None
    try:
        seconds = float(value)
        return min(max(seconds, 0), _MAX_RETRY_AFTER)
    except ValueError:
        return None


def _semaphore_for(source: str) -> asyncio.Semaphore:
    """Return a concurrency semaphore for ``source`` bound to the current loop.

    Like ``httpx.AsyncClient``, ``asyncio.Semaphore`` is bound to the event
    loop it is first touched on; sharing one across loops raises the same
    "Event loop is closed" error. Keying by loop id keeps each loop isolated.
    """
    loop_id = id(asyncio.get_running_loop())
    key = f"{loop_id}:{source}"
    sem = _semaphores.get(key)
    if sem is None:
        limit = _SOURCE_CONCURRENCY.get(source, _DEFAULT_CONCURRENCY)
        sem = asyncio.Semaphore(limit)
        _semaphores[key] = sem
    return sem


def _get_client(source: str, follow_redirects: bool) -> httpx.AsyncClient:
    """Return a pooled httpx.AsyncClient for the given source.

    The pool is keyed by (event loop id, source, follow_redirects) because
    httpx.AsyncClient binds its transport to the event loop that first
    touches it. Reusing a client across loops (e.g. between pytest-asyncio
    tests) raises ``RuntimeError: Event loop is closed``. Including the
    loop id ensures every loop gets its own client while still enjoying
    connection pooling within that loop.

    No lock is needed: the dict mutation is fast and the worst case on a
    rare race is that two clients are briefly created for the same key —
    the loser is garbage collected without ever opening a connection.
    """
    loop_id = id(asyncio.get_running_loop())
    pool_key = f"{loop_id}:{source}:{'r' if follow_redirects else 'n'}"
    client = _clients.get(pool_key)
    if client is not None and not client.is_closed:
        return client

    timeout_cfg = TIMEOUTS.get(source, SourceTimeout())
    client = httpx.AsyncClient(
        timeout=httpx.Timeout(
            connect=timeout_cfg.connect,
            read=timeout_cfg.read,
            write=5.0,
            pool=5.0,
        ),
        follow_redirects=follow_redirects,
        limits=httpx.Limits(
            max_connections=16,
            max_keepalive_connections=8,
            keepalive_expiry=30.0,
        ),
    )
    _clients[pool_key] = client
    return client


async def close_clients() -> None:
    """Close pooled httpx clients and drop semaphores bound to the current loop.

    Both ``_clients`` and ``_semaphores`` are keyed by event-loop id. If we
    only purged ``_clients``, the ``_semaphores`` dict would grow without
    bound as gunicorn workers are recycled or pytest-asyncio creates a
    fresh loop per test. Worse, a reused loop-id (the id of a GC'd loop
    can be reissued to a new loop) would match a stale semaphore whose
    internal counter reflects the prior loop's state.
    """
    loop_id = id(asyncio.get_running_loop())
    loop_prefix = f"{loop_id}:"

    client_keys = [k for k in _clients if k.startswith(loop_prefix)]
    for key in client_keys:
        client = _clients.pop(key, None)
        if client is None:
            continue
        try:
            await client.aclose()
        except Exception:  # noqa: BLE001 — best-effort shutdown
            pass

    sem_keys = [k for k in _semaphores if k.startswith(loop_prefix)]
    for key in sem_keys:
        _semaphores.pop(key, None)


async def resilient_get(
    url: str,
    *,
    source: str = "default",
    params: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
    follow_redirects: bool = False,
    max_retries: int = 3,
    wait_multiplier: float = 1.0,
    wait_max: float = 10.0,
) -> httpx.Response:
    """GET with exponential-backoff retry on transient failures.

    Retries on: connection errors, timeouts, HTTP 429/5xx.
    Does NOT retry on: 4xx (except 429), JSON decode errors.
    On 429, respects the Retry-After header if present (cap 2 min) instead of
    the default exponential backoff. A per-source semaphore caps concurrency
    to prevent thundering-herd rate limiting.
    """
    sem = _semaphore_for(source)

    @retry(
        retry=retry_if_exception_type(
            (httpx.TransportError, httpx.TimeoutException, RetryableHTTPStatusError)
        ),
        stop=stop_after_attempt(max_retries),
        wait=wait_exponential(multiplier=wait_multiplier, max=wait_max),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )
    async def _do_get() -> httpx.Response:
        client = _get_client(source, follow_redirects)
        async with sem:
            resp = await client.get(url, params=params, headers=headers)
        if resp.status_code in _RETRYABLE_STATUS_CODES:
            if resp.status_code == 429:
                delay = _parse_retry_after(resp)
                if delay:
                    logger.info(
                        "Rate limited by %s, waiting %.1fs (Retry-After)",
                        source, delay,
                    )
                    await asyncio.sleep(delay)
            raise RetryableHTTPStatusError(resp)
        return resp

    return await _do_get()
