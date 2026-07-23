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

    # POC 1: second real Databricks source (e.g. democatalog)
    @property
    def ENTERPRISE_ENABLE_SECONDARY_SOURCE(self) -> bool:
        return os.getenv("ENTERPRISE_ENABLE_SECONDARY_SOURCE", "true").lower() == "true"

    @property
    def ENTERPRISE_SECONDARY_SOURCE_CATALOG(self) -> str:
        return os.getenv("ENTERPRISE_SECONDARY_SOURCE_CATALOG", "democatalog")

    @property
    def ENTERPRISE_SECONDARY_SOURCE_SCHEMA(self) -> str:
        return os.getenv("ENTERPRISE_SECONDARY_SOURCE_SCHEMA", "default")

    # --- Physical table names (data model) — overridable per deployment ---
    # Catalog/schema come from the settings above; only override these if your
    # physical tables are named differently. No code change required.
    @property
    def KPI_FACT_TABLE(self) -> str:
        return os.getenv("KPI_FACT_TABLE", "r12mfact")

    @property
    def MARKET_DIM_TABLE(self) -> str:
        return os.getenv("MARKET_DIM_TABLE", "marketdimension")

    @property
    def PRODUCT_DIM_TABLE(self) -> str:
        return os.getenv("PRODUCT_DIM_TABLE", "productdimension")

    @property
    def SECONDARY_KPI_TABLE(self) -> str:
        return os.getenv("SECONDARY_KPI_TABLE", "kpi_summary")

    @property
    def SECONDARY_FILTER_TABLE(self) -> str:
        return os.getenv("SECONDARY_FILTER_TABLE", "filter_region")

    # --- Gold KPI layer (table-driven, dynamic KPIs) ---
    @property
    def GOLD_CATALOG(self) -> str:
        return os.getenv("GOLD_CATALOG", self.DATABRICKS_CATALOG)

    @property
    def GOLD_SCHEMA(self) -> str:
        return os.getenv("GOLD_SCHEMA", "gold")

    @property
    def GOLD_KPI_TABLE(self) -> str:
        return os.getenv("GOLD_KPI_TABLE", "gold_kpi_summary")

    @property
    def GOLD_FILTER_CONFIG_TABLE(self) -> str:
        """Table (in the gold schema) that stores the manageable filter list.

        Admins add/remove/rename/reorder filters by editing rows in this table
        — no env change or redeploy needed. Falls back to FILTER_DIMENSIONS
        (env/default) when the table is missing or empty.
        """
        return os.getenv("GOLD_FILTER_CONFIG_TABLE", "filter_dimensions")

    @property
    def GOLD_SOURCE_CONFIG_TABLE(self) -> str:
        """Table (in the gold schema) that stores the manageable data-source list.

        Admins add/remove/rename/reorder enterprise data sources by editing rows
        in this table — no env change or redeploy needed. Falls back to
        ENTERPRISE_DATA_SOURCES (env/default) when the table is missing or empty.
        """
        return os.getenv("GOLD_SOURCE_CONFIG_TABLE", "enterprise_data_sources")

    @property
    def GOLD_WORKSPACE_POLICY_TABLE(self) -> str:
        """Table (in the gold schema) that stores the manageable workspace policy.

        Admins add/remove workspaces (and their allowed catalogs/schemas) by
        editing rows in this table — no env change or redeploy needed. Falls back
        to ENTERPRISE_WORKSPACE_POLICY (env/default) when the table is missing or
        empty. This is what lets brand-new workspaces be onboarded live.
        """
        return os.getenv("GOLD_WORKSPACE_POLICY_TABLE", "workspace_policies")

    @property
    def FILTER_DIMENSIONS(self) -> list[dict[str, str]]:
        """Config-driven list of filter dimensions.

        Set FILTER_DIMENSIONS to a JSON array to add/remove a dashboard filter
        with no code change. Each entry:
          - key          stable id used in the API + saved views (e.g. "channel")
          - label        display label (e.g. "Channel")
          - optionTable  where dropdown values come from: "market" | "product"
                         or a fully-qualified table name
          - optionColumn column in optionTable holding the distinct values
          - goldColumn   matching column in the gold KPI table (for filtering)

        Example:
          [{"key":"region","label":"Region","optionTable":"market",
            "optionColumn":"Region","goldColumn":"region"}]

        If unset, defaults to the original four dimensions.
        """
        raw = os.getenv("FILTER_DIMENSIONS", "").strip()
        if raw:
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list) and parsed:
                    return parsed
            except json.JSONDecodeError:
                pass
        return [
            {
                "key": "channel",
                "label": "Channel",
                "optionTable": "market",
                "optionColumn": "GlobalChannel",
                "goldColumn": "global_channel",
            },
            {
                "key": "category",
                "label": "Category",
                "optionTable": "product",
                "optionColumn": "Category",
                "goldColumn": "category",
            },
            {
                "key": "retailer",
                "label": "Retailer",
                "optionTable": "market",
                "optionColumn": "GlobalRetailer",
                "goldColumn": "global_retailer",
            },
            {
                "key": "country",
                "label": "Country",
                "optionTable": "market",
                "optionColumn": "Country",
                "goldColumn": "country",
            },
        ]

    @property
    def ENTERPRISE_DATA_SOURCES(self) -> list[dict[str, object]]:
        """Config-driven list of secondary data sources.

        Set ENTERPRISE_DATA_SOURCES to a JSON array to add/remove sources with
        no code change, e.g.:
          [{"sourceId":"democatalog","catalog":"democatalog","schema":"default",
            "kpiTable":"kpi_summary","kpiNameColumn":"metric_name",
            "kpiValueColumn":"metric_value","filterTable":"filter_region",
            "filterColumn":"region"}]

        If unset, falls back to the single democatalog source (preserving the
        previous behavior) when ENTERPRISE_ENABLE_SECONDARY_SOURCE is true.
        """
        raw = os.getenv("ENTERPRISE_DATA_SOURCES", "").strip()
        if raw:
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                pass

        if not self.ENTERPRISE_ENABLE_SECONDARY_SOURCE:
            return []
        return [
            {
                "sourceId": "democatalog",
                "catalog": self.ENTERPRISE_SECONDARY_SOURCE_CATALOG,
                "schema": self.ENTERPRISE_SECONDARY_SOURCE_SCHEMA,
                "kpiTable": self.SECONDARY_KPI_TABLE,
                "kpiNameColumn": "metric_name",
                "kpiValueColumn": "metric_value",
                "filterTable": self.SECONDARY_FILTER_TABLE,
                "filterColumn": "region",
            }
        ]

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

        # Safe default for local feasibility tests / demo (POC 2)
        return {
            "workspace-a": {
                "policy_id": "policy-a",
                "catalogs": [self.DATABRICKS_CATALOG],
                "schemas": [self.DATABRICKS_SCHEMA],
            },
            "workspace-b": {
                "policy_id": "policy-b",
                "catalogs": [self.ENTERPRISE_SECONDARY_SOURCE_CATALOG],
                "schemas": [self.ENTERPRISE_SECONDARY_SOURCE_SCHEMA],
            },
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
