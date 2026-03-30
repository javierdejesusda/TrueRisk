"""Tests for CSRF middleware (X-Requested-With header validation)."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def csrf_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_get_request_passes_without_header(csrf_client: AsyncClient):
    """GET requests should not require X-Requested-With header."""
    res = await csrf_client.get("/health")
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_post_without_header_returns_403(csrf_client: AsyncClient):
    """POST requests without X-Requested-With header should be rejected."""
    res = await csrf_client.post(
        "/api/v1/auth/login",
        json={"email": "a@b.com", "password": "test"},
    )
    assert res.status_code == 403
    assert res.json()["detail"] == "CSRF validation failed"


@pytest.mark.asyncio
async def test_post_with_valid_header_passes(csrf_client: AsyncClient):
    """POST requests with X-Requested-With: XMLHttpRequest should pass CSRF check."""
    res = await csrf_client.post(
        "/api/v1/auth/login",
        json={"email": "a@b.com", "password": "test"},
        headers={"X-Requested-With": "XMLHttpRequest"},
    )
    # Should not be 403 (may be 401/422/etc depending on auth, but not CSRF blocked)
    assert res.status_code != 403


@pytest.mark.asyncio
async def test_post_with_valid_header_and_invalid_origin_returns_403(csrf_client: AsyncClient):
    """POST with valid header but disallowed Origin should be rejected."""
    res = await csrf_client.post(
        "/api/v1/auth/login",
        json={"email": "a@b.com", "password": "test"},
        headers={
            "X-Requested-With": "XMLHttpRequest",
            "Origin": "https://evil-site.com",
        },
    )
    assert res.status_code == 403
    assert res.json()["detail"] == "CSRF validation failed"


@pytest.mark.asyncio
async def test_exempt_path_health_passes_without_header(csrf_client: AsyncClient):
    """Exempt paths should pass without CSRF header even for non-safe methods."""
    # /health is exempt — use a hypothetical POST to it
    # Since /health only defines GET, we test that the middleware itself does not block
    res = await csrf_client.post("/health")
    # FastAPI returns 405 Method Not Allowed (not 403 CSRF), proving middleware let it through
    assert res.status_code == 405


@pytest.mark.asyncio
async def test_exempt_path_ready_passes_without_header(csrf_client: AsyncClient):
    """/ready is exempt from CSRF checks."""
    res = await csrf_client.post("/ready")
    assert res.status_code == 405


@pytest.mark.asyncio
async def test_post_with_valid_header_and_no_origin_passes(csrf_client: AsyncClient):
    """POST with valid header and no Origin header should pass (same-origin requests may omit Origin)."""
    res = await csrf_client.post(
        "/api/v1/auth/login",
        json={"email": "a@b.com", "password": "test"},
        headers={"X-Requested-With": "XMLHttpRequest"},
    )
    assert res.status_code != 403


@pytest.mark.asyncio
async def test_post_with_valid_header_and_allowed_origin_passes(csrf_client: AsyncClient):
    """POST with valid header and an allowed Origin should pass."""
    res = await csrf_client.post(
        "/api/v1/auth/login",
        json={"email": "a@b.com", "password": "test"},
        headers={
            "X-Requested-With": "XMLHttpRequest",
            "Origin": "http://localhost:3000",
        },
    )
    assert res.status_code != 403


@pytest.mark.asyncio
async def test_post_with_wrong_header_value_returns_403(csrf_client: AsyncClient):
    """POST with X-Requested-With set to wrong value should be rejected."""
    res = await csrf_client.post(
        "/api/v1/auth/login",
        json={"email": "a@b.com", "password": "test"},
        headers={"X-Requested-With": "SomeOtherValue"},
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_put_without_header_returns_403(csrf_client: AsyncClient):
    """PUT requests without X-Requested-With header should also be rejected."""
    res = await csrf_client.put(
        "/api/v1/auth/login",
        json={"email": "a@b.com"},
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_delete_without_header_returns_403(csrf_client: AsyncClient):
    """DELETE requests without X-Requested-With header should also be rejected."""
    res = await csrf_client.delete("/api/v1/auth/login")
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_patch_without_header_returns_403(csrf_client: AsyncClient):
    """PATCH requests without X-Requested-With header should also be rejected."""
    res = await csrf_client.patch(
        "/api/v1/auth/login",
        json={"email": "a@b.com"},
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_referer_used_when_origin_missing(csrf_client: AsyncClient):
    """When Origin is missing, Referer should be used for origin validation."""
    res = await csrf_client.post(
        "/api/v1/auth/login",
        json={"email": "a@b.com", "password": "test"},
        headers={
            "X-Requested-With": "XMLHttpRequest",
            "Referer": "https://evil-site.com/some/page",
        },
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_valid_referer_passes(csrf_client: AsyncClient):
    """When Origin is missing but Referer is from an allowed origin, request should pass."""
    res = await csrf_client.post(
        "/api/v1/auth/login",
        json={"email": "a@b.com", "password": "test"},
        headers={
            "X-Requested-With": "XMLHttpRequest",
            "Referer": "http://localhost:3000/login",
        },
    )
    assert res.status_code != 403


@pytest.mark.asyncio
async def test_telegram_webhook_exempt(csrf_client: AsyncClient):
    """Telegram webhook path should be exempt from CSRF checks."""
    res = await csrf_client.post(
        "/api/v1/telegram/webhook",
        json={"update_id": 123},
    )
    # Should not be 403 (the endpoint may return another status, but not CSRF blocked)
    assert res.status_code != 403
