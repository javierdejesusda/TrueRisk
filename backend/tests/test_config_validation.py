"""Tests for Settings startup validation in app.config."""

import pytest
from pydantic import ValidationError

from app.config import Settings


class TestJwtSecretValidation:
    """JWT_SECRET must be set when DEMO_MODE is False."""

    def test_empty_jwt_secret_raises_when_not_demo(self):
        with pytest.raises(ValidationError, match="JWT_SECRET must be set"):
            Settings(
                jwt_secret="",
                demo_mode=False,
                _env_file=None,
            )

    def test_valid_jwt_secret_passes(self):
        s = Settings(
            jwt_secret="a-real-secret-key",
            demo_mode=False,
            _env_file=None,
        )
        assert s.jwt_secret == "a-real-secret-key"

    def test_demo_mode_skips_jwt_validation(self):
        s = Settings(
            jwt_secret="",
            demo_mode=True,
            _env_file=None,
        )
        assert s.jwt_secret == ""
        assert s.demo_mode is True


class TestFieldEncryptionKeyValidation:
    """FIELD_ENCRYPTION_KEY must be set when DEMO_MODE is False."""

    def test_empty_encryption_key_raises_when_not_demo(self):
        with pytest.raises(ValidationError, match="FIELD_ENCRYPTION_KEY must be set"):
            Settings(
                jwt_secret="test-secret",
                field_encryption_key="",
                demo_mode=False,
                _env_file=None,
            )

    def test_encryption_key_set_passes(self):
        s = Settings(
            jwt_secret="test-secret",
            field_encryption_key="some-key",
            demo_mode=False,
            _env_file=None,
        )
        assert s.field_encryption_key == "some-key"

    def test_demo_mode_skips_encryption_key_validation(self):
        s = Settings(
            jwt_secret="",
            field_encryption_key="",
            demo_mode=True,
            _env_file=None,
        )
        assert s.field_encryption_key == ""


class TestSentryDsnField:
    """sentry_dsn field exists with empty default."""

    def test_sentry_dsn_default_empty(self):
        s = Settings(
            jwt_secret="test-secret",
            demo_mode=False,
            _env_file=None,
        )
        assert s.sentry_dsn == ""

    def test_sentry_dsn_can_be_set(self):
        s = Settings(
            jwt_secret="test-secret",
            sentry_dsn="https://key@sentry.io/123",
            demo_mode=False,
            _env_file=None,
        )
        assert s.sentry_dsn == "https://key@sentry.io/123"
