"""Tests for the startup schema-sync logic in ``app.main``.

The schema-sync code runs at lifespan startup in every gunicorn worker. A
naive non-blocking advisory lock used to cause cold-start crashloops, where
the "skipping" worker proceeded to start its scheduler while the holding
worker was still ALTERing tables, producing cross-process asyncpg
``DeadlockDetectedError``s. These tests guard against regression.
"""

from unittest.mock import MagicMock

import pytest
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.main import _SCHEMA_SYNC_LOCK_ID, _run_schema_sync


def test_run_schema_sync_uses_blocking_advisory_lock(monkeypatch):
    """The PG advisory lock must be the blocking variant.

    A non-blocking ``pg_try_advisory_xact_lock`` lets the losing worker exit
    schema-sync and start its scheduler concurrently with the winner's still-
    open DDL transaction, deadlocking against the ALTER TABLE statements.
    """
    monkeypatch.setattr("app.main._sync_missing_columns", lambda conn: None)
    monkeypatch.setattr("app.main._fix_timestamp_columns", lambda conn: None)
    monkeypatch.setattr("app.main._fix_encrypted_column_sizes", lambda conn: None)

    fake_conn = MagicMock()
    fake_conn.dialect.name = "postgresql"

    _run_schema_sync(fake_conn)

    assert fake_conn.execute.call_args_list, "expected an advisory-lock execute call"
    first_sql = str(fake_conn.execute.call_args_list[0].args[0])
    assert "pg_advisory_xact_lock" in first_sql
    assert "pg_try_advisory_xact_lock" not in first_sql

    bind_params = fake_conn.execute.call_args_list[0].args[1]
    assert bind_params == {"lock_id": _SCHEMA_SYNC_LOCK_ID}


def test_run_schema_sync_skips_lock_on_non_postgres(monkeypatch):
    """sqlite (and other non-PG dialects) must not attempt the advisory lock."""
    monkeypatch.setattr("app.main._sync_missing_columns", lambda conn: None)
    monkeypatch.setattr("app.main._fix_timestamp_columns", lambda conn: None)
    monkeypatch.setattr("app.main._fix_encrypted_column_sizes", lambda conn: None)

    fake_conn = MagicMock()
    fake_conn.dialect.name = "sqlite"

    _run_schema_sync(fake_conn)

    assert fake_conn.execute.call_args_list == [], (
        "non-PG dialects must not issue advisory-lock SQL"
    )


@pytest.mark.asyncio
async def test_run_schema_sync_is_idempotent():
    """Running schema_sync twice on an in-sync schema must be a clean no-op.

    Both gunicorn workers run this at startup; the second one (now blocking
    on the advisory lock) acquires it after the first commits and must see
    the schema as already-correct without erroring.
    """
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            await conn.run_sync(_run_schema_sync)
        async with engine.begin() as conn:
            await conn.run_sync(_run_schema_sync)
    finally:
        await engine.dispose()
