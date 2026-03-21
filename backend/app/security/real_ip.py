"""Real client IP extraction with anti-spoofing for reverse-proxy deployments."""

from __future__ import annotations

import ipaddress
import logging
from functools import lru_cache

from fastapi import Request

from app.config import settings

logger = logging.getLogger(__name__)

_DEFAULT_TRUSTED = [
    "10.0.0.0/8",
    "172.16.0.0/12",
    "192.168.0.0/16",
    "127.0.0.0/8",
    "::1/128",
    "fc00::/7",
]


@lru_cache(maxsize=1)
def _trusted_networks() -> list[ipaddress.IPv4Network | ipaddress.IPv6Network]:
    raw = settings.trusted_proxies if settings.trusted_proxies else _DEFAULT_TRUSTED
    nets = []
    for cidr in raw:
        try:
            nets.append(ipaddress.ip_network(cidr, strict=False))
        except ValueError:
            logger.warning("Invalid trusted proxy CIDR: %s", cidr)
    return nets


def _is_trusted(ip_str: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip_str.strip())
    except ValueError:
        return False
    return any(addr in net for net in _trusted_networks())


def extract_real_ip(request: Request) -> str:
    """Extract true client IP using right-to-left X-Forwarded-For walk.

    Only processes XFF if the TCP peer is a known proxy CIDR.
    Returns the rightmost untrusted entry (the one appended by our infra).
    """
    peer = request.client.host if request.client else "127.0.0.1"
    xff = request.headers.get("x-forwarded-for")
    if not xff:
        return peer
    if not _is_trusted(peer):
        return peer
    parts = [p.strip() for p in xff.split(",") if p.strip()]
    for ip_str in reversed(parts):
        if not _is_trusted(ip_str):
            return ip_str
    return peer


def get_real_ip(request: Request) -> str:
    """slowapi-compatible key function."""
    return extract_real_ip(request)
