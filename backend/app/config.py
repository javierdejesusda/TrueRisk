from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./dev.db"
    aemet_api_key: str = ""
    backend_cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001", "https://truerisk.cloud"]
    vapid_private_key: str = ""
    vapid_public_key: str = ""
    vapid_contact_email: str = "mailto:alerts@truerisk.cloud"

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4.1-nano"

    # Auth / JWT
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080  # 7 days

    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_messaging_service_sid: str = ""
    twilio_from_phone: str = ""
    twilio_admin_phones: list[str] = []

    # Telegram
    telegram_bot_token: str = ""
    telegram_admin_chat_id: str = ""
    telegram_bot_username: str = ""
    telegram_webhook_url: str = ""

    # Data source API keys
    firms_map_key: str = ""
    openaq_api_key: str = ""
    cdsapi_key: str = ""
    cdsapi_url: str = "https://cds.climate.copernicus.eu/api"

    # Security
    trusted_proxies: list[str] = [
        "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "127.0.0.0/8",
    ]
    field_encryption_key: str = ""

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
