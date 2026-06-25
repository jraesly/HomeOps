from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "HomeOps API"
    environment: str = "local"
    database_url: str = "postgresql+psycopg://homeops:homeops@localhost:5432/homeops"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @field_validator("database_url")
    @classmethod
    def _normalize_database_url(cls, value: str) -> str:
        """Use the psycopg3 driver for plain Postgres URLs.

        Managed hosts (Render, Heroku, Fly) hand out ``postgres://`` or
        ``postgresql://`` URLs, which SQLAlchemy would route to psycopg2. This
        project ships psycopg3, so rewrite them to ``postgresql+psycopg://``.
        """
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value


settings = Settings()
