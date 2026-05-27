from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "HomeOps API"
    environment: str = "local"
    database_url: str = "postgresql+psycopg://homeops:homeops@localhost:5432/homeops"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()