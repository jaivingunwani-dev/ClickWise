from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # FastAPI
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    environment: str = "development"

    # Anthropic API (dev fallback: empty key triggers graceful error in client)
    anthropic_api_key: str = ""

    # Supabase (dev fallback: mock values for non-API calls)
    supabase_url: str = "https://mock.supabase.co"
    supabase_service_key: str = "mock-service-key"

    # CORS
    cors_origins: list = ["http://localhost:3000"]

    # Pydantic v2 configuration
    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"  # Ignore extra environment variables not defined in Settings
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
