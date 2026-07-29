from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # FastAPI
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    environment: str = "development"

    # Anthropic API
    anthropic_api_key: str

    # Supabase
    supabase_url: str
    supabase_service_key: str

    # CORS
    cors_origins: list = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
