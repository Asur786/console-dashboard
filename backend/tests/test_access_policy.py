import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

# Match backend runtime import behavior when tests run from repository root.
_BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from services.access_policy import enforce_roles, enforce_scope, has_role, has_scope
from services.auth_context import AccessProfile


def _profile() -> AccessProfile:
    return AccessProfile(
        user_id="alice@example.com",
        roles=("user",),
        scopes=("saved_view:read",),
        identity_provider="databricks",
    )


def test_has_role_and_scope() -> None:
    profile = _profile()
    assert has_role(profile, "user")
    assert not has_role(profile, "admin")
    assert has_scope(profile, "saved_view:read")
    assert not has_scope(profile, "saved_view:write")


def test_enforce_role_raises_for_missing_role() -> None:
    profile = _profile()
    with pytest.raises(HTTPException):
        enforce_roles(profile, "admin")


def test_enforce_scope_raises_for_missing_scope() -> None:
    profile = _profile()
    with pytest.raises(HTTPException):
        enforce_scope(profile, "saved_view:write")
