from datetime import datetime

from sqlalchemy import String, DateTime, Integer, JSON, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class EmergencyPlan(Base):
    __tablename__ = "emergency_plans"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), unique=True, index=True)
    household_members: Mapped[dict] = mapped_column(JSON, default=list)
    meeting_points: Mapped[dict] = mapped_column(JSON, default=list)
    communication_plan: Mapped[dict] = mapped_column(JSON, default=list)
    evacuation_notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    insurance_info: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    pet_info: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    important_documents: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    last_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
