"""Tests for Sentry SDK initialization."""

import importlib
import os


def test_sentry_not_initialized_without_dsn():
    """Sentry should not init when DSN is empty."""
    os.environ.pop("SENTRY_DSN", None)
    os.environ.setdefault("JWT_SECRET", "test-secret")
    import app.config
    importlib.reload(app.config)
    assert app.config.settings.sentry_dsn == ""


def test_sentry_dsn_read_from_env():
    """Sentry DSN should be read from environment."""
    os.environ["SENTRY_DSN"] = "https://examplePublicKey@o0.ingest.sentry.io/0"
    os.environ.setdefault("JWT_SECRET", "test-secret")
    import app.config
    importlib.reload(app.config)
    assert app.config.settings.sentry_dsn.startswith("https://")
    os.environ.pop("SENTRY_DSN", None)
