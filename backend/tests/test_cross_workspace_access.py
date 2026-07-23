import sys
from pathlib import Path

# Match backend runtime import behavior when tests run from repository root.
_BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from models.enterprise import WorkspaceAccessRequest
from services.auth_context import AccessProfile
from services.enterprise_service import enterprise_service
from services import workspace_config


def _profile() -> AccessProfile:
    return AccessProfile(
        user_id="user@example.com",
        roles=("user",),
        scopes=("workspace:read",),
        identity_provider="databricks",
    )


# The workspace policy is table-driven (with env fallback); patch the resolved
# policy map directly so these tests exercise the access-decision logic
# deterministically, independent of any live config table.
_POLICY = {
    "workspace-a": {
        "policy_id": "policy-001",
        "catalogs": ["workspace"],
        "schemas": ["default"],
    }
}


def test_workspace_access_allows_when_policy_matches(monkeypatch) -> None:
    monkeypatch.setattr(workspace_config, "get_policy_map", lambda: _POLICY)

    result = enterprise_service.validate_workspace_access(
        _profile(),
        WorkspaceAccessRequest(workspaceId="workspace-a", catalog="workspace", schema="default"),
    )

    assert result.allowed is True
    assert result.reason == "policy_match"
    assert result.policy_id == "policy-001"


def test_workspace_access_denies_when_workspace_not_allowlisted(monkeypatch) -> None:
    monkeypatch.setattr(workspace_config, "get_policy_map", lambda: _POLICY)

    result = enterprise_service.validate_workspace_access(
        _profile(),
        WorkspaceAccessRequest(workspaceId="workspace-b", catalog="workspace", schema="default"),
    )

    assert result.allowed is False
    assert result.reason == "workspace_not_allowlisted"
