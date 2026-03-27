"""Centralized UTC datetime helper.

All database columns use DateTime (TIMESTAMP WITHOUT TIME ZONE), so every
datetime persisted or compared against the database must be timezone-naive
and represent UTC.
"""
from __future__ import annotations
from datetime import datetime, timezone


def utcnow() -> datetime:
    """Return the current UTC time as a timezone-naive datetime."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
