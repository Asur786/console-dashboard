"""
Application settings.

Reads configuration from environment variables.
Databricks credentials are kept here (server-side only) — never exposed
to the browser bundle.
"""

import os
import json


class Settings:
    """Immutable configuration loaded once at startup."""

    def __init__(self) -> None:
        # Load .env file if present (for local development)
        try:
            from pathlib import Path
            from dotenv import load_dotenv
            # Look for .env in the backend/ directory regardless of cwd
            env_path = Path(__file__).parent.parent / ".env"
            load_dotenv(env_path)
        except ImportError:
            pass  # python-dotenv is optional in production

    # --- Databricks SQL Warehouse ---
    @property
    def DATABRICKS_HOST(self) -> str:
        return os.getenv("DATABRICKS_HOST", "")

    @property
    def DATABRICKS_TOKEN(self) -> str:
        return os.getenv("DATABRICKS_TOKEN", "")

    # OAuth M2M — auto-injected by Databricks Apps for the service principal
    @property
    def DATABRICKS_CLIENT_ID(self) -> str:
        return os.getenv("DATABRICKS_CLIENT_ID", "")

    @property
    def DATABRICKS_CLIENT_SECRET(self) -> str:
        return os.getenv("DATABRICKS_CLIENT_SECRET", "")

    @property
    def DATABRICKS_WAREHOUSE_ID(self) -> str:
        return os.getenv("DATABRICKS_WAREHOUSE_ID", "")

    @property
    def DATABRICKS_CATALOG(self) -> str:
        return os.getenv("DATABRICKS_CATALOG", "main")

    @property
    def DATABRICKS_SCHEMA(self) -> str:
        return os.getenv("DATABRICKS_SCHEMA", "default")

    # --- User Preferences table location ---
    @property
    def PREFERENCES_CATALOG(self) -> str:
        return os.getenv("PREFERENCES_CATALOG", "workspace")

    @property
    def PREFERENCES_SCHEMA(self) -> str:
        return os.getenv("PREFERENCES_SCHEMA", "preferences")

    # --- Enterprise feasibility flags ---
    @property
    def ENTERPRISE_ENABLE_EXTERNAL_MOCK_SOURCE(self) -> bool:
        return os.getenv("ENTERPRISE_ENABLE_EXTERNAL_MOCK_SOURCE", "true").lower() == "true"

    @property
    def ENTERPRISE_WORKSPACE_POLICY(self) -> dict[str, dict[str, object]]:
        """
        Workspace allowlist policy.

        Example env value:
        {
          "workspace-a": {"policy_id": "policy-a", "catalogs": ["workspace"], "schemas": ["default"]}
        }
        """
        raw = os.getenv("ENTERPRISE_WORKSPACE_POLICY", "").strip()
        if raw:
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, dict):
                    return parsed
            except json.JSONDecodeError:
                pass

        # Safe default for local feasibility tests
        return {
            "workspace-default": {
                "policy_id": "policy-default",
                "catalogs": [self.DATABRICKS_CATALOG],
                "schemas": [self.DATABRICKS_SCHEMA],
            }
        }

    # --- App ---
    APP_PORT: int = int(os.getenv("APP_PORT", "8000"))
    CORS_ORIGINS: list[str] = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173"
    ).split(",")

    # --- Genie Space ---
    @property
    def GENIE_SPACE_ID(self) -> str:
        return os.getenv("GENIE_SPACE_ID", "")

    @property
    def is_genie_configured(self) -> bool:
        return bool(self.GENIE_SPACE_ID and self.DATABRICKS_HOST)

    @property
    def is_databricks_configured(self) -> bool:
        has_host      = bool(self.DATABRICKS_HOST and self.DATABRICKS_WAREHOUSE_ID)
        has_token     = bool(self.DATABRICKS_TOKEN)
        has_oauth     = bool(self.DATABRICKS_CLIENT_ID and self.DATABRICKS_CLIENT_SECRET)
        return has_host and (has_token or has_oauth)


settings = Settings()
