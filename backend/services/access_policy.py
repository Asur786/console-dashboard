"""Authorization policy helpers for role/scope decisions."""

from __future__ import annotations

from fastapi import HTTPException

from services.auth_context import AccessProfile



def has_role(profile: AccessProfile, *required_roles: str) -> bool:
    if not required_roles:
        return True
    role_set = set(profile.roles)
    return any(role in role_set for role in required_roles)



def has_scope(profile: AccessProfile, required_scope: str) -> bool:
    return required_scope in set(profile.scopes)



def enforce_roles(profile: AccessProfile, *required_roles: str) -> None:
    if has_role(profile, *required_roles):
        return
    raise HTTPException(
        status_code=403,
        detail={
            "reason": "insufficient_role",
            "required_roles": list(required_roles),
            "granted_roles": list(profile.roles),
        },
    )



def enforce_scope(profile: AccessProfile, required_scope: str) -> None:
    if has_scope(profile, required_scope):
        return
    raise HTTPException(
        status_code=403,
        detail={
            "reason": "insufficient_scope",
            "required_scope": required_scope,
            "granted_scopes": list(profile.scopes),
        },
    )
