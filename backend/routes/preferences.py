"""
User Preference API — CRUD endpoints for saved dashboard views.

Thin controllers. All business logic lives in PreferenceService.

Endpoints (mounted under /api by app.py):
  GET    /api/preferences/views                  → list current user's views
  POST   /api/preferences/views                  → create a view
  PUT    /api/preferences/views/{view_id}        → update a view
  DELETE /api/preferences/views/{view_id}        → delete a view
  POST   /api/preferences/views/{view_id}/set-default → mark as default

User identity is taken from the X-Forwarded-Email header injected by
Databricks Apps. For local development a fallback header / default is used.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Header, Request, Response, status
from typing import Optional

from models.preference import (
    SaveViewRequest,
    UserPreferenceView,
    ViewListResponse,
)
from services.preference_service import preference_service
from services.auth_context import AccessProfile, get_access_profile
from services.access_policy import enforce_roles, enforce_scope

logger = logging.getLogger(__name__)
router = APIRouter()

# For local dev where Databricks Apps headers are absent.
_LOCAL_DEV_USER = "local-dev@example.com"


def _resolve_user_id(
    request: Request,
    x_forwarded_email: Optional[str],
) -> str:
    """
    Resolve the authenticated user's identity.

    Priority:
      1. X-Forwarded-Email header (injected by Databricks Apps)
      2. X-Forwarded-User header (fallback)
      3. Local dev default
    """
    if x_forwarded_email:
        return x_forwarded_email
    forwarded_user = request.headers.get("X-Forwarded-User")
    if forwarded_user:
        return forwarded_user
    logger.warning("No forwarded identity header — using local dev user.")
    return _LOCAL_DEV_USER


# --------------------------------------------------------------------------- #
#  GET — list                                                                 #
# --------------------------------------------------------------------------- #

@router.get(
    "/preferences/views",
    response_model=ViewListResponse,
    response_model_by_alias=True,
    summary="List the current user's saved dashboard views",
    tags=["preferences"],
)
async def list_views(
    request: Request,
    x_forwarded_email: Optional[str] = Header(default=None, alias="X-Forwarded-Email"),
    profile: AccessProfile = Depends(get_access_profile),
) -> ViewListResponse:
    enforce_roles(profile, "admin", "user")
    if profile.scopes:
        enforce_scope(profile, "saved_view:read")
    user_id = _resolve_user_id(request, x_forwarded_email)
    try:
        views = preference_service.list_views(user_id)
    except Exception as exc:
        logger.exception("Failed to list views for user %s", user_id)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return ViewListResponse(views=views)


# --------------------------------------------------------------------------- #
#  GET — dynamic schema (filters + KPIs available for the default source)      #
# --------------------------------------------------------------------------- #

@router.get(
    "/preferences/schema",
    summary="Dynamic list of filters and KPIs available for saved views",
    tags=["preferences"],
)
async def get_schema(
    profile: AccessProfile = Depends(get_access_profile),
) -> dict:
    """Return the available filters and KPIs so the UI never hardcodes them.

    KPIs are read live from the gold KPI table (fully dynamic — add a KPI row
    in Databricks and it appears here). Filters map to the dashboard's
    dimension columns.
    """
    enforce_roles(profile, "admin", "user")
    from services.databricks_service import databricks_service

    try:
        kpi_names = databricks_service.get_gold_kpi_names()
    except Exception:
        logger.exception("Failed to load dynamic KPI list from gold table")
        kpi_names = []

    kpis = [{"key": n.lower().replace(" ", "_"), "label": n} for n in kpi_names]
    from services import filter_config

    filters = [
        {"key": str(dim["key"]), "label": str(dim.get("label", dim["key"]))}
        for dim in filter_config.get_dimensions()
    ]
    return {"filters": filters, "kpis": kpis}


# --------------------------------------------------------------------------- #
#  POST — create                                                              #
# --------------------------------------------------------------------------- #

@router.post(
    "/preferences/views",
    response_model=UserPreferenceView,
    response_model_by_alias=True,
    status_code=201,
    summary="Create a new saved dashboard view",
    tags=["preferences"],
)
async def create_view(
    body: SaveViewRequest,
    request: Request,
    x_forwarded_email: Optional[str] = Header(default=None, alias="X-Forwarded-Email"),
    profile: AccessProfile = Depends(get_access_profile),
) -> UserPreferenceView:
    enforce_roles(profile, "admin", "user")
    if profile.scopes:
        enforce_scope(profile, "saved_view:write")
    user_id = _resolve_user_id(request, x_forwarded_email)
    try:
        return preference_service.create_view(user_id, body)
    except Exception as exc:
        logger.exception("Failed to create view for user %s", user_id)
        raise HTTPException(status_code=502, detail=str(exc)) from exc


# --------------------------------------------------------------------------- #
#  PUT — update                                                               #
# --------------------------------------------------------------------------- #

@router.put(
    "/preferences/views/{view_id}",
    response_model=UserPreferenceView,
    response_model_by_alias=True,
    summary="Update an existing saved view",
    tags=["preferences"],
)
async def update_view(
    view_id: str,
    body: SaveViewRequest,
    request: Request,
    x_forwarded_email: Optional[str] = Header(default=None, alias="X-Forwarded-Email"),
    profile: AccessProfile = Depends(get_access_profile),
) -> UserPreferenceView:
    enforce_roles(profile, "admin", "user")
    if profile.scopes:
        enforce_scope(profile, "saved_view:write")
    user_id = _resolve_user_id(request, x_forwarded_email)
    try:
        updated = preference_service.update_view(user_id, view_id, body)
    except Exception as exc:
        logger.exception("Failed to update view %s for user %s", view_id, user_id)
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    if updated is None:
        raise HTTPException(status_code=404, detail="View not found.")
    return updated


# --------------------------------------------------------------------------- #
#  DELETE                                                                     #
# --------------------------------------------------------------------------- #

@router.delete(
    "/preferences/views/{view_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a saved view",
    tags=["preferences"],
)
async def delete_view(
    view_id: str,
    request: Request,
    x_forwarded_email: Optional[str] = Header(default=None, alias="X-Forwarded-Email"),
    profile: AccessProfile = Depends(get_access_profile),
) -> Response:
    enforce_roles(profile, "admin", "user")
    if profile.scopes:
        enforce_scope(profile, "saved_view:write")
    user_id = _resolve_user_id(request, x_forwarded_email)
    try:
        deleted = preference_service.delete_view(user_id, view_id)
    except Exception as exc:
        logger.exception("Failed to delete view %s for user %s", view_id, user_id)
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    if not deleted:
        raise HTTPException(status_code=404, detail="View not found.")
    # 204 responses must not carry a body — return an empty Response explicitly.
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------------------------------- #
#  POST — set default                                                        #
# --------------------------------------------------------------------------- #

@router.post(
    "/preferences/views/{view_id}/set-default",
    response_model=UserPreferenceView,
    response_model_by_alias=True,
    summary="Mark a saved view as the user's default",
    tags=["preferences"],
)
async def set_default_view(
    view_id: str,
    request: Request,
    x_forwarded_email: Optional[str] = Header(default=None, alias="X-Forwarded-Email"),
    profile: AccessProfile = Depends(get_access_profile),
) -> UserPreferenceView:
    enforce_roles(profile, "admin", "user")
    if profile.scopes:
        enforce_scope(profile, "saved_view:write")
    user_id = _resolve_user_id(request, x_forwarded_email)
    try:
        updated = preference_service.set_default(user_id, view_id)
    except Exception as exc:
        logger.exception("Failed to set default view %s for user %s", view_id, user_id)
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    if updated is None:
        raise HTTPException(status_code=404, detail="View not found.")
    return updated
