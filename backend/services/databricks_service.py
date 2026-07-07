"""
DatabricksService — single point of access for all Databricks SQL queries.

Uses the Databricks SQL Connector for Python to execute queries against
a SQL Warehouse in Unity Catalog.

Connection details are read from environment variables:
  DATABRICKS_HOST          — workspace hostname
  DATABRICKS_TOKEN         — personal access token or service principal token
  DATABRICKS_WAREHOUSE_ID  — SQL Warehouse ID
  DATABRICKS_CATALOG       — Unity Catalog name  (default: "main")
  DATABRICKS_SCHEMA        — schema / database    (default: "default")
"""

from __future__ import annotations

import logging
from contextlib import contextmanager
from typing import Any, Generator

from config.settings import settings

logger = logging.getLogger(__name__)


# =========================================================================== #
#  Connection & query execution                                                #
# =========================================================================== #

@contextmanager
def _connection() -> Generator[Any, None, None]:
    """Opens and closes a Databricks SQL connection."""
    from databricks import sql as dbsql  # lazy import

    conn = dbsql.connect(
        server_hostname=settings.DATABRICKS_HOST,
        http_path=f"/sql/1.0/warehouses/{settings.DATABRICKS_WAREHOUSE_ID}",
        access_token=settings.DATABRICKS_TOKEN,
        catalog=settings.DATABRICKS_CATALOG,
        schema=settings.DATABRICKS_SCHEMA,
    )
    try:
        yield conn
    finally:
        conn.close()


