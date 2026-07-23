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

import contextvars
import logging
from contextlib import contextmanager
from typing import Any, Generator

from config.settings import settings

logger = logging.getLogger(__name__)

# Per-request Databricks access token for the logged-in user (on-behalf-of).
# Set by middleware from the `x-forwarded-access-token` header that Databricks
# Apps injects. When present, data queries run AS the user so Unity Catalog
# grants filter results per identity. App-infrastructure queries bypass it.
user_access_token_var: contextvars.ContextVar["str | None"] = contextvars.ContextVar(
    "user_access_token", default=None
)

# =========================================================================== #
#  OAuth token cache (avoids re-fetching on every query within the process)   #
# =========================================================================== #

import time as _time

_oauth_cache: dict[str, Any] = {}   # {"token": str, "expires_at": float}


def _get_oauth_token() -> str:
    """
    Exchange DATABRICKS_CLIENT_ID + DATABRICKS_CLIENT_SECRET for an
    OAuth access token using the Databricks OIDC endpoint.
    Token is cached in-process until 60 seconds before expiry.
    """
    now = _time.time()
    if _oauth_cache.get("token") and _oauth_cache.get("expires_at", 0) - 60 > now:
        return _oauth_cache["token"]  # type: ignore[return-value]

    import requests as _req
    host   = settings.DATABRICKS_HOST
    c_id   = settings.DATABRICKS_CLIENT_ID
    c_sec  = settings.DATABRICKS_CLIENT_SECRET

    resp = _req.post(
        f"https://{host}/oidc/v1/token",
        data={"grant_type": "client_credentials", "scope": "all-apis"},
        auth=(c_id, c_sec),
        timeout=30,
    )
    resp.raise_for_status()
    payload = resp.json()

    _oauth_cache["token"]      = payload["access_token"]
    _oauth_cache["expires_at"] = now + int(payload.get("expires_in", 3600))
    logger.info("OAuth M2M token acquired (expires_in=%ss)", payload.get("expires_in"))
    return _oauth_cache["token"]  # type: ignore[return-value]


# =========================================================================== #
#  Connection & query execution                                                #
# =========================================================================== #

@contextmanager
def _connection(as_app: bool = False) -> Generator[Any, None, None]:
    """Opens and closes a Databricks SQL connection.

    Auth priority:
      1. On-behalf-of the logged-in user (x-forwarded-access-token) for data
         queries — so Unity Catalog grants filter results per user.
      2. DATABRICKS_TOKEN  (personal access token — local dev / explicit config)
      3. DATABRICKS_CLIENT_ID + DATABRICKS_CLIENT_SECRET  (OAuth M2M —
         auto-injected by Databricks Apps for the app service principal)

    Pass as_app=True for app-infrastructure queries (e.g. the preferences
    table) that must always run as the app identity, not the end user.
    """
    if not settings.is_databricks_configured:
        raise RuntimeError(
            "Databricks is not configured. "
            "Set DATABRICKS_HOST, DATABRICKS_WAREHOUSE_ID, and either "
            "DATABRICKS_TOKEN or (DATABRICKS_CLIENT_ID + DATABRICKS_CLIENT_SECRET) "
            "in the Databricks Apps environment variables."
        )

    from databricks import sql as dbsql  # lazy import

    # Resolve auth token. Data queries run on-behalf-of the logged-in user
    # (their forwarded token); app-infrastructure queries (as_app=True) always
    # use the app identity (PAT locally, or the app service principal in prod).
    user_token = None if as_app else user_access_token_var.get()
    access_token = user_token or settings.DATABRICKS_TOKEN or _get_oauth_token()

    conn = dbsql.connect(
        server_hostname=settings.DATABRICKS_HOST,
        http_path=f"/sql/1.0/warehouses/{settings.DATABRICKS_WAREHOUSE_ID}",
        access_token=access_token,
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
    as_app: bool = False,
) -> list[dict[str, Any]]:
    """
    Execute a SQL statement against the Databricks SQL Warehouse
    and return the result set as a list of Python dictionaries.

    - Uses parameterised queries (%(name)s placeholders) to prevent SQL injection.
    - Coerces Decimal values to float for JSON serialisation.
    - as_app=True runs as the app identity (for app-infrastructure tables).
    """
    logger.debug("Executing SQL:\n%s\nParams: %s", sql, params)

    with _connection(as_app=as_app) as conn:
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


def execute_write(
    sql: str,
    params: dict[str, Any] | None = None,
    as_app: bool = False,
) -> None:
    """
    Execute a write statement (INSERT / UPDATE / DELETE / MERGE / CREATE)
    against the Databricks SQL Warehouse.

    Unlike execute_query, this does NOT attempt to fetch results — DML
    statements return no result set and cursor.description is None.

    - Uses parameterised queries (%(name)s placeholders) to prevent SQL injection.
    - as_app=True runs as the app identity (for app-infrastructure tables).
    """
    logger.debug("Executing write SQL:\n%s\nParams: %s", sql, params)

    with _connection(as_app=as_app) as conn:
        with conn.cursor() as cursor:
            cursor.execute(sql, parameters=params)

    logger.debug("Write statement executed successfully")


# =========================================================================== #
#  DatabricksService                                                           #
# =========================================================================== #

