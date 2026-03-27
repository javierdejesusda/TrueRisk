"""Resilient HTTP GET with retry and structured timeouts for data sources."""

from __future__ import annotations

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

_RETRYABLE_STATUS_CODES = frozenset({429, 500, 502, 503, 504})


class RetryableHTTPStatusError(Exception):
    """Raised when an HTTP response has a retryable status code."""
    def __init__(self, response: httpx.Response):
        self.response = response
        super().__init__(f"HTTP {response.status_code}")


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
    """
    timeout_cfg = TIMEOUTS.get(source, SourceTimeout())
    timeout = httpx.Timeout(
        connect=timeout_cfg.connect,
        read=timeout_cfg.read,
        write=5.0,
        pool=5.0,
    )

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
        async with httpx.AsyncClient(
            timeout=timeout, follow_redirects=follow_redirects
        ) as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code in _RETRYABLE_STATUS_CODES:
                raise RetryableHTTPStatusError(resp)
            return resp

    return await _do_get()
