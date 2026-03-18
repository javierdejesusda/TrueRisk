from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./dev.db"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiry_hours: int = 24
    aemet_api_key: str = ""
    backend_cors_origins: list[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env"}


settings = Settings()
