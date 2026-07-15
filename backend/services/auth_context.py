"""Authentication context extraction from request headers."""

from __future__ import annotations

from dataclasses import dataclass

from fastapi import Request

_LOCAL_DEV_USER = "local-dev@example.com"


@dataclass(frozen=True)
class AccessProfile:
    user_id: str
    roles: tuple[str, ...]
    scopes: tuple[str, ...]
    identity_provider: str



def _csv_header(request: Request, header_name: str) -> tuple[str, ...]:
    raw = request.headers.get(header_name, "").strip()
    if not raw:
        return tuple()
    values = [item.strip() for item in raw.split(",") if item.strip()]
    # Preserve order while removing duplicates
    return tuple(dict.fromkeys(values))


def _provider_roles_scopes(
    request: Request,
    identity_provider: str,
) -> tuple[tuple[str, ...], tuple[str, ...]]:
    provider = identity_provider.lower()

    if provider == "okta":
        return (
            _csv_header(request, "X-Okta-Groups"),
            _csv_header(request, "X-Okta-Scopes"),
        )

    if provider in {"azure", "azure_ad", "azure-ad"}:
        return (
            _csv_header(request, "X-Azure-Roles"),
            _csv_header(request, "X-Azure-Scopes"),
        )

    return tuple(), tuple()



def resolve_user_id(request: Request) -> str:
    forwarded_email = request.headers.get("X-Forwarded-Email")
    if forwarded_email:
        return forwarded_email
    forwarded_user = request.headers.get("X-Forwarded-User")
    if forwarded_user:
        return forwarded_user
    return _LOCAL_DEV_USER



def get_access_profile(request: Request) -> AccessProfile:
    user_id = resolve_user_id(request)
    identity_provider = request.headers.get("X-Identity-Provider", "databricks").strip() or "databricks"

    base_roles = _csv_header(request, "X-User-Roles")
    base_scopes = _csv_header(request, "X-User-Scopes")
    provider_roles, provider_scopes = _provider_roles_scopes(request, identity_provider)

    roles = tuple(dict.fromkeys([*base_roles, *provider_roles])) or ("user",)
    scopes = tuple(dict.fromkeys([*base_scopes, *provider_scopes]))

    return AccessProfile(
        user_id=user_id,
        roles=roles,
        scopes=scopes,
        identity_provider=identity_provider,
    )
