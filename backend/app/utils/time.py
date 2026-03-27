"Centralized UTC datetime helper."
from __future__ import annotations
from datetime import datetime, timezone

def utcnow() -> datetime:
    "Return the current UTC time as a timezone-naive datetime."
    return datetime.now(timezone.utc).replace(tzinfo=None)
