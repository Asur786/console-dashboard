"""Config-driven Databricks source adapter.

A single generic adapter that reads its catalog/schema/tables/columns from a
config dictionary (supplied via the ENTERPRISE_DATA_SOURCES environment
variable). This means a new data source can be added with **no code change** —
just add a JSON entry in the environment.

Each configured source must follow a small, stable contract:
  - a KPI table with a name column and a value column
  - a filter table with a single filter column

Config keys (camelCase to match the env JSON):
  sourceId, catalog, schema,
  kpiTable, kpiNameColumn, kpiValueColumn,
  filterTable, filterColumn
"""

from __future__ import annotations

from typing import Any

from services.databricks_service import execute_query


class ConfigurableDatabricksSource:
    source_type = "databricks_sql"
    is_default = False
    is_active = True
    capabilities = ("kpi", "filters")

    def __init__(self, config: dict[str, Any]) -> None:
        self.source_id = str(config["sourceId"])
        self._catalog = str(config["catalog"])
        self._schema = str(config["schema"])
        self._kpi_table = str(config.get("kpiTable", "kpi_summary"))
        self._filter_table = str(config.get("filterTable", "filter_region"))
        self._kpi_name_col = str(config.get("kpiNameColumn", "metric_name"))
        self._kpi_value_col = str(config.get("kpiValueColumn", "metric_value"))
        self._filter_col = str(config.get("filterColumn", "region"))

    @property
    def _kpi_full(self) -> str:
        return f"{self._catalog}.{self._schema}.{self._kpi_table}"

    @property
    def _filter_full(self) -> str:
        return f"{self._catalog}.{self._schema}.{self._filter_table}"

    def is_accessible(self) -> bool:
        """Lightweight probe: can the current identity read this source's data?"""
        try:
            execute_query(f"SELECT 1 FROM {self._kpi_full} LIMIT 1")
            return True
        except Exception:
            return False

    def fetch_kpis(self) -> list[dict[str, str]]:
        rows = execute_query(
            f"SELECT {self._kpi_name_col} AS name, {self._kpi_value_col} AS value "
            f"FROM {self._kpi_full} ORDER BY {self._kpi_name_col}"
        )
        return [
            {"name": str(row.get("name")), "value": str(row.get("value"))}
            for row in rows
        ]

    def fetch_filters(self) -> list[str]:
        rows = execute_query(
            f"SELECT DISTINCT {self._filter_col} AS value "
            f"FROM {self._filter_full} ORDER BY {self._filter_col}"
        )
        return [str(row.get("value")) for row in rows]
