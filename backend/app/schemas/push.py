from pydantic import BaseModel, ConfigDict


class PushKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscribeRequest(BaseModel):
    endpoint: str
    keys: PushKeys
    province_code: str


class PushSubscribeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    province_code: str
    user_id: int | None = None
    is_active: bool
