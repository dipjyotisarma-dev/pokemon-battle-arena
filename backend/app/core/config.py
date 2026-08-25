from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables and .env file.
    """

    # Environment
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str

    # Default Admin
    DEFAULT_ADMIN_USERNAME: str
    DEFAULT_ADMIN_EMAIL: str
    DEFAULT_ADMIN_PASSWORD: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # CORS
    CORS_ORIGINS: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        """
        Return the list of allowed CORS origins.
        Combines local development defaults with configured origins.
        """
        defaults = [
            "http://127.0.0.1:5500",
            "http://localhost:5500",
            "http://127.0.0.1:8000",
            "http://localhost:8000",
            "http://127.0.0.1:8080",
            "http://localhost:8080",
            "http://127.0.0.1:3000",
            "http://localhost:3000",
            "http://127.0.0.1:5000",
            "http://localhost:5000",
        ]
        origins = list(defaults)
        if self.CORS_ORIGINS:
            for origin in self.CORS_ORIGINS.split(","):
                cleaned = origin.strip()
                if cleaned and cleaned not in origins:
                    origins.append(cleaned)
        return origins

    @property
    def is_production(self) -> bool:
        """
        Check if the application is running in production mode.
        """
        return (self.ENVIRONMENT or "").strip().lower() == "production"

    @property
    def cookie_secure(self) -> bool:
        """
        Determine whether the authentication cookie requires HTTPS (Secure flag).
        Must be True in production (required for SameSite=None) and False in local HTTP.
        """
        return self.is_production

    @property
    def cookie_samesite(self) -> str:
        """
        Determine the SameSite attribute for the authentication cookie.
        Must be 'none' in production for cross-site Vercel -> Render requests,
        and 'lax' in local development.
        """
        return "none" if self.is_production else "lax"

    model_config = SettingsConfigDict(
        env_file=(
            str(Path(__file__).resolve().parent.parent.parent / ".env"),
            ".env",
        ),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()