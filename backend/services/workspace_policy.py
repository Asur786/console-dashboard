"""Workspace policy loader and matcher for cross-workspace access checks."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class WorkspacePolicy:
    policy_id: str
    workspace_id: str
    catalogs: tuple[str, ...]
    schemas: tuple[str, ...]


class WorkspacePolicyLoader:
    def load(self, workspace_id: str) -> WorkspacePolicy | None:
        # The policy is table-driven (managed in the workspace-policy config
        # table, with env fallback) so new workspaces can be onboarded live.
        from services import workspace_config

        policy_map = workspace_config.get_policy_map()
        row = policy_map.get(workspace_id)
        if not row:
            return None

        return WorkspacePolicy(
            policy_id=str(row.get("policy_id", "")),
            workspace_id=workspace_id,
            catalogs=tuple(str(c) for c in row.get("catalogs", [])),
            schemas=tuple(str(s) for s in row.get("schemas", [])),
        )


def policy_allows(policy: WorkspacePolicy, catalog: str, schema_name: str) -> bool:
    return catalog in set(policy.catalogs) and schema_name in set(policy.schemas)
