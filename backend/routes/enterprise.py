"""Enterprise feasibility API endpoints.

These endpoints are additive for the feasibility phase and do not modify
existing KPI/Insights/Preferences behavior.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status

from models.enterprise import (
    EvidenceCreateRequest,
    EvidenceRecord,
    ShareCreateRequest,
    ShareRecord,
    SourceCapabilitiesResponse,
    WorkspaceAccessRequest,
    WorkspaceAccessResponse,
    AuthzCheckResponse,
    ScorecardTemplateResponse,
    CapabilityStatusResponse,
)
from services.auth_context import AccessProfile, get_access_profile
from services.access_policy import enforce_roles
from services.enterprise_service import enterprise_service

router = APIRouter()


@router.get(
    "/enterprise/sources/capabilities",
    response_model=SourceCapabilitiesResponse,
    response_model_by_alias=True,
    tags=["enterprise"],
)
async def source_capabilities(profile: AccessProfile = Depends(get_access_profile)) -> SourceCapabilitiesResponse:
    enforce_roles(profile, "admin", "user")
    return enterprise_service.source_capabilities(profile)


@router.post(
    "/enterprise/workspaces/validate-access",
    response_model=WorkspaceAccessResponse,
    response_model_by_alias=True,
    tags=["enterprise"],
)
async def validate_workspace_access(
    body: WorkspaceAccessRequest,
    profile: AccessProfile = Depends(get_access_profile),
) -> WorkspaceAccessResponse:
    enforce_roles(profile, "admin", "user")
    return enterprise_service.validate_workspace_access(profile, body)


@router.post(
    "/enterprise/shares",
    response_model=ShareRecord,
    response_model_by_alias=True,
    status_code=201,
    tags=["enterprise"],
)
async def create_share(
    body: ShareCreateRequest,
    profile: AccessProfile = Depends(get_access_profile),
) -> ShareRecord:
    enforce_roles(profile, "admin", "user")
    return enterprise_service.create_share(profile, body)


@router.get(
    "/enterprise/shares/{resource_id}",
    response_model=list[ShareRecord],
    response_model_by_alias=True,
    tags=["enterprise"],
)
async def list_shares(
    resource_id: str,
    profile: AccessProfile = Depends(get_access_profile),
) -> list[ShareRecord]:
    enforce_roles(profile, "admin", "user")
    return enterprise_service.list_shares(profile, resource_id)


@router.delete(
    "/enterprise/shares/{resource_id}/{shared_with_user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["enterprise"],
)
async def revoke_share(
    resource_id: str,
    shared_with_user_id: str,
    profile: AccessProfile = Depends(get_access_profile),
) -> Response:
    enforce_roles(profile, "admin", "user")
    if not enterprise_service.revoke_share(profile, resource_id, shared_with_user_id):
        raise HTTPException(status_code=404, detail="Share not found or not revocable by current user")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/enterprise/authz/check",
    response_model=AuthzCheckResponse,
    response_model_by_alias=True,
    tags=["enterprise"],
)
async def check_authorization(
    action: str = Query(..., min_length=1),
    resource_type: str = Query(..., alias="resourceType", min_length=1),
    resource_id: str = Query(..., alias="resourceId", min_length=1),
    profile: AccessProfile = Depends(get_access_profile),
) -> AuthzCheckResponse:
    enforce_roles(profile, "admin", "user")
    return enterprise_service.check_authorization(
        profile,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
    )


@router.post(
    "/enterprise/evidence",
    response_model=EvidenceRecord,
    response_model_by_alias=True,
    status_code=201,
    tags=["enterprise"],
)
async def ingest_evidence(
    body: EvidenceCreateRequest,
    profile: AccessProfile = Depends(get_access_profile),
) -> EvidenceRecord:
    enforce_roles(profile, "admin", "user")
    return enterprise_service.ingest_evidence(profile, body)


@router.get(
    "/enterprise/scorecard-template",
    response_model=ScorecardTemplateResponse,
    tags=["enterprise"],
)
async def scorecard_template(profile: AccessProfile = Depends(get_access_profile)) -> ScorecardTemplateResponse:
    enforce_roles(profile, "admin", "user")
    return enterprise_service.scorecard_template()


@router.get(
    "/enterprise/capability-status",
    response_model=CapabilityStatusResponse,
    response_model_by_alias=True,
    tags=["enterprise"],
)
async def capability_status(profile: AccessProfile = Depends(get_access_profile)) -> CapabilityStatusResponse:
    enforce_roles(profile, "admin", "user")
    return enterprise_service.capability_status()
