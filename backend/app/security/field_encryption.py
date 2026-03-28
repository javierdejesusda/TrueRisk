"""Application-level field encryption using Fernet symmetric encryption."""
from __future__ import annotations

from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy import String, TypeDecorator

from app.config import settings

_fernet: Fernet | None = None


def _get_fernet() -> Fernet | None:
    global _fernet
    if _fernet is None and settings.field_encryption_key:
        _fernet = Fernet(settings.field_encryption_key.encode())
    return _fernet


def encrypt_value(value: str) -> str:
    f = _get_fernet()
    if f is None:
        return value
    return f.encrypt(value.encode()).decode()


def decrypt_value(value: str) -> str:
    f = _get_fernet()
    if f is None:
        return value
    try:
        return f.decrypt(value.encode()).decode()
    except InvalidToken:
        return value  # Already plaintext (pre-migration data)


class EncryptedString(TypeDecorator):
    impl = String
    cache_ok = True

    def __init__(self, length: int = 500, **kw):
        super().__init__()
        self.impl = String(length)

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return encrypt_value(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return decrypt_value(value)
