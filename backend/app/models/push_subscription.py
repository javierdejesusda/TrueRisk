from datetime import datetime

from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    province_code: Mapped[str] = mapped_column(String(2), index=True)
    endpoint: Mapped[str] = mapped_column(String(500))
    p256dh_key: Mapped[str] = mapped_column(String(200))
    auth_key: Mapped[str] = mapped_column(String(200))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
