from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./dev.db"
    aemet_api_key: str = ""
    backend_cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001", "https://truerisk.cloud"]

    model_config = {"env_file": ".env"}


settings = Settings()
