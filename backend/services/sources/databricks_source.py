"""Databricks source adapter wrapper for enterprise feasibility flows."""

from __future__ import annotations


class DatabricksSourceAdapter:
    source_id = "databricks-default"
    source_type = "databricks_sql"
    is_default = True
    is_active = True
    capabilities = ("kpi", "filters", "insights", "preferences")

    def fetch_kpis(self, filters: dict[str, str]) -> dict[str, object]:
        # POC adapter: return metadata describing the configured default source.
        return {
            "status": "ok",
            "sourceId": self.source_id,
            "filters": filters,
            "items": [],
        }
