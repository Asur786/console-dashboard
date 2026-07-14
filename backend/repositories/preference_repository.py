"""
PreferenceRepository — data-access layer for user dashboard views.

The ONLY module that knows the table name and writes SQL for preferences.
All persistence goes through the shared Databricks SQL Warehouse connection
(execute_query for reads, execute_write for writes).

Table: workspace.preferences.user_dashboard_views  (fully-qualified, since the
default connection catalog/schema is workspace.default).
"""

from __future__ import annotations

import logging
import re
from typing import Any, Optional

from config.settings import settings
from services.databricks_service import execute_query, execute_write

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
#  Table location                                                             #
# --------------------------------------------------------------------------- #

_PREF_CATALOG = getattr(settings, "PREFERENCES_CATALOG", None) or "workspace"
_PREF_SCHEMA  = getattr(settings, "PREFERENCES_SCHEMA", None) or "preferences"
_PREF_TABLE   = "user_dashboard_views"

_FULL_TABLE = f"{_PREF_CATALOG}.{_PREF_SCHEMA}.{_PREF_TABLE}"

# Only these characters are permitted inside array element values.
# The service layer validates against enums; this is a defence-in-depth guard.
_SAFE_VALUE = re.compile(r"^[A-Za-z0-9_]+$")


def _array_literal(values: list[str]) -> str:
    """
    Build a safe Spark SQL array literal, e.g. array('channel', 'category').

    Each value must match _SAFE_VALUE (alphanumeric + underscore) — this
    prevents SQL injection since array elements cannot be parameterised
    with the DBAPI driver. Returns array() for an empty list.
    """
    for v in values:
        if not _SAFE_VALUE.match(v):
            raise ValueError(f"Illegal array element value: {v!r}")
    if not values:
        return "array()"
    quoted = ", ".join(f"'{v}'" for v in values)
    return f"array({quoted})"


def _iso(value: Any) -> Optional[str]:
    """
    Render a DB timestamp as a strict ISO 8601 string (with a 'T' separator).
    Datetime values use .isoformat(); anything already a string is passed
    through unchanged. None stays None.
    """
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def _to_str_list(value: Any) -> list[str]:
    """
    Normalise a DB ARRAY<STRING> column into a plain list of strings.

    The Databricks SQL connector may return array columns as NumPy arrays,
    so we must NOT use truthiness (`value or []`) — bool() on a multi-element
    NumPy array raises "truth value of an array is ambiguous". Check for None
    explicitly instead.
    """
    if value is None:
        return []
    return [str(v) for v in value]


def _row_to_dict(row: dict[str, Any]) -> dict[str, Any]:
    """Normalise a raw DB row into a plain dict with ISO 8601 timestamp strings."""
    return {
        "view_id":             row.get("view_id"),
        "user_id":             row.get("user_id"),
        "generated_view_name": row.get("generated_view_name"),
        "visible_filters":     _to_str_list(row.get("visible_filters")),
        "visible_kpis":        _to_str_list(row.get("visible_kpis")),
        "is_default":          bool(row.get("is_default")),
        "created_at":          _iso(row.get("created_at")),
        "updated_at":          _iso(row.get("updated_at")),
    }


