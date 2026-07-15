"""Pydantic models for enterprise feasibility endpoints."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field

ShareRole = Literal["viewer", "editor", "owner"]
ArtifactType = Literal[
    "test_report",
    "log_extract",
    "screenshot",
    "runbook",
    "scorecard",
]


class SourceCapability(BaseModel):
    source_id: str = Field(alias="sourceId")
    source_type: str = Field(alias="sourceType")
    is_default: bool = Field(alias="isDefault")
    is_active: bool = Field(alias="isActive")
    capabilities: list[str]

    model_config = {"populate_by_name": True}


class SourceCapabilitiesResponse(BaseModel):
    sources: list[SourceCapability]

    model_config = {"populate_by_name": True}


class WorkspaceAccessRequest(BaseModel):
    workspace_id: str = Field(alias="workspaceId")
    catalog: str
    schema_name: str = Field(alias="schema")

    model_config = {"populate_by_name": True}


class WorkspaceAccessResponse(BaseModel):
    allowed: bool
    reason: str
    policy_id: str | None = Field(alias="policyId", default=None)

    model_config = {"populate_by_name": True}


class ShareCreateRequest(BaseModel):
    resource_id: str = Field(alias="resourceId")
    resource_type: str = Field(alias="resourceType")
    shared_with_user_id: str = Field(alias="sharedWithUserId")
    share_role: ShareRole = Field(alias="shareRole")

    model_config = {"populate_by_name": True}


class ShareRecord(BaseModel):
    resource_id: str = Field(alias="resourceId")
    resource_type: str = Field(alias="resourceType")
    owner_user_id: str = Field(alias="ownerUserId")
    shared_with_user_id: str = Field(alias="sharedWithUserId")
    share_role: ShareRole = Field(alias="shareRole")
    created_at: str = Field(alias="createdAt")

    model_config = {"populate_by_name": True}


class AuthzCheckResponse(BaseModel):
    allowed: bool
    role: str
    matched_scope: str | None = Field(alias="matchedScope", default=None)
    reason: str

    model_config = {"populate_by_name": True}


class EvidenceCreateRequest(BaseModel):
    requirement_id: str = Field(alias="requirementId")
    artifact_type: ArtifactType = Field(alias="artifactType")
    artifact_path: str = Field(alias="artifactPath")
    summary: str

    model_config = {"populate_by_name": True}


class EvidenceRecord(BaseModel):
    evidence_id: str = Field(alias="evidenceId")
    requirement_id: str = Field(alias="requirementId")
    artifact_type: ArtifactType = Field(alias="artifactType")
    artifact_path: str = Field(alias="artifactPath")
    summary: str
    created_by: str = Field(alias="createdBy")
    created_at: str = Field(alias="createdAt")

    model_config = {"populate_by_name": True}


class ScorecardCriterion(BaseModel):
    name: str
    weight: int


class ScorecardTemplateResponse(BaseModel):
    criteria: list[ScorecardCriterion]
    options: list[str]


class CapabilityStatus(BaseModel):
    capability: str
    status: Literal["not_started", "in_progress", "supported", "partial", "not_supported"]
    note: str


class CapabilityStatusResponse(BaseModel):
    generated_at: str = Field(alias="generatedAt")
    items: list[CapabilityStatus]

    model_config = {"populate_by_name": True}


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()
