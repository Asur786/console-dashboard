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
        scopes=("saved_view:read",),
        identity_provider="databricks",
    )


def test_non_owner_cannot_revoke_share_without_admin_role() -> None:
    service = EnterpriseService()
    owner = _profile("owner@example.com")
    outsider = _profile("outsider@example.com")

    service.create_share(
        owner,
        ShareCreateRequest(
            resourceId="view-123",
            resourceType="saved_view",
            sharedWithUserId="viewer@example.com",
            shareRole="viewer",
        ),
    )

    removed = service.revoke_share(outsider, "view-123", "viewer@example.com")
    assert removed is False


def test_admin_can_revoke_share_owned_by_another_user() -> None:
    service = EnterpriseService()
    owner = _profile("owner@example.com")
    admin = _profile("admin@example.com", roles=("admin",))

    service.create_share(
        owner,
        ShareCreateRequest(
            resourceId="view-123",
            resourceType="saved_view",
            sharedWithUserId="viewer@example.com",
            shareRole="viewer",
        ),
    )

    removed = service.revoke_share(admin, "view-123", "viewer@example.com")
    assert removed is True
