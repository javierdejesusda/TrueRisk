from pydantic import BaseModel


class PushKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscribeRequest(BaseModel):
    endpoint: str
    keys: PushKeys
    province_code: str


class PushSubscribeResponse(BaseModel):
    id: int
    province_code: str
    is_active: bool
