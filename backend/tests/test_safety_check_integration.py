"""Integration tests for the safety check flow.

Covers: check-in, family link creation, acceptance, family status,
and link deletion -- all via HTTP endpoints with real auth tokens.
"""

import pytest
import uuid


def _unique_nickname() -> str:
    return f"safety_{uuid.uuid4().hex[:8]}"


async def _register_user(client, nickname: str) -> dict:
    """Register a user and return {"token": ..., "user": ...}."""
    resp = await client.post(
        "/api/v1/auth/register",
        json={"nickname": nickname, "password": "T3stPass!xx"},
    )
    assert resp.status_code == 200
    data = resp.json()
    return {"token": data["access_token"], "user": data["user"]}


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Check-in tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_check_in_creates_record(client):
    """POST /safety/check-in should create a safety record and return 201."""
    nick = _unique_nickname()
    creds = await _register_user(client, nick)

    response = await client.post(
        "/api/v1/safety/check-in",
        headers=_auth_headers(creds["token"]),
        json={"status": "safe", "message": "All good"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "safe"
    assert data["message"] == "All good"
    assert data["user_id"] == creds["user"]["id"]
    assert "expires_at" in data


@pytest.mark.asyncio
async def test_check_in_history(client):
    """GET /safety/check-ins should return the user's check-in history."""
    nick = _unique_nickname()
    creds = await _register_user(client, nick)
    headers = _auth_headers(creds["token"])

    # Create two check-ins
    await client.post(
        "/api/v1/safety/check-in",
        headers=headers,
        json={"status": "safe"},
    )
    await client.post(
        "/api/v1/safety/check-in",
        headers=headers,
        json={"status": "evacuating", "message": "Leaving now"},
    )

    response = await client.get("/api/v1/safety/check-ins", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2


# ---------------------------------------------------------------------------
# Family link lifecycle
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_family_link_pending(client):
    """Creating a family link should start in 'pending' status."""
    alice_nick = _unique_nickname()
    bob_nick = _unique_nickname()
    alice = await _register_user(client, alice_nick)
    await _register_user(client, bob_nick)

    response = await client.post(
        "/api/v1/safety/links",
        headers=_auth_headers(alice["token"]),
        json={"nickname": bob_nick, "relationship": "family"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "pending"
    assert data["linked_user_nickname"] == bob_nick
    assert data["relationship"] == "family"


@pytest.mark.asyncio
async def test_accept_family_link(client):
    """The target user should be able to accept a pending link."""
    alice_nick = _unique_nickname()
    bob_nick = _unique_nickname()
    alice = await _register_user(client, alice_nick)
    bob = await _register_user(client, bob_nick)

    # Alice creates link to Bob
    create_resp = await client.post(
        "/api/v1/safety/links",
        headers=_auth_headers(alice["token"]),
        json={"nickname": bob_nick},
    )
    link_id = create_resp.json()["id"]

    # Bob accepts
    accept_resp = await client.patch(
        f"/api/v1/safety/links/{link_id}/accept",
        headers=_auth_headers(bob["token"]),
    )
    assert accept_resp.status_code == 200
    assert accept_resp.json()["status"] == "accepted"


@pytest.mark.asyncio
async def test_family_status_shows_linked_user(client):
    """After accepting a link, GET /safety/family-status should include the partner."""
    alice_nick = _unique_nickname()
    bob_nick = _unique_nickname()
    alice = await _register_user(client, alice_nick)
    bob = await _register_user(client, bob_nick)

    # Create and accept link
    create_resp = await client.post(
        "/api/v1/safety/links",
        headers=_auth_headers(alice["token"]),
        json={"nickname": bob_nick},
    )
    link_id = create_resp.json()["id"]
    await client.patch(
        f"/api/v1/safety/links/{link_id}/accept",
        headers=_auth_headers(bob["token"]),
    )

    # Check family status from Alice's perspective
    response = await client.get(
        "/api/v1/safety/family-status",
        headers=_auth_headers(alice["token"]),
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    nicknames = [entry["nickname"] for entry in data]
    assert bob_nick in nicknames


@pytest.mark.asyncio
async def test_delete_family_link(client):
    """Either party should be able to delete a link."""
    alice_nick = _unique_nickname()
    bob_nick = _unique_nickname()
    alice = await _register_user(client, alice_nick)
    bob = await _register_user(client, bob_nick)

    # Create and accept link
    create_resp = await client.post(
        "/api/v1/safety/links",
        headers=_auth_headers(alice["token"]),
        json={"nickname": bob_nick},
    )
    link_id = create_resp.json()["id"]
    await client.patch(
        f"/api/v1/safety/links/{link_id}/accept",
        headers=_auth_headers(bob["token"]),
    )

    # Alice deletes the link
    del_resp = await client.delete(
        f"/api/v1/safety/links/{link_id}",
        headers=_auth_headers(alice["token"]),
    )
    assert del_resp.status_code == 204

    # Family status should now be empty for Alice
    response = await client.get(
        "/api/v1/safety/family-status",
        headers=_auth_headers(alice["token"]),
    )
    assert response.status_code == 200
    data = response.json()
    linked_nicks = [entry["nickname"] for entry in data]
    assert bob_nick not in linked_nicks


@pytest.mark.asyncio
async def test_pending_links_visible_to_target(client):
    """The target user should see incoming link requests."""
    alice_nick = _unique_nickname()
    bob_nick = _unique_nickname()
    alice = await _register_user(client, alice_nick)
    bob = await _register_user(client, bob_nick)

    await client.post(
        "/api/v1/safety/links",
        headers=_auth_headers(alice["token"]),
        json={"nickname": bob_nick},
    )

    response = await client.get(
        "/api/v1/safety/links",
        headers=_auth_headers(bob["token"]),
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["status"] == "pending"


@pytest.mark.asyncio
async def test_duplicate_link_returns_409(client):
    """Creating a link that already exists should return 409."""
    alice_nick = _unique_nickname()
    bob_nick = _unique_nickname()
    alice = await _register_user(client, alice_nick)
    await _register_user(client, bob_nick)

    await client.post(
        "/api/v1/safety/links",
        headers=_auth_headers(alice["token"]),
        json={"nickname": bob_nick},
    )

    # Attempt duplicate
    response = await client.post(
        "/api/v1/safety/links",
        headers=_auth_headers(alice["token"]),
        json={"nickname": bob_nick},
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_link_to_nonexistent_user_returns_404(client):
    """Linking to a nickname that does not exist should return 404."""
    alice_nick = _unique_nickname()
    alice = await _register_user(client, alice_nick)

    response = await client.post(
        "/api/v1/safety/links",
        headers=_auth_headers(alice["token"]),
        json={"nickname": "nonexistent_user_xyz"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_cannot_link_to_self(client):
    """Linking to yourself should return 400."""
    alice_nick = _unique_nickname()
    alice = await _register_user(client, alice_nick)

    response = await client.post(
        "/api/v1/safety/links",
        headers=_auth_headers(alice["token"]),
        json={"nickname": alice_nick},
    )
    assert response.status_code == 400