def execute_query(
    sql: str,
    params: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """
    Execute a SQL statement against the Databricks SQL Warehouse
    and return the result set as a list of Python dictionaries.

    - Uses parameterised queries (%(name)s placeholders) to prevent SQL injection.
    - Coerces Decimal values to float for JSON serialisation.
    """
    logger.debug("Executing SQL:\n%s\nParams: %s", sql, params)

    with _connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(sql, parameters=params)
            columns = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()

    result = []
    for row in rows:
        record: dict[str, Any] = {}
        for col, val in zip(columns, row):
            if val is not None and hasattr(val, "as_tuple"):
                record[col] = float(val)
            elif val is not None:
                record[col] = val
            else:
                record[col] = None
        result.append(record)

    logger.debug("Query returned %d row(s)", len(result))
    return result


# =========================================================================== #
#  DatabricksService                                                           #
# =========================================================================== #

class DatabricksService:
    """All Databricks SQL logic lives here. Routes never see raw SQL."""

    # ------------------------------------------------------------------ #
    #  Filters                                                            #
    # ------------------------------------------------------------------ #

    _FILTER_QUERIES: dict[str, str] = {
        "channels": (
            "SELECT DISTINCT GlobalChannel AS value "
            "FROM marketdimension "
            "WHERE GlobalChannel IS NOT NULL "
            "ORDER BY 1"
        ),
        "categories": (
            "SELECT DISTINCT Category AS value "
            "FROM productdimension "
            "WHERE Category IS NOT NULL "
            "ORDER BY 1"
        ),
        "retailers": (
            "SELECT DISTINCT GlobalRetailer AS value "
            "FROM marketdimension "
            "WHERE GlobalRetailer IS NOT NULL "
            "ORDER BY 1"
        ),
        "countries": (
            "SELECT DISTINCT Country AS value "
            "FROM marketdimension "
            "WHERE Country IS NOT NULL "
            "ORDER BY 1"
        ),
    }

    _ALL_LABELS: dict[str, str] = {
        "channels": "All Channels",
        "categories": "All Categories",
        "retailers": "All Retailers",
        "countries": "All Countries",
    }

    def get_filters(self) -> dict[str, list[dict[str, str]]]:
        """
        Returns { channels: [...], categories: [...], retailers: [...], countries: [...] }.
        Each item is { "value": "...", "label": "..." }.
        Source: marketdimension.GlobalChannel / productdimension.Category / etc.
        """
        result: dict[str, list[dict[str, str]]] = {}

        for key, sql in self._FILTER_QUERIES.items():
            rows = execute_query(sql)
            options: list[dict[str, str]] = [
                {"value": "ALL", "label": self._ALL_LABELS[key]}
            ]
            for row in rows:
                val = str(row["value"]).strip()
                if val:
                    options.append({"value": val, "label": val})
            result[key] = options

        logger.info(
            "Loaded filters from Databricks: %s",
            {k: len(v) for k, v in result.items()},
        )
        return result

    # ------------------------------------------------------------------ #
    #  Performance Summary KPIs                                           #
    # ------------------------------------------------------------------ #

    _KPI_SQL = """
WITH filtered AS (
    SELECT
        SUM(f.CurrentYearDollarSales)  AS cy_dollar_sales,
        SUM(f.PreviousYearDollarSales) AS py_dollar_sales,
        SUM(f.CurrentYearVolumeSales)  AS cy_volume_sales,
        SUM(f.PreviousYearVolumeSales) AS py_volume_sales,
        COUNT(DISTINCT CASE WHEN m.KPIIndicator = 1 THEN m.MarketId END)
            AS dist_present_markets
    FROM r12mfact f
    JOIN marketdimension m   ON f.MarketID  = m.MarketId
    JOIN productdimension p  ON f.ProductID = p.ProductId
    WHERE (%(channel)s = 'ALL'  OR m.GlobalChannel  = %(channel)s)
      AND (%(category)s = 'ALL' OR p.Category       = %(category)s)
      AND (%(retailer)s = 'ALL' OR m.GlobalRetailer  = %(retailer)s)
      AND (%(country)s = 'ALL'  OR m.Country         = %(country)s)
),
total AS (
    SELECT
        SUM(f.CurrentYearDollarSales) AS total_cy_dollar_sales,
        SUM(f.CurrentYearVolumeSales) AS total_cy_volume_sales,
        COUNT(DISTINCT m.MarketId)    AS total_markets
    FROM r12mfact f
    JOIN marketdimension m   ON f.MarketID  = m.MarketId
    JOIN productdimension p  ON f.ProductID = p.ProductId
)
SELECT
    filtered.cy_dollar_sales,
    filtered.py_dollar_sales,
    filtered.cy_volume_sales,
    filtered.py_volume_sales,
    CASE WHEN total.total_cy_dollar_sales > 0
         THEN ROUND(filtered.cy_dollar_sales / total.total_cy_dollar_sales * 100, 1)
         ELSE 0
    END AS dollar_share,
    CASE WHEN total.total_cy_volume_sales > 0
         THEN ROUND(filtered.cy_volume_sales / total.total_cy_volume_sales * 100, 1)
         ELSE 0
    END AS volume_share,
    CASE WHEN total.total_markets > 0
         THEN ROUND(filtered.dist_present_markets * 1.0 / total.total_markets * 100, 1)
         ELSE 0
    END AS distribution,
    CASE WHEN filtered.py_dollar_sales > 0
         THEN ROUND(
             (filtered.cy_dollar_sales - filtered.py_dollar_sales)
             / filtered.py_dollar_sales * 100, 1)
         ELSE 0
    END AS yoy_growth
FROM filtered
CROSS JOIN total
""".strip()

    _EMPTY_KPIS: dict[str, Any] = {
        "cy_dollar_sales": 0.0,
        "py_dollar_sales": 0.0,
        "cy_volume_sales": 0.0,
        "py_volume_sales": 0.0,
        "dollar_share": 0.0,
        "volume_share": 0.0,
        "distribution": 0.0,
        "yoy_growth": 0.0,
    }

    def get_performance_summary(
        self,
        channel: str = "ALL",
        category: str = "ALL",
        retailer: str = "ALL",
        country: str = "ALL",
    ) -> dict[str, Any]:
        """
        Executes the KPI aggregation query against r12mfact and returns raw values.
        """
        params = {
            "channel": channel,
            "category": category,
            "retailer": retailer,
            "country": country,
        }

        rows = execute_query(self._KPI_SQL, params)

        if not rows:
            return dict(self._EMPTY_KPIS)

        row = rows[0]
        return {k: float(v) if v is not None else 0.0 for k, v in row.items()}


# Module-level singleton
databricks_service = DatabricksService()
