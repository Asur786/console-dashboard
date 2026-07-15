"""Structured audit logging helpers for enterprise feasibility flows."""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


def log_access_decision(
    *,
    user_id: str,
    action: str,
    resource_type: str,
    resource_id: str,
    allowed: bool,
    reason: str,
) -> None:
    logger.info(
        "access_decision user=%s action=%s resource_type=%s resource_id=%s allowed=%s reason=%s",
        user_id,
        action,
        resource_type,
        resource_id,
        allowed,
        reason,
    )


def log_source_decision(
    *,
    user_id: str,
    source_id: str,
    workspace_id: str | None,
    allowed: bool,
    reason: str,
) -> None:
    logger.info(
        "source_decision user=%s source=%s workspace=%s allowed=%s reason=%s",
        user_id,
        source_id,
        workspace_id or "n/a",
        allowed,
        reason,
    )


def log_workspace_access(
    *,
    user_id: str,
    workspace_id: str,
    catalog: str,
    schema_name: str,
    allowed: bool,
    reason: str,
    policy_id: str | None,
) -> None:
    logger.info(
        "workspace_access user=%s workspace=%s catalog=%s schema=%s allowed=%s reason=%s policy_id=%s",
        user_id,
        workspace_id,
        catalog,
        schema_name,
        allowed,
        reason,
        policy_id or "n/a",
    )