class PreferenceRepository:
    """CRUD operations for the user_dashboard_views table."""

    # In-process guard so ensure_table() only runs its DDL once per process,
    # even if called from multiple places (startup hook + lazy fallback).
    _schema_ready: bool = False

    # ------------------------------------------------------------------ #
    #  Schema initialisation (idempotent)                                #
    # ------------------------------------------------------------------ #

    def ensure_schema_and_table(self, force: bool = False) -> None:
        """
        Ensure the schema and Delta table exist in Unity Catalog.

        Executes CREATE SCHEMA IF NOT EXISTS and CREATE TABLE IF NOT EXISTS,
        so it is fully idempotent — repeated calls never modify or recreate an
        existing schema/table and never touch existing data.

        The DDL is guarded by an in-process flag (_schema_ready) so the
        statements run at most once per application process. Pass force=True
        to bypass the guard (e.g. in tests).

        Args:
            force: When True, re-runs the DDL even if already marked ready.

        Raises:
            Exception: Propagates any error from the Databricks SQL Warehouse
                       so the caller (startup hook) can fail fast on deploy.
        """
        if PreferenceRepository._schema_ready and not force:
            return

        logger.info(
            "User preferences initialization started (target table: %s)", _FULL_TABLE
        )

        try:
            # --- 1. Schema (idempotent) --------------------------------- #
            schema_existed = self._schema_exists()
            execute_write(
                f"CREATE SCHEMA IF NOT EXISTS {_PREF_CATALOG}.{_PREF_SCHEMA}"
            )
            if schema_existed:
                logger.info(
                    "Schema already exists: %s.%s", _PREF_CATALOG, _PREF_SCHEMA
                )
            else:
                logger.info(
                    "Schema created: %s.%s", _PREF_CATALOG, _PREF_SCHEMA
                )

            # --- 2. Table (idempotent) ---------------------------------- #
            # Schema matches the existing CRUD implementation exactly.
            table_existed = self._table_exists()
            execute_write(f"""
                CREATE TABLE IF NOT EXISTS {_FULL_TABLE} (
                  user_id              STRING     NOT NULL,
                  view_id              STRING     NOT NULL,
                  generated_view_name  STRING,
                  visible_filters      ARRAY<STRING>,
                  visible_kpis         ARRAY<STRING>,
                  is_default           BOOLEAN    NOT NULL,
                  created_at           TIMESTAMP  NOT NULL,
                  updated_at           TIMESTAMP  NOT NULL
                )
                USING DELTA
                COMMENT 'Stores per-user dashboard view preferences for the AI Console '
                        'application. Each row represents one saved view configuration '
                        '(visible filters + KPI cards). Written exclusively via the '
                        'FastAPI backend.'
                TBLPROPERTIES (
                  'layer'  = 'application',
                  'module' = 'user-preferences',
                  'delta.enableChangeDataFeed' = 'true'
                )
            """)
            if table_existed:
                logger.info("Table already exists: %s", _FULL_TABLE)
            else:
                logger.info("Table created: %s", _FULL_TABLE)

            PreferenceRepository._schema_ready = True
            logger.info("User preferences initialization completed successfully")

        except Exception:
            logger.exception(
                "User preferences initialization failed for %s", _FULL_TABLE
            )
            raise

    @staticmethod
    def _schema_exists() -> bool:
        """
        Return True if the target schema already exists in Unity Catalog.
        Uses information_schema so no data is read. Failures are treated as
        'unknown' → False, which only affects the log wording, not correctness.
        """
        try:
            rows = execute_query(
                """
                SELECT 1 AS present
                FROM information_schema.schemata
                WHERE catalog_name = %(cat)s
                  AND schema_name  = %(sch)s
                LIMIT 1
                """,
                {"cat": _PREF_CATALOG, "sch": _PREF_SCHEMA},
            )
            return bool(rows)
        except Exception:
            logger.debug(
                "Could not determine prior existence of schema %s.%s",
                _PREF_CATALOG, _PREF_SCHEMA,
            )
            return False

    @staticmethod
    def _table_exists() -> bool:
        """
        Return True if the target table already exists in Unity Catalog.
        Uses information_schema so no data is read. Failures are treated as
        'unknown' → False, which only affects the log message, not correctness.
        """
        try:
            rows = execute_query(
                """
                SELECT 1 AS present
                FROM information_schema.tables
                WHERE table_catalog = %(cat)s
                  AND table_schema  = %(sch)s
                  AND table_name    = %(tbl)s
                LIMIT 1
                """,
                {"cat": _PREF_CATALOG, "sch": _PREF_SCHEMA, "tbl": _PREF_TABLE},
            )
            return bool(rows)
        except Exception:
            # Non-fatal — only used to choose the log wording
            logger.debug("Could not determine prior existence of %s", _FULL_TABLE)
            return False

    # ------------------------------------------------------------------ #
    #  Read                                                               #
    # ------------------------------------------------------------------ #

    def list_by_user(self, user_id: str) -> list[dict[str, Any]]:
        """Return all views owned by a user, newest first."""
        sql = f"""
            SELECT view_id, user_id, generated_view_name,
                   visible_filters, visible_kpis, is_default,
                   created_at, updated_at
            FROM {_FULL_TABLE}
            WHERE user_id = %(user_id)s
            ORDER BY is_default DESC, updated_at DESC
        """
        rows = execute_query(sql, {"user_id": user_id})
        return [_row_to_dict(r) for r in rows]

    def get_by_id(self, user_id: str, view_id: str) -> Optional[dict[str, Any]]:
        """Return a single view scoped to the owning user, or None."""
        sql = f"""
            SELECT view_id, user_id, generated_view_name,
                   visible_filters, visible_kpis, is_default,
                   created_at, updated_at
            FROM {_FULL_TABLE}
            WHERE user_id = %(user_id)s AND view_id = %(view_id)s
            LIMIT 1
        """
        rows = execute_query(sql, {"user_id": user_id, "view_id": view_id})
        return _row_to_dict(rows[0]) if rows else None

    # ------------------------------------------------------------------ #
    #  Write                                                              #
    # ------------------------------------------------------------------ #

    def insert(
        self,
        *,
        user_id: str,
        view_id: str,
        view_name: str,
        visible_filters: list[str],
        visible_kpis: list[str],
        is_default: bool,
    ) -> None:
        """Insert a new view row. Timestamps are set to current_timestamp()."""
        filters_arr = _array_literal(visible_filters)
        kpis_arr    = _array_literal(visible_kpis)

        sql = f"""
            INSERT INTO {_FULL_TABLE}
                (user_id, view_id, generated_view_name,
                 visible_filters, visible_kpis, is_default,
                 created_at, updated_at)
            VALUES
                (%(user_id)s, %(view_id)s, %(view_name)s,
                 {filters_arr}, {kpis_arr}, %(is_default)s,
                 current_timestamp(), current_timestamp())
        """
        execute_write(sql, {
            "user_id":    user_id,
            "view_id":    view_id,
            "view_name":  view_name,
            "is_default": is_default,
        })

    def update(
        self,
        *,
        user_id: str,
        view_id: str,
        view_name: str,
        visible_filters: list[str],
        visible_kpis: list[str],
        is_default: bool,
    ) -> None:
        """Update an existing view. updated_at is refreshed to now."""
        filters_arr = _array_literal(visible_filters)
        kpis_arr    = _array_literal(visible_kpis)

        sql = f"""
            UPDATE {_FULL_TABLE}
            SET generated_view_name = %(view_name)s,
                visible_filters     = {filters_arr},
                visible_kpis        = {kpis_arr},
                is_default          = %(is_default)s,
                updated_at          = current_timestamp()
            WHERE user_id = %(user_id)s AND view_id = %(view_id)s
        """
        execute_write(sql, {
            "user_id":    user_id,
            "view_id":    view_id,
            "view_name":  view_name,
            "is_default": is_default,
        })

    def delete(self, user_id: str, view_id: str) -> None:
        """Delete a view scoped to the owning user."""
        sql = f"""
            DELETE FROM {_FULL_TABLE}
            WHERE user_id = %(user_id)s AND view_id = %(view_id)s
        """
        execute_write(sql, {"user_id": user_id, "view_id": view_id})

    def clear_default_for_user(self, user_id: str) -> None:
        """
        Unset is_default on every view for a user. Called before marking a
        new default so at most one default exists per user.
        """
        sql = f"""
            UPDATE {_FULL_TABLE}
            SET is_default = false, updated_at = current_timestamp()
            WHERE user_id = %(user_id)s AND is_default = true
        """
        execute_write(sql, {"user_id": user_id})


# Module-level singleton
preference_repository = PreferenceRepository()
