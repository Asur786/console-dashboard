"""Databricks source adapter wrapper for enterprise feasibility flows."""

from __future__ import annotations


class DatabricksSourceAdapter:
    source_id = "databricks-default"
    source_type = "databricks_sql"
    is_default = True
    is_active = True
    capabilities = ("kpi", "filters", "insights", "preferences")

    def is_accessible(self) -> bool:
        """Lightweight probe: can the current identity read this source's data?

        Used to hide sources the caller has no Unity Catalog grants for, so the
        UI only offers data sources the user can actually query.
        """
        from services.databricks_service import execute_query
        from config.settings import settings

        try:
            execute_query(f"SELECT 1 FROM {settings.KPI_FACT_TABLE} LIMIT 1")
            return True
        except Exception:
            return False

    def fetch_kpis(self, filters: dict[str, str]) -> dict[str, object]:
        # POC adapter: return metadata describing the configured default source.
        return {
            "status": "ok",
            "sourceId": self.source_id,
            "filters": filters,
            "items": [],
        }
