"""Tests for per-user push notification targeting (user_id on PushSubscription)."""

import pytest
from unittest.mock import AsyncMock, patch
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.push_subscription import PushSubscription
from app.models.user import User


# ---------------------------------------------------------------------------
# Model tests
# ---------------------------------------------------------------------------

class TestPushSubscriptionModel:
    """PushSubscription.user_id column exists and is nullable."""

    @pytest.mark.asyncio
    async def test_user_id_column_exists(self, client):
        """PushSubscription should have a user_id attribute."""
        assert hasattr(PushSubscription, "user_id")

    @pytest.mark.asyncio
    async def test_create_subscription_without_user(self, client):
        """Subscription can be created without a user_id (anonymous)."""
        from tests.conftest import test_session_factory

        async with test_session_factory() as db:
            sub = PushSubscription(
                province_code="28",
                endpoint="https://push.example.com/anon",
                p256dh_key="anon-p256dh",
                auth_key="anon-auth",
            )
            db.add(sub)
            await db.commit()
            await db.refresh(sub)
            assert sub.user_id is None
            assert sub.is_active is True

    @pytest.mark.asyncio
    async def test_create_subscription_with_user(self, client):
        """Subscription can be created with a user_id."""
        from tests.conftest import test_session_factory

        async with test_session_factory() as db:
            user = User(
                email="push-test@example.com",
                province_code="28",
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

            sub = PushSubscription(
                province_code="28",
                endpoint="https://push.example.com/user",
                p256dh_key="user-p256dh",
                auth_key="user-auth",
                user_id=user.id,
            )
            db.add(sub)
            await db.commit()
            await db.refresh(sub)
            assert sub.user_id == user.id


# ---------------------------------------------------------------------------
# notify_user tests
# ---------------------------------------------------------------------------

class TestNotifyUser:
    """Tests for the notify_user service function."""

    @pytest.mark.asyncio
    async def test_notify_user_sends_to_matching_subscriptions(self, client):
        """notify_user sends push to all active subscriptions for the user."""
        from tests.conftest import test_session_factory
        from app.services.push_service import notify_user

        async with test_session_factory() as db:
            user = User(
                email="notify-test@example.com",
                province_code="28",
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

            # Two active subscriptions for this user
            for i in range(2):
                db.add(PushSubscription(
                    province_code="28",
                    endpoint=f"https://push.example.com/notify/{user.id}/{i}",
                    p256dh_key=f"p256dh-{i}",
                    auth_key=f"auth-{i}",
                    user_id=user.id,
                    is_active=True,
                ))
            # One inactive subscription -- should NOT receive push
            db.add(PushSubscription(
                province_code="28",
                endpoint=f"https://push.example.com/notify/{user.id}/inactive",
                p256dh_key="p256dh-inactive",
                auth_key="auth-inactive",
                user_id=user.id,
                is_active=False,
            ))
            await db.commit()

            with patch("app.services.push_service.send_push", new_callable=AsyncMock) as mock_send:
                mock_send.return_value = True
                sent = await notify_user(db, user.id, "Test Title", "Test Body")
                assert sent == 2
                assert mock_send.call_count == 2

    @pytest.mark.asyncio
    async def test_notify_user_returns_zero_when_no_subscriptions(self, client):
        """notify_user returns 0 when the user has no subscriptions."""
        from tests.conftest import test_session_factory
        from app.services.push_service import notify_user

        async with test_session_factory() as db:
            with patch("app.services.push_service.send_push", new_callable=AsyncMock) as mock_send:
                sent = await notify_user(db, 999999, "Title", "Body")
                assert sent == 0
                mock_send.assert_not_called()

    @pytest.mark.asyncio
    async def test_notify_user_counts_only_successful_sends(self, client):
        """notify_user counts only successful push sends."""
        from tests.conftest import test_session_factory
        from app.services.push_service import notify_user

        async with test_session_factory() as db:
            user = User(
                email="partial-notify@example.com",
                province_code="28",
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

            for i in range(3):
                db.add(PushSubscription(
                    province_code="28",
                    endpoint=f"https://push.example.com/partial/{user.id}/{i}",
                    p256dh_key=f"p256dh-p-{i}",
                    auth_key=f"auth-p-{i}",
                    user_id=user.id,
                    is_active=True,
                ))
            await db.commit()

            with patch("app.services.push_service.send_push", new_callable=AsyncMock) as mock_send:
                # First call succeeds, second fails, third succeeds
                mock_send.side_effect = [True, False, True]
                sent = await notify_user(db, user.id, "Title", "Body")
                assert sent == 2


# ---------------------------------------------------------------------------
# API endpoint tests
# ---------------------------------------------------------------------------

class TestSubscribeEndpointWithUser:
    """The /subscribe endpoint should set user_id when authenticated."""

    @pytest.fixture
    async def push_client(self):
        """Client with both get_db overrides (app.database + app.api.deps)."""
        from app.main import app
        from app.database import get_db as db_get_db
        from app.api.deps import get_db as deps_get_db
        from tests.conftest import override_get_db

        app.dependency_overrides[db_get_db] = override_get_db
        app.dependency_overrides[deps_get_db] = override_get_db
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac
        app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_subscribe_without_auth_has_no_user_id(self, push_client):
        """Anonymous subscription should have user_id=None."""
        from tests.conftest import test_session_factory

        resp = await push_client.post("/api/v1/push/subscribe", json={
            "endpoint": "https://push.example.com/api-anon",
            "keys": {"p256dh": "key-anon", "auth": "auth-anon"},
            "province_code": "28",
        })
        assert resp.status_code == 201

        async with test_session_factory() as db:
            result = await db.execute(
                select(PushSubscription).where(
                    PushSubscription.endpoint == "https://push.example.com/api-anon"
                )
            )
            sub = result.scalar_one()
            assert sub.user_id is None

    @pytest.mark.asyncio
    async def test_subscribe_with_auth_sets_user_id(self, push_client):
        """Authenticated subscription should have user_id set."""
        from tests.conftest import test_session_factory
        from app.services.auth_service import create_access_token

        async with test_session_factory() as db:
            user = User(
                email="api-auth-push@example.com",
                province_code="28",
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            user_id = user.id

        token = create_access_token(user_id)
        resp = await push_client.post(
            "/api/v1/push/subscribe",
            json={
                "endpoint": "https://push.example.com/api-auth",
                "keys": {"p256dh": "key-auth", "auth": "auth-auth"},
                "province_code": "28",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201

        async with test_session_factory() as db:
            result = await db.execute(
                select(PushSubscription).where(
                    PushSubscription.endpoint == "https://push.example.com/api-auth"
                )
            )
            sub = result.scalar_one()
            assert sub.user_id == user_id


# ---------------------------------------------------------------------------
# Schema tests
# ---------------------------------------------------------------------------

class TestPushSchema:
    """PushSubscribeResponse should include user_id."""

    def test_response_includes_user_id(self):
        from app.schemas.push import PushSubscribeResponse
        assert "user_id" in PushSubscribeResponse.model_fields