class DatabricksService:
    """All Databricks SQL logic lives here. Routes never see raw SQL."""

    # ------------------------------------------------------------------ #
    #  Filters (dimension-driven — see settings.FILTER_DIMENSIONS)         #
    # ------------------------------------------------------------------ #

    def _resolve_option_table(self, option_table: str) -> str:
        """Map a logical option-table name to a physical table name."""
        if option_table == "market":
            return settings.MARKET_DIM_TABLE
        if option_table == "product":
            return settings.PRODUCT_DIM_TABLE
        return option_table  # already a fully-qualified name

    def get_filters(self) -> list[dict[str, Any]]:
        """
        Returns one entry per configured filter dimension:
          [{ "key": "channel", "label": "Channel",
             "options": [{ "value": "ALL", "label": "All" }, ...] }, ...]

        Dimensions, their source tables and columns come from the manageable
        filter-config table (with env/default fallback), so adding a filter
        needs no code change.
        """
        from services import filter_config

        dimensions: list[dict[str, Any]] = []
        for dim in filter_config.get_dimensions():
            key = str(dim["key"])
            label = str(dim.get("label", key.title()))
            table = self._resolve_option_table(str(dim["optionTable"]))
            column = str(dim["optionColumn"])
            sql = (
                f"SELECT DISTINCT {column} AS value "
                f"FROM {table} "
                f"WHERE {column} IS NOT NULL "
                f"ORDER BY 1"
            )
            rows = execute_query(sql)
            options: list[dict[str, str]] = [{"value": "ALL", "label": "All"}]
            for row in rows:
                val = str(row["value"]).strip()
                if val:
                    options.append({"value": val, "label": val})
            dimensions.append({"key": key, "label": label, "options": options})

        logger.info(
            "Loaded filters from Databricks: %s",
            {d["key"]: len(d["options"]) for d in dimensions},
        )
        return dimensions

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
    FROM {fact} f
    JOIN {market} m   ON f.MarketID  = m.MarketId
    JOIN {product} p  ON f.ProductID = p.ProductId
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
    FROM {fact} f
    JOIN {market} m   ON f.MarketID  = m.MarketId
    JOIN {product} p  ON f.ProductID = p.ProductId
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

        sql = self._KPI_SQL.format(
            fact=settings.KPI_FACT_TABLE,
            market=settings.MARKET_DIM_TABLE,
            product=settings.PRODUCT_DIM_TABLE,
        )
        rows = execute_query(sql, params)

        if not rows:
            return dict(self._EMPTY_KPIS)

        row = rows[0]
        return {k: float(v) if v is not None else 0.0 for k, v in row.items()}

    # ------------------------------------------------------------------ #
    #  Gold KPI layer (table-driven, fully dynamic KPIs)                 #
    # ------------------------------------------------------------------ #
    def get_gold_kpis(
        self,
        filters: dict[str, str] | None = None,
    ) -> list[dict[str, Any]]:
        """Read KPIs directly from the gold KPI summary table.

        Fully dynamic: whatever KPI rows exist in the table are returned, so
        adding/removing a KPI needs no code change. Filtering is driven by the
        manageable filter-config table — each dimension maps to a gold column
        and uses the convention that a NULL dimension in the table means "ALL";
        picking a value matches that dimension, and 'ALL' matches the NULL
        (pre-aggregated) rows.
        """
        from services import filter_config

        filters = filters or {}
        table = (
            f"{settings.GOLD_CATALOG}.{settings.GOLD_SCHEMA}.{settings.GOLD_KPI_TABLE}"
        )

        where_clauses: list[str] = []
        params: dict[str, str] = {}
        for dim in filter_config.get_dimensions():
            key = str(dim["key"])
            gold_col = str(dim["goldColumn"])
            value = filters.get(key, "ALL") or "ALL"
            params[key] = value
            where_clauses.append(
                f"(CASE WHEN %({key})s = 'ALL' THEN {gold_col} IS NULL "
                f"ELSE {gold_col} = %({key})s END)"
            )

        where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
        sql = f"""
            SELECT kpi_name,
                   ANY_VALUE(unit_of_measure)    AS unit_of_measure,
                   ANY_VALUE(current_year_value) AS current_year_value,
                   ANY_VALUE(previous_year_value) AS previous_year_value,
                   ANY_VALUE(yoy_growth_pct)     AS yoy_growth_pct,
                   ANY_VALUE(share_pct)          AS share_pct,
                   ANY_VALUE(trend_indicator)    AS trend_indicator,
                   ANY_VALUE(kpi_id)             AS kpi_id
            FROM {table}
            WHERE {where_sql}
            GROUP BY kpi_name
            ORDER BY kpi_name
        """
        return execute_query(sql, params)

    def get_gold_kpi_names(self) -> list[str]:
        """Distinct KPI names from the gold KPI table (for dynamic checklists)."""
        table = (
            f"{settings.GOLD_CATALOG}.{settings.GOLD_SCHEMA}.{settings.GOLD_KPI_TABLE}"
        )
        rows = execute_query(
            f"SELECT DISTINCT kpi_name FROM {table} "
            f"WHERE kpi_name IS NOT NULL ORDER BY kpi_name"
        )
        return [str(r.get("kpi_name")) for r in rows]


# Module-level singleton
databricks_service = DatabricksService()
