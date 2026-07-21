"""Secondary Databricks source adapter (POC 1: multiple data sources).

Reads KPIs from a different Unity Catalog location (e.g. `democatalog`)
to demonstrate that the application can expose more than one governed
data source without changing the baseline dashboard path.
"""

from __future__ import annotations

from config.settings import settings
from services.databricks_service import execute_query


class SecondaryDatabricksSource:
    source_id = "democatalog"
    source_type = "databricks_sql"
    is_default = False
    is_active = True
    capabilities = ("kpi", "filters")

    def is_accessible(self) -> bool:
        """Lightweight probe: can the current identity read this source's data?

        Used to hide sources the caller has no Unity Catalog grants for, so the
        UI only offers data sources the user can actually query.
        """
        table = (
            f"{settings.ENTERPRISE_SECONDARY_SOURCE_CATALOG}."
            f"{settings.ENTERPRISE_SECONDARY_SOURCE_SCHEMA}.{settings.SECONDARY_KPI_TABLE}"
        )
        try:
            execute_query(f"SELECT 1 FROM {table} LIMIT 1")
            return True
        except Exception:
            return False

    def fetch_kpis(self) -> list[dict[str, str]]:
        table = (
            f"{settings.ENTERPRISE_SECONDARY_SOURCE_CATALOG}."
            f"{settings.ENTERPRISE_SECONDARY_SOURCE_SCHEMA}.{settings.SECONDARY_KPI_TABLE}"
        )
        rows = execute_query(
            f"SELECT metric_name, metric_value FROM {table} ORDER BY metric_name"
        )
        return [
            {"name": str(row.get("metric_name")), "value": str(row.get("metric_value"))}
            for row in rows
        ]

    def fetch_filters(self) -> list[str]:
        table = (
            f"{settings.ENTERPRISE_SECONDARY_SOURCE_CATALOG}."
            f"{settings.ENTERPRISE_SECONDARY_SOURCE_SCHEMA}.{settings.SECONDARY_FILTER_TABLE}"
        )
        rows = execute_query(f"SELECT region FROM {table} ORDER BY region")
        return [str(row.get("region")) for row in rows]
