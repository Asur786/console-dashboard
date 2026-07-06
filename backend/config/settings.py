"""
Application settings.

Reads configuration from environment variables.
Databricks credentials are kept here (server-side only) — never exposed
to the browser bundle.
"""

import os


class Settings:
    """Immutable configuration loaded once at startup."""

    def __init__(self) -> None:
        # Load .env file if present (for local development)
        try:
            from dotenv import load_dotenv
            load_dotenv()
        except ImportError:
            pass  # python-dotenv is optional in production

    # --- Databricks SQL Warehouse ---
    @property
    def DATABRICKS_HOST(self) -> str:
        return os.getenv("DATABRICKS_HOST", "")

    @property
    def DATABRICKS_TOKEN(self) -> str:
        return os.getenv("DATABRICKS_TOKEN", "")

    @property
    def DATABRICKS_WAREHOUSE_ID(self) -> str:
        return os.getenv("DATABRICKS_WAREHOUSE_ID", "")

    @property
    def DATABRICKS_CATALOG(self) -> str:
        return os.getenv("DATABRICKS_CATALOG", "main")

    @property
    def DATABRICKS_SCHEMA(self) -> str:
        return os.getenv("DATABRICKS_SCHEMA", "default")

    # --- App ---
    APP_PORT: int = int(os.getenv("APP_PORT", "8000"))
    CORS_ORIGINS: list[str] = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173"
    ).split(",")

    @property
    def is_databricks_configured(self) -> bool:
        return bool(
            self.DATABRICKS_HOST
            and self.DATABRICKS_TOKEN
            and self.DATABRICKS_WAREHOUSE_ID
        )


settings = Settings()
