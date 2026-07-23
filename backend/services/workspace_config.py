"""
Workspace-policy configuration — the manageable, table-driven allowlist of
workspaces (and the catalogs/schemas each may access).

The policy lives in a Delta table in the gold schema
(``{GOLD_CATALOG}.{GOLD_SCHEMA}.{GOLD_WORKSPACE_POLICY_TABLE}``). Admins onboard
a brand-new workspace by inserting rows — no code, env change or redeploy
required. The backend reads the table live (cached briefly) and falls back to
``settings.ENTERPRISE_WORKSPACE_POLICY`` (env/default) when the table is missing,
empty, or unreachable, so access checks always work.

This is the same "Option 2" table-driven dynamism used for filters and data
sources — here it is what lets *future separate workspaces* come online without
touching the app.

Table shape (one row per workspace + catalog + schema it may access):
  workspace_id STRING, policy_id STRING, catalog STRING, schema STRING, enabled BOOLEAN

The rows are folded back into the same nested dict shape the rest of the code
already expects:
  { workspace_id: {policy_id, catalogs: [...], schemas: [...]} }
"""

from __future__ import annotations

import logging
import time
from typing import Any

from config.settings import settings

# The config table is app infrastructure (like the preferences/filter/source
# tables): always accessed with the app identity, never the per-user token.
from services.databricks_service import (
    execute_query as _execute_query,
    execute_write as _execute_write,
)

logger = logging.getLogger(__name__)


def _full_table() -> str:
    return (
        f"{settings.GOLD_CATALOG}.{settings.GOLD_SCHEMA}."
        f"{settings.GOLD_WORKSPACE_POLICY_TABLE}"
    )


def _execute_query_app(sql: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    return _execute_query(sql, params, as_app=True)


def _execute_write_app(sql: str, params: dict[str, Any] | None = None) -> None:
    _execute_write(sql, params, as_app=True)


# --------------------------------------------------------------------------- #
#  In-process cache (short TTL so edits show up without a restart)            #
# --------------------------------------------------------------------------- #
_CACHE_TTL_SECONDS = 30.0
_cache: dict[str, dict[str, Any]] | None = None
_cache_ts: float = 0.0
_table_ready: bool = False


def _default_policy() -> dict[str, dict[str, Any]]:
    """The env/built-in fallback policy map."""
    return {k: dict(v) for k, v in settings.ENTERPRISE_WORKSPACE_POLICY.items()}


def _seed_rows() -> list[dict[str, str]]:
    """Flatten the default nested policy map into one row per (workspace, catalog, schema)."""
    rows: list[dict[str, str]] = []
    for workspace_id, cfg in _default_policy().items():
        policy_id = str(cfg.get("policy_id", ""))
        catalogs = [str(c) for c in cfg.get("catalogs", [])] or [""]
        schemas = [str(s) for s in cfg.get("schemas", [])] or [""]
        for catalog in catalogs:
            for schema in schemas:
                rows.append(
                    {
                        "workspace_id": workspace_id,
                        "policy_id": policy_id,
                        "catalog": catalog,
                        "schema": schema,
                    }
                )
    return rows


def ensure_table(force: bool = False) -> None:
    """Create the workspace-policy table if absent and seed it with the defaults.

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
              workspace_id STRING  NOT NULL,
              policy_id    STRING,
              catalog      STRING  NOT NULL,
              schema       STRING  NOT NULL,
              enabled      BOOLEAN
            )
            USING DELTA
            COMMENT 'Manageable workspace allowlist. One row per workspace + '
                    'catalog + schema it may access — read live by the app to '
                    'onboard new workspaces without a redeploy.'
            TBLPROPERTIES ('layer' = 'application', 'module' = 'workspace-policy')
            """
        )

        # Seed with the defaults only when the table is empty, so admin edits
        # are never overwritten on restart.
        rows = _execute_query_app(f"SELECT COUNT(*) AS n FROM {table}")
        count = int(rows[0]["n"]) if rows else 0
        if count == 0:
            seed = _seed_rows()
            for r in seed:
                _execute_write_app(
                    f"""
                    INSERT INTO {table}
                      (workspace_id, policy_id, catalog, schema, enabled)
                    VALUES
                      (%(workspace_id)s, %(policy_id)s, %(catalog)s, %(schema)s, true)
                    """,
                    r,
                )
            logger.info(
                "Seeded workspace-policy table %s with %d rows", table, len(seed)
            )

        _table_ready = True
        logger.info("Workspace-policy table ready: %s", table)
    except Exception:
        logger.exception(
            "Workspace-policy table init failed (%s) — falling back to defaults", table
        )


def _read_table() -> dict[str, dict[str, Any]]:
    """Read the enabled policy rows and fold them into the nested dict shape."""
    table = _full_table()
    rows = _execute_query_app(
        f"""
        SELECT workspace_id, policy_id, catalog, schema
        FROM {table}
        WHERE enabled = true OR enabled IS NULL
        """
    )
    policy: dict[str, dict[str, Any]] = {}
    for r in rows:
        workspace_id = str(r.get("workspace_id") or "").strip()
        if not workspace_id:
            continue
        entry = policy.setdefault(
            workspace_id,
            {"policy_id": str(r.get("policy_id") or ""), "catalogs": [], "schemas": []},
        )
        catalog = str(r.get("catalog") or "").strip()
        schema = str(r.get("schema") or "").strip()
        if catalog and catalog not in entry["catalogs"]:
            entry["catalogs"].append(catalog)
        if schema and schema not in entry["schemas"]:
            entry["schemas"].append(schema)
    return policy


def get_policy_map() -> dict[str, dict[str, Any]]:
    """Return the current workspace policy map (table-driven, cached, with fallback).

    Order of preference:
      1. Rows from the config table (if it has any enabled rows).
      2. ``settings.ENTERPRISE_WORKSPACE_POLICY`` (env or built-in defaults).
    """
    global _cache, _cache_ts
    now = time.monotonic()
    if _cache is not None and (now - _cache_ts) < _CACHE_TTL_SECONDS:
        return _cache

    try:
        policy = _read_table()
        if policy:
            _cache = policy
            _cache_ts = now
            return policy
    except Exception:
        logger.warning(
            "Workspace-policy table unreadable — using ENTERPRISE_WORKSPACE_POLICY defaults",
            exc_info=True,
        )

    # Fallback: env/built-in defaults (do not cache failures for long).
    fallback = _default_policy()
    _cache = fallback
    _cache_ts = now
    return fallback


def invalidate_cache() -> None:
    """Drop the cache so the next read hits the table (e.g. after an admin edit)."""
    global _cache, _cache_ts
    _cache = None
    _cache_ts = 0.0
