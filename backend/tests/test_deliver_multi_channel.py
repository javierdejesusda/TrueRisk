"""Tests for multi-channel alert delivery with failover."""

import pytest
from unittest.mock import AsyncMock, patch

from app.services.alert_escalation_service import deliver_alert_multi_channel


def _mock_db():
    return AsyncMock()


class TestDeliverAlertMultiChannel:
    @pytest.mark.asyncio
    @patch("app.services.push_service.notify_user", new_callable=AsyncMock)
    async def test_push_succeeds(self, mock_push):
        mock_push.return_value = True
        db = _mock_db()

        result = await deliver_alert_multi_channel(
            db, user_id=1, title="Test", body="Alert body",
        )
        assert result == "push"
        mock_push.assert_awaited_once()

    @pytest.mark.asyncio
    @patch("app.services.sms_service.send_sms", new_callable=AsyncMock)
    @patch("app.services.push_service.notify_user", new_callable=AsyncMock)
    async def test_push_fails_sms_succeeds(self, mock_push, mock_sms):
        mock_push.return_value = False
        mock_sms.return_value = "SM12345"
        db = _mock_db()

        result = await deliver_alert_multi_channel(
            db, user_id=1, title="Test", body="Body",
            phone="+34600000000", sms_enabled=True,
        )
        assert result == "sms"
        mock_sms.assert_awaited_once()

    @pytest.mark.asyncio
    @patch("app.services.telegram_service.send_telegram", new_callable=AsyncMock)
    @patch("app.services.push_service.notify_user", new_callable=AsyncMock)
    async def test_sms_skipped_no_phone_telegram_used(self, mock_push, mock_telegram):
        mock_push.return_value = False
        mock_telegram.return_value = True
        db = _mock_db()

        result = await deliver_alert_multi_channel(
            db, user_id=1, title="Test", body="Body",
            phone=None, telegram_chat_id="123456",
            sms_enabled=True, telegram_enabled=True,
        )
        assert result == "telegram"
        mock_telegram.assert_awaited_once()

    @pytest.mark.asyncio
    @patch("app.services.whatsapp_service.send_whatsapp", new_callable=AsyncMock)
    @patch("app.services.telegram_service.send_telegram", new_callable=AsyncMock)
    @patch("app.services.sms_service.send_sms", new_callable=AsyncMock)
    @patch("app.services.push_service.notify_user", new_callable=AsyncMock)
    async def test_all_fail_returns_none(self, mock_push, mock_sms, mock_telegram, mock_wa):
        mock_push.return_value = False
        mock_sms.return_value = None
        mock_telegram.return_value = False
        mock_wa.return_value = None
        db = _mock_db()

        result = await deliver_alert_multi_channel(
            db, user_id=1, title="Test", body="Body",
            phone="+34600000000", telegram_chat_id="123",
            sms_enabled=True, telegram_enabled=True, whatsapp_enabled=True,
        )
        assert result == "none"

    @pytest.mark.asyncio
    @patch("app.services.whatsapp_service.send_whatsapp", new_callable=AsyncMock)
    @patch("app.services.telegram_service.send_telegram", new_callable=AsyncMock)
    @patch("app.services.sms_service.send_sms", new_callable=AsyncMock)
    @patch("app.services.push_service.notify_user", new_callable=AsyncMock)
    async def test_whatsapp_last_resort(self, mock_push, mock_sms, mock_telegram, mock_wa):
        mock_push.return_value = False
        mock_sms.return_value = None
        mock_telegram.return_value = False
        mock_wa.return_value = "WA12345"
        db = _mock_db()

        result = await deliver_alert_multi_channel(
            db, user_id=1, title="Test", body="Body",
            phone="+34600000000", telegram_chat_id="123",
            sms_enabled=True, telegram_enabled=True, whatsapp_enabled=True,
        )
        assert result == "whatsapp"
        mock_wa.assert_awaited_once()
