from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.schemas.chat import ChatSendRequest


def test_valid_message():
    req = ChatSendRequest(message="Is there flood risk in Madrid?")
    assert req.message == "Is there flood risk in Madrid?"
    assert req.locale == "es"


def test_empty_message_rejected():
    with pytest.raises(ValidationError):
        ChatSendRequest(message="")


def test_whitespace_only_rejected():
    with pytest.raises(ValidationError):
        ChatSendRequest(message="   ")


def test_message_too_long_rejected():
    with pytest.raises(ValidationError):
        ChatSendRequest(message="a" * 501)


def test_message_at_limit_accepted():
    req = ChatSendRequest(message="a" * 500)
    assert len(req.message) == 500


def test_invalid_locale_rejected():
    with pytest.raises(ValidationError):
        ChatSendRequest(message="hello", locale="fr")


def test_message_stripped():
    req = ChatSendRequest(message="  hello  ")
    assert req.message == "hello"
