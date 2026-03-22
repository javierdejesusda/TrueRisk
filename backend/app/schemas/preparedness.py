from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class ChecklistItem(BaseModel):
    item_key: str
    label: str
    description: str
    category: str
    completed: bool = False
    completed_at: datetime | None = None
    priority: str = "normal"


class CategoryProgress(BaseModel):
    category: str
    label: str
    total_items: int
    completed_items: int
    score: float


class PreparednessScoreResponse(BaseModel):
    total_score: float
    categories: list[CategoryProgress]
    next_actions: list[ChecklistItem]
    last_updated: datetime | None


class PreparednessHistoryEntry(BaseModel):
    total_score: float
    computed_at: datetime


class ChecklistResponse(BaseModel):
    categories: dict[str, list[ChecklistItem]]
    total_items: int
    completed_items: int


class ItemToggle(BaseModel):
    completed: bool
    notes: str | None = None
