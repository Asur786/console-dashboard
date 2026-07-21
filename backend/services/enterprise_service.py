"""Enterprise feasibility service layer.

This module intentionally uses in-memory stores for POC feasibility checks.
It does not replace the existing production baseline paths.
"""

from __future__ import annotations

import uuid

from models.enterprise import (
    AuthzCheckResponse,
    CapabilityStatus,
    CapabilityStatusResponse,
    EvidenceCreateRequest,
    EvidenceRecord,
    ScorecardCriterion,
    ScorecardTemplateResponse,
    ShareCreateRequest,
    ShareRecord,
    SourceCapabilitiesResponse,
    SourceCapability,
    WorkspaceAccessRequest,
    WorkspaceAccessResponse,
    utc_now_iso,
)
from services.access_policy import has_role, has_scope
from services.audit_log import (
    log_access_decision,
    log_source_decision,
    log_workspace_access,
)
from services.auth_context import AccessProfile
from config.settings import settings
from fastapi import HTTPException

from services.data_source_registry import DataSourceRegistry
from services.sources.databricks_source import DatabricksSourceAdapter
from services.sources.secondary_databricks_source import SecondaryDatabricksSource
from services.workspace_policy import WorkspacePolicyLoader, policy_allows


class EnterpriseService:
    def __init__(self) -> None:
        self._shares: dict[tuple[str, str], ShareRecord] = {}
        self._evidence: list[EvidenceRecord] = []
        self._workspace_policy_loader = WorkspacePolicyLoader()

    @staticmethod
    def _source_registry() -> DataSourceRegistry:
        sources: list[object] = [DatabricksSourceAdapter()]
        if settings.ENTERPRISE_ENABLE_SECONDARY_SOURCE:
            sources.append(SecondaryDatabricksSource())
        return DataSourceRegistry(sources=sources)

    def source_capabilities(self, profile: AccessProfile) -> SourceCapabilitiesResponse:
        # Only advertise sources the current identity can actually read, so the
        # UI never offers a data source that would fail with a permission error.
        items: list[SourceCapability] = []
        for source in self._source_registry().sources():
            probe = getattr(source, "is_accessible", None)
            if callable(probe) and not probe():
                continue
            items.append(
                SourceCapability(
                    sourceId=source.source_id,
                    sourceType=source.source_type,
                    isDefault=source.is_default,
                    isActive=source.is_active,
                    capabilities=list(source.capabilities),
                )
            )

        log_source_decision(
            user_id=profile.user_id,
            source_id=items[0].source_id if items else "none",
            workspace_id=None,
            allowed=bool(items),
            reason="capability_list",
        )
        return SourceCapabilitiesResponse(sources=items)

    def source_kpis(self, profile: AccessProfile, source_id: str) -> dict[str, object]:
        """Return live KPIs for a specific registered source (POC 1)."""
        if source_id in ("databricks-default", "workspace", "source-a"):
            from models.kpis import KpiFilters
            from services.kpi_service import get_kpis

            response = get_kpis(KpiFilters())
            kpis = [{"name": item.label, "value": item.value} for item in response.kpis]
            log_source_decision(
                user_id=profile.user_id,
                source_id="databricks-default",
                workspace_id=None,
                allowed=True,
                reason="source_kpis",
            )
            return {"sourceId": "databricks-default", "kpis": kpis}

        source = self._source_registry().get(source_id)
        if source is None or not hasattr(source, "fetch_kpis"):
            raise HTTPException(status_code=404, detail=f"Unknown source: {source_id}")

        kpis = source.fetch_kpis()
        log_source_decision(
            user_id=profile.user_id,
            source_id=source_id,
            workspace_id=None,
            allowed=True,
            reason="source_kpis",
        )
        return {"sourceId": source_id, "kpis": kpis}

    def source_filters(self, profile: AccessProfile, source_id: str) -> dict[str, object]:
        """Return the available filter dimensions for a specific source (POC 1)."""
        if source_id in ("databricks-default", "workspace", "source-a"):
            return {
                "sourceId": "databricks-default",
                "filters": ["Channel", "Category", "Retailer", "Country"],
            }

        source = self._source_registry().get(source_id)
        if source is None or not hasattr(source, "fetch_filters"):
            raise HTTPException(status_code=404, detail=f"Unknown source: {source_id}")

        return {"sourceId": source_id, "filters": source.fetch_filters()}

    def validate_workspace_access(
        self,
        profile: AccessProfile,
        request: WorkspaceAccessRequest,
    ) -> WorkspaceAccessResponse:
        policy = self._workspace_policy_loader.load(request.workspace_id)
        if not policy:
            log_source_decision(
                user_id=profile.user_id,
                source_id="databricks-default",
                workspace_id=request.workspace_id,
                allowed=False,
                reason="workspace_not_allowlisted",
            )
            log_workspace_access(
                user_id=profile.user_id,
                workspace_id=request.workspace_id,
                catalog=request.catalog,
                schema_name=request.schema_name,
                allowed=False,
                reason="workspace_not_allowlisted",
                policy_id=None,
            )
            return WorkspaceAccessResponse(allowed=False, reason="workspace_not_allowlisted", policyId=None)

        if not policy_allows(policy, request.catalog, request.schema_name):
            log_source_decision(
                user_id=profile.user_id,
                source_id="databricks-default",
                workspace_id=request.workspace_id,
                allowed=False,
                reason="catalog_or_schema_not_allowed",
            )
            log_workspace_access(
                user_id=profile.user_id,
                workspace_id=request.workspace_id,
                catalog=request.catalog,
                schema_name=request.schema_name,
                allowed=False,
                reason="catalog_or_schema_not_allowed",
                policy_id=policy.policy_id,
            )
            return WorkspaceAccessResponse(allowed=False, reason="catalog_or_schema_not_allowed", policyId=policy.policy_id)

        log_source_decision(
            user_id=profile.user_id,
            source_id="databricks-default",
            workspace_id=request.workspace_id,
            allowed=True,
            reason="policy_match",
        )
        log_workspace_access(
            user_id=profile.user_id,
            workspace_id=request.workspace_id,
            catalog=request.catalog,
            schema_name=request.schema_name,
            allowed=True,
            reason="policy_match",
            policy_id=policy.policy_id,
        )
        return WorkspaceAccessResponse(allowed=True, reason="policy_match", policyId=policy.policy_id)

    def create_share(self, profile: AccessProfile, body: ShareCreateRequest) -> ShareRecord:
        key = (body.resource_id, body.shared_with_user_id)
        record = ShareRecord(
            resourceId=body.resource_id,
            resourceType=body.resource_type,
            ownerUserId=profile.user_id,
            sharedWithUserId=body.shared_with_user_id,
            shareRole=body.share_role,
            createdAt=utc_now_iso(),
        )
        self._shares[key] = record
        return record

    def list_shares(self, profile: AccessProfile, resource_id: str) -> list[ShareRecord]:
        return [
            share
            for (rid, _), share in self._shares.items()
            if rid == resource_id and (share.owner_user_id == profile.user_id or has_role(profile, "admin"))
        ]

    def revoke_share(self, profile: AccessProfile, resource_id: str, shared_with_user_id: str) -> bool:
        key = (resource_id, shared_with_user_id)
        record = self._shares.get(key)
        if not record:
            return False
        if record.owner_user_id != profile.user_id and not has_role(profile, "admin"):
            return False
        del self._shares[key]
        return True

    def check_authorization(
        self,
        profile: AccessProfile,
        *,
        action: str,
        resource_type: str,
        resource_id: str,
    ) -> AuthzCheckResponse:
        if has_role(profile, "admin"):
            allowed = True
            reason = "admin_role"
            matched_scope = "*"
        else:
            needed_scope = f"{resource_type}:{action}"
            allowed = has_scope(profile, needed_scope)
            reason = "scope_match" if allowed else "insufficient_scope"
            matched_scope = needed_scope if allowed else None

        log_access_decision(
            user_id=profile.user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            allowed=allowed,
            reason=reason,
        )

        return AuthzCheckResponse(
            allowed=allowed,
            role=profile.roles[0] if profile.roles else "user",
            matchedScope=matched_scope,
            reason=reason,
        )

    def ingest_evidence(self, profile: AccessProfile, body: EvidenceCreateRequest) -> EvidenceRecord:
        record = EvidenceRecord(
            evidenceId=f"ev-{uuid.uuid4().hex[:10]}",
            requirementId=body.requirement_id,
            artifactType=body.artifact_type,
            artifactPath=body.artifact_path,
            summary=body.summary,
            createdBy=profile.user_id,
            createdAt=utc_now_iso(),
        )
        self._evidence.append(record)
        return record

    @staticmethod
    def scorecard_template() -> ScorecardTemplateResponse:
        return ScorecardTemplateResponse(
            criteria=[
                ScorecardCriterion(name="Data/AI-native velocity", weight=20),
                ScorecardCriterion(name="Enterprise identity/RBAC fit", weight=20),
                ScorecardCriterion(name="External integration flexibility", weight=15),
                ScorecardCriterion(name="Operational overhead", weight=15),
                ScorecardCriterion(name="Governance and auditability", weight=15),
                ScorecardCriterion(name="Time-to-market from current baseline", weight=15),
            ],
            options=["databricks-only", "azure-only", "hybrid"],
        )

    @staticmethod
    def capability_status() -> CapabilityStatusResponse:
        return CapabilityStatusResponse(
            generatedAt=utc_now_iso(),
            items=[
                CapabilityStatus(capability="multi_source", status="in_progress", note="Adapter scaffold in progress"),
                CapabilityStatus(capability="cross_workspace", status="in_progress", note="Policy validation endpoint available"),
                CapabilityStatus(capability="sharing", status="in_progress", note="Share/revoke API scaffold available"),
                CapabilityStatus(capability="rbac", status="in_progress", note="Role and scope check API scaffold available"),
            ],
        )


enterprise_service = EnterpriseService()
