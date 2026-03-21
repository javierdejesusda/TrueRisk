"""Tests for real IP extraction with anti-spoofing."""

from unittest.mock import MagicMock

from app.security.real_ip import extract_real_ip


class _FakeHeaders(dict):
    """Dict subclass that works like Starlette Headers."""
    pass


def _make_request(client_host: str, xff: str | None = None):
    req = MagicMock()
    req.client.host = client_host
    headers = _FakeHeaders()
    if xff is not None:
        headers["x-forwarded-for"] = xff
    req.headers = headers
    return req


def test_direct_connection_no_xff():
    assert extract_real_ip(_make_request("84.78.22.101")) == "84.78.22.101"


def test_trusted_proxy_single_xff():
    assert extract_real_ip(_make_request("10.0.5.42", "84.78.22.101")) == "84.78.22.101"


def test_spoofed_xff_untrusted_peer():
    assert extract_real_ip(_make_request("84.78.22.101", "1.2.3.4")) == "84.78.22.101"


def test_chained_proxies_rightmost_untrusted():
    assert extract_real_ip(_make_request("10.0.5.42", "1.2.3.4, 84.78.22.101")) == "84.78.22.101"


def test_all_trusted_xff_returns_peer():
    assert extract_real_ip(_make_request("10.0.5.42", "10.0.1.1, 172.16.0.5")) == "10.0.5.42"
