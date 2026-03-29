"""Demo mode utilities. Activated by DEMO_MODE=true env var."""

from app.config import settings


def is_demo_mode() -> bool:
    return settings.demo_mode
