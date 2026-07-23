"""
Filter configuration — the manageable, table-driven list of dashboard filters.

The filter dimensions live in a Delta table in the gold schema
(``{GOLD_CATALOG}.{GOLD_SCHEMA}.{GOLD_FILTER_CONFIG_TABLE}``). Admins add,
remove, rename or reorder filters by editing rows in that table — no code, env
change or redeploy required. The backend reads the table live (cached briefly)
and falls back to ``settings.FILTER_DIMENSIONS`` (env/default) when the table is
missing, empty, or unreachable, so the dashboard always works.

This is "Option 2": the same table-driven dynamism that KPIs already have via
``gold_kpi_summary``.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from config.settings import settings

# The config table is app infrastructure (like the preferences table): always
# accessed with the app identity, never the per-user on-behalf-of token.
from services.databricks_service import (
    execute_query as _execute_query,
    execute_write as _execute_write,
)

logger = logging.getLogger(__name__)


def _full_table() -> str:
    return (
        f"{settings.GOLD_CATALOG}.{settings.GOLD_SCHEMA}."
        f"{settings.GOLD_FILTER_CONFIG_TABLE}"
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


def _default_dimensions() -> list[dict[str, str]]:
    """The env/built-in fallback list (already normalised to the dict shape)."""
    return [dict(d) for d in settings.FILTER_DIMENSIONS]


def ensure_table(force: bool = False) -> None:
    """Create the filter-config table if absent and seed it with the defaults.

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
              dimension_key  STRING  NOT NULL,
              label          STRING  NOT NULL,
              option_table   STRING  NOT NULL,
              option_column  STRING  NOT NULL,
              gold_column    STRING  NOT NULL,
              sort_order     INT,
              enabled        BOOLEAN
            )
            USING DELTA
            COMMENT 'Manageable list of dashboard filter dimensions. Edit rows '
                    'to add/remove/rename/reorder filters — read live by the app.'
            TBLPROPERTIES ('layer' = 'application', 'module' = 'filter-config')
            """
        )

        # Seed with the defaults only when the table is empty, so admin edits
        # are never overwritten on restart.
        rows = _execute_query_app(f"SELECT COUNT(*) AS n FROM {table}")
        count = int(rows[0]["n"]) if rows else 0
        if count == 0:
            for i, dim in enumerate(_default_dimensions()):
                _execute_write_app(
                    f"""
                    INSERT INTO {table}
                      (dimension_key, label, option_table, option_column,
                       gold_column, sort_order, enabled)
                    VALUES
                      (%(key)s, %(label)s, %(option_table)s, %(option_column)s,
                       %(gold_column)s, %(sort_order)s, true)
                    """,
                    {
                        "key": str(dim["key"]),
                        "label": str(dim.get("label", dim["key"])),
                        "option_table": str(dim["optionTable"]),
                        "option_column": str(dim["optionColumn"]),
                        "gold_column": str(dim["goldColumn"]),
                        "sort_order": i,
                    },
                )
            logger.info("Seeded filter-config table %s with %d defaults", table, i + 1)

        _table_ready = True
        logger.info("Filter-config table ready: %s", table)
    except Exception:
        logger.exception(
            "Filter-config table init failed (%s) — falling back to defaults", table
        )


def _read_table() -> list[dict[str, str]]:
    """Read enabled dimensions from the config table, ordered by sort_order."""
    table = _full_table()
    rows = _execute_query_app(
        f"""
        SELECT dimension_key, label, option_table, option_column, gold_column
        FROM {table}
        WHERE enabled = true OR enabled IS NULL
        ORDER BY sort_order NULLS LAST, dimension_key
        """
    )
    dims: list[dict[str, str]] = []
    for r in rows:
        key = str(r.get("dimension_key") or "").strip()
        if not key:
            continue
        dims.append(
            {
                "key": key,
                "label": str(r.get("label") or key),
                "optionTable": str(r.get("option_table") or "market"),
                "optionColumn": str(r.get("option_column") or ""),
                "goldColumn": str(r.get("gold_column") or ""),
            }
        )
    return dims


def get_dimensions() -> list[dict[str, str]]:
    """Return the current filter dimensions (table-driven, cached, with fallback).

    Order of preference:
      1. Rows from the config table (if it has any enabled rows).
      2. ``settings.FILTER_DIMENSIONS`` (env or built-in defaults).
    """
    global _cache, _cache_ts
    now = time.monotonic()
    if _cache is not None and (now - _cache_ts) < _CACHE_TTL_SECONDS:
        return _cache

    try:
        dims = _read_table()
        if dims:
            _cache = dims
            _cache_ts = now
            return dims
    except Exception:
        logger.warning(
            "Filter-config table unreadable — using FILTER_DIMENSIONS defaults",
            exc_info=True,
        )

    # Fallback: env/built-in defaults (do not cache failures for long).
    fallback = _default_dimensions()
    _cache = fallback
    _cache_ts = now
    return fallback


def invalidate_cache() -> None:
    """Drop the cache so the next read hits the table (e.g. after an admin edit)."""
    global _cache, _cache_ts
    _cache = None
    _cache_ts = 0.0
