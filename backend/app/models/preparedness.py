from datetime import datetime

from sqlalchemy import String, DateTime, Boolean, Integer, Float, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PreparednessItem(Base):
    __tablename__ = "preparedness_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    category: Mapped[str] = mapped_column(String(30))
    item_key: Mapped[str] = mapped_column(String(50))
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PreparednessSnapshot(Base):
    __tablename__ = "preparedness_snapshots"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    total_score: Mapped[float] = mapped_column(Float, default=0.0)
    kit_score: Mapped[float] = mapped_column(Float, default=0.0)
    plan_score: Mapped[float] = mapped_column(Float, default=0.0)
    alerts_score: Mapped[float] = mapped_column(Float, default=0.0)
    community_score: Mapped[float] = mapped_column(Float, default=0.0)
    knowledge_score: Mapped[float] = mapped_column(Float, default=0.0)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
