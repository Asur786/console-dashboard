import sys
from pathlib import Path

# Match backend runtime import behavior when tests run from repository root.
_BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from models.enterprise import ShareCreateRequest
from services.auth_context import AccessProfile
from services.enterprise_service import EnterpriseService


def _profile(user_id: str, roles: tuple[str, ...] = ("user",)) -> AccessProfile:
    return AccessProfile(
        user_id=user_id,
        roles=roles,
        scopes=("saved_view:read", "saved_view:write"),
        identity_provider="databricks",
    )


def test_create_list_revoke_share_flow() -> None:
    service = EnterpriseService()
    owner = _profile("owner@example.com")

    created = service.create_share(
        owner,
        ShareCreateRequest(
            resourceId="view-123",
            resourceType="saved_view",
            sharedWithUserId="viewer@example.com",
            shareRole="viewer",
        ),
    )
    assert created.resource_id == "view-123"

    shares = service.list_shares(owner, "view-123")
    assert len(shares) == 1

    removed = service.revoke_share(owner, "view-123", "viewer@example.com")
    assert removed is True
    assert service.list_shares(owner, "view-123") == []
