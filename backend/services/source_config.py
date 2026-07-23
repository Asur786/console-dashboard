"""
Data-source configuration — the manageable, table-driven list of enterprise
(secondary) data sources.

The data sources live in a Delta table in the gold schema
(``{GOLD_CATALOG}.{GOLD_SCHEMA}.{GOLD_SOURCE_CONFIG_TABLE}``). Admins add,
remove, rename or reorder sources by editing rows in that table — no code, env
change or redeploy required. The backend reads the table live (cached briefly)
and falls back to ``settings.ENTERPRISE_DATA_SOURCES`` (env/default) when the
table is missing, empty, or unreachable, so the app always works.

This is the same "Option 2" table-driven dynamism used for filters via
``filter_config``.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from config.settings import settings

# The config table is app infrastructure (like the preferences/filter tables):
# always accessed with the app identity, never the per-user on-behalf-of token.
from services.databricks_service import (
    execute_query as _execute_query,
    execute_write as _execute_write,
)

logger = logging.getLogger(__name__)


def _full_table() -> str:
    return (
        f"{settings.GOLD_CATALOG}.{settings.GOLD_SCHEMA}."
        f"{settings.GOLD_SOURCE_CONFIG_TABLE}"
    )


def _execute_query_app(sql: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    return _execute_query(sql, params, as_app=True)


def _execute_write_app(sql: str, params: dict[str, Any] | None = None) -> None:
    _execute_write(sql, params, as_app=True)


# --------------------------------------------------------------------------- #
#  In-process cache (short TTL so edits show up without a restart)            #
# --------------------------------------------------------------------------- #
_CACHE_TTL_SECONDS = 30.0
_cache: list[dict[str, str]] | None = None
_cache_ts: float = 0.0
_table_ready: bool = False


def _default_sources() -> list[dict[str, str]]:
    """The env/built-in fallback list (normalised to the camelCase dict shape)."""
    return [dict(s) for s in settings.ENTERPRISE_DATA_SOURCES]


def ensure_table(force: bool = False) -> None:
    """Create the source-config table if absent and seed it with the defaults.

    Idempotent and best-effort: any failure is logged and swallowed so a
    missing warehouse never blocks startup (the app falls back to the defaults).
    """
    global _table_ready
    if _table_ready and not force:
        return

    table = _full_table()
    try:
        _execute_write_app(
            f"CREATE SCHEMA IF NOT EXISTS "
            f"{settings.GOLD_CATALOG}.{settings.GOLD_SCHEMA}"
        )
        _execute_write_app(
            f"""
            CREATE TABLE IF NOT EXISTS {table} (
              source_id        STRING  NOT NULL,
              catalog          STRING  NOT NULL,
              schema           STRING  NOT NULL,
              kpi_table        STRING  NOT NULL,
              kpi_name_column  STRING,
              kpi_value_column STRING,
              filter_table     STRING,
              filter_column    STRING,
              sort_order       INT,
              enabled          BOOLEAN
            )
            USING DELTA
            COMMENT 'Manageable list of enterprise data sources. Edit rows to '
                    'add/remove/rename/reorder sources — read live by the app.'
            TBLPROPERTIES ('layer' = 'application', 'module' = 'source-config')
            """
        )

        # Seed with the defaults only when the table is empty, so admin edits
        # are never overwritten on restart.
        rows = _execute_query_app(f"SELECT COUNT(*) AS n FROM {table}")
        count = int(rows[0]["n"]) if rows else 0
        if count == 0:
            defaults = _default_sources()
            for i, src in enumerate(defaults):
                _execute_write_app(
                    f"""
                    INSERT INTO {table}
                      (source_id, catalog, schema, kpi_table, kpi_name_column,
                       kpi_value_column, filter_table, filter_column,
                       sort_order, enabled)
                    VALUES
                      (%(source_id)s, %(catalog)s, %(schema)s, %(kpi_table)s,
                       %(kpi_name_column)s, %(kpi_value_column)s,
                       %(filter_table)s, %(filter_column)s, %(sort_order)s, true)
                    """,
                    {
                        "source_id": str(src["sourceId"]),
                        "catalog": str(src["catalog"]),
                        "schema": str(src["schema"]),
                        "kpi_table": str(src.get("kpiTable", "kpi_summary")),
                        "kpi_name_column": str(src.get("kpiNameColumn", "metric_name")),
                        "kpi_value_column": str(src.get("kpiValueColumn", "metric_value")),
                        "filter_table": str(src.get("filterTable", "filter_region")),
                        "filter_column": str(src.get("filterColumn", "region")),
                        "sort_order": i,
                    },
                )
            logger.info(
                "Seeded source-config table %s with %d defaults", table, len(defaults)
            )

        _table_ready = True
        logger.info("Source-config table ready: %s", table)
    except Exception:
        logger.exception(
            "Source-config table init failed (%s) — falling back to defaults", table
        )


def _read_table() -> list[dict[str, str]]:
    """Read enabled sources from the config table, ordered by sort_order."""
    table = _full_table()
    rows = _execute_query_app(
        f"""
        SELECT source_id, catalog, schema, kpi_table, kpi_name_column,
               kpi_value_column, filter_table, filter_column
        FROM {table}
        WHERE enabled = true OR enabled IS NULL
        ORDER BY sort_order NULLS LAST, source_id
        """
    )
    sources: list[dict[str, str]] = []
    for r in rows:
        source_id = str(r.get("source_id") or "").strip()
        catalog = str(r.get("catalog") or "").strip()
        if not source_id or not catalog:
            continue
        sources.append(
            {
                "sourceId": source_id,
                "catalog": catalog,
                "schema": str(r.get("schema") or "default"),
                "kpiTable": str(r.get("kpi_table") or "kpi_summary"),
                "kpiNameColumn": str(r.get("kpi_name_column") or "metric_name"),
                "kpiValueColumn": str(r.get("kpi_value_column") or "metric_value"),
                "filterTable": str(r.get("filter_table") or "filter_region"),
                "filterColumn": str(r.get("filter_column") or "region"),
            }
        )
    return sources


def get_sources() -> list[dict[str, str]]:
    """Return the current enterprise data sources (table-driven, cached, fallback).

    Order of preference:
      1. Rows from the config table (if it has any enabled rows).
      2. ``settings.ENTERPRISE_DATA_SOURCES`` (env or built-in defaults).
    """
    global _cache, _cache_ts
    now = time.monotonic()
    if _cache is not None and (now - _cache_ts) < _CACHE_TTL_SECONDS:
        return _cache

    try:
        sources = _read_table()
        if sources:
            _cache = sources
            _cache_ts = now
            return sources
    except Exception:
        logger.warning(
            "Source-config table unreadable — using ENTERPRISE_DATA_SOURCES defaults",
            exc_info=True,
        )

    # Fallback: env/built-in defaults (do not cache failures for long).
    fallback = _default_sources()
    _cache = fallback
    _cache_ts = now
    return fallback


def invalidate_cache() -> None:
    """Drop the cache so the next read hits the table (e.g. after an admin edit)."""
    global _cache, _cache_ts
    _cache = None
    _cache_ts = 0.0
