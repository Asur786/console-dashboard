import sys
from pathlib import Path

from fastapi import Request

# Match backend runtime import behavior when tests run from repository root.
_BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from services.auth_context import get_access_profile


def _req(headers: dict[str, str]) -> Request:
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "headers": [(k.lower().encode(), v.encode()) for k, v in headers.items()],
    }
    return Request(scope)


def test_access_profile_defaults_to_local_dev_user() -> None:
    profile = get_access_profile(_req({}))
    assert profile.user_id == "local-dev@example.com"
    assert profile.roles == ("user",)


def test_access_profile_parses_roles_scopes() -> None:
    profile = get_access_profile(
        _req(
            {
                "X-Forwarded-Email": "alice@example.com",
                "X-User-Roles": "admin,user",
                "X-User-Scopes": "saved_view:write,saved_view:read",
                "X-Identity-Provider": "okta",
            }
        )
    )
    assert profile.user_id == "alice@example.com"
    assert profile.roles == ("admin", "user")
    assert profile.scopes == ("saved_view:write", "saved_view:read")
    assert profile.identity_provider == "okta"


def test_access_profile_merges_provider_specific_claims() -> None:
    profile = get_access_profile(
        _req(
            {
                "X-Forwarded-Email": "bob@example.com",
                "X-Identity-Provider": "azure_ad",
                "X-User-Roles": "user",
                "X-User-Scopes": "saved_view:read",
                "X-Azure-Roles": "admin",
                "X-Azure-Scopes": "saved_view:write",
            }
        )
    )
    assert profile.roles == ("user", "admin")
    assert profile.scopes == ("saved_view:read", "saved_view:write")
