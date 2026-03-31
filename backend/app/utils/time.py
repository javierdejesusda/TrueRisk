"""Centralized UTC datetime helper.

All database columns use DateTime(timezone=True), so every datetime
persisted or compared against the database must be timezone-aware UTC.
"""
from __future__ import annotations
from datetime import datetime, timezone


def utcnow() -> datetime:
    """Return the current UTC time as a timezone-aware datetime."""
    return datetime.now(timezone.utc)
