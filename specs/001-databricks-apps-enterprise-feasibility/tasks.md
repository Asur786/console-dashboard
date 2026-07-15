# Tasks: Databricks Apps Enterprise Feasibility for AI for BI Console

**Input**: Design documents from `/specs/001-databricks-apps-enterprise-feasibility/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/enterprise-feasibility-contract.md`, `quickstart.md`

**Tests**: Required for behavior-changing work per constitution.

**Organization**: Tasks are grouped by user story and 4 execution tracks.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1/US2/US3/US4/US5 mapping to spec

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Create enterprise feasibility route module skeleton in `backend/routes/enterprise.py`
- [X] T002 Create enterprise model module skeleton in `backend/models/enterprise.py`
- [X] T003 Create enterprise service module skeleton in `backend/services/enterprise_service.py`
- [X] T004 [P] Add enterprise frontend service skeleton in `src/services/enterprise.service.ts`
- [X] T005 [P] Add enterprise types in `src/types/enterprise.types.ts`
- [X] T006 Add route registration for enterprise APIs in `backend/app.py`
- [X] T007 [P] Add evidence docs directory with placeholders in `specs/001-databricks-apps-enterprise-feasibility/evidence/`

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T008 Implement auth context extraction and normalized access profile in `backend/services/auth_context.py`
- [X] T009 Implement centralized RBAC guard utility in `backend/services/access_policy.py`
- [X] T010 Implement structured audit logger helper for access and source decisions in `backend/services/audit_log.py`
- [X] T011 [P] Add backend unit tests for auth context parsing in `backend/tests/test_auth_context.py`
- [X] T012 [P] Add backend unit tests for RBAC guard decisions in `backend/tests/test_access_policy.py`
- [X] T013 Add baseline regression smoke for KPI/Insights/Preferences paths in `backend/tests/test_baseline_regression.py`
- [X] T014 Add frontend contract type exports in `src/types/index.ts`
- [X] T015 Define feature flags/config for enterprise tracks in `backend/config/settings.py`

**Checkpoint**: Foundation ready; no baseline regressions.

## Phase 3: User Story 1 (P1) Decision-Ready Platform Assessment

### Tests (write first)
- [X] T016 [P] [US1] Add decision scorecard schema validation test in `backend/tests/test_decision_scorecard_schema.py`
- [X] T017 [P] [US1] Add evidence matrix completeness test in `backend/tests/test_evidence_matrix.py`

### Implementation
- [X] T018 [US1] Implement scorecard response model and serializer in `backend/models/enterprise.py`
- [X] T019 [US1] Implement scorecard generation endpoint `GET /api/enterprise/scorecard-template` in `backend/routes/enterprise.py`
- [X] T020 [US1] Implement capability assessment endpoint `GET /api/enterprise/capability-status` in `backend/routes/enterprise.py`
- [X] T021 [US1] Populate initial evidence matrix file `specs/001-databricks-apps-enterprise-feasibility/evidence/decision-scorecard.md`
- [X] T022 [US1] Update stakeholder summary with fit/gap snapshot in `specs/001-databricks-apps-enterprise-feasibility/stakeholder-explanation.md`

**Checkpoint**: Decision matrix and scorecard template available with evidence mapping.

## Phase 4: User Story 2 (P1) Enterprise Integration Feasibility

### Tests (write first)
- [X] T023 [P] [US2] Add source adapter contract tests in `backend/tests/test_source_adapters.py`
- [X] T024 [P] [US2] Add cross-workspace allow/deny tests in `backend/tests/test_cross_workspace_access.py`
- [X] T025 [P] [US2] Add external integration resilience test (timeout/fallback) in `backend/tests/test_external_integration_resilience.py`

### Implementation Track 1: Multiple Data Source Support
- [X] T026 [US2] Implement source adapter interface and registry in `backend/services/data_source_registry.py`
- [X] T027 [US2] Implement Databricks source adapter wrapper in `backend/services/sources/databricks_source.py`
- [X] T028 [US2] Implement one external/mock source adapter in `backend/services/sources/external_mock_source.py`
- [X] T029 [US2] Add source capability endpoint `GET /api/enterprise/sources/capabilities` in `backend/routes/enterprise.py`

### Implementation Track 2: Cross-Workspace Data Access
- [X] T030 [US2] Implement workspace policy model and loader in `backend/services/workspace_policy.py`
- [X] T031 [US2] Implement workspace access validation endpoint `POST /api/enterprise/workspaces/validate-access` in `backend/routes/enterprise.py`
- [X] T032 [US2] Add workspace audit events in `backend/services/audit_log.py`

### Integration
- [X] T033 [US2] Wire enterprise service orchestration for tracks 1 and 2 in `backend/services/enterprise_service.py`
- [X] T034 [US2] Add frontend client methods for source/workspace checks in `src/services/enterprise.service.ts`

**Checkpoint**: Multi-source and cross-workspace scenarios validated with test evidence.

## Phase 5: User Story 3 (P2) Application Access and Sharing

### Tests (write first)
- [X] T035 [P] [US3] Add sharing API tests for create/revoke/list in `backend/tests/test_sharing_api.py`
- [X] T036 [P] [US3] Add permission propagation tests for owner/editor/viewer in `backend/tests/test_sharing_permissions.py`

### Implementation Track 3: Application Access and Sharing
- [X] T037 [US3] Implement sharing models in `backend/models/enterprise.py`
- [X] T038 [US3] Implement sharing endpoints in `backend/routes/enterprise.py`
- [X] T039 [US3] Implement sharing logic and ownership checks in `backend/services/enterprise_service.py`
- [X] T040 [US3] Add frontend sharing API integration in `src/services/enterprise.service.ts`
- [X] T041 [US3] Add minimal sharing controls in Preferences UI in `src/pages/Preferences/PreferencesPage.tsx`

**Checkpoint**: Resource sharing workflow works with enforced role semantics.

## Phase 6: User Story 2 (P1) User Access Management with RBAC

### Tests (write first)
- [X] T042 [P] [US2] Add protected endpoint authorization tests in `backend/tests/test_rbac_route_protection.py`
- [X] T043 [P] [US2] Add frontend role-guard behavior tests in `src/pages/Preferences/PreferencesPage.test.tsx`

### Implementation Track 4: User Access Management
- [X] T044 [US2] Apply RBAC guard dependency to enterprise endpoints in `backend/routes/enterprise.py`
- [X] T045 [US2] Add RBAC checks for privileged preference operations in `backend/routes/preferences.py`
- [X] T046 [US2] Expose authorization-check endpoint `GET /api/enterprise/authz/check` in `backend/routes/enterprise.py`
- [X] T047 [US2] Add frontend authorization helper and hook in `src/hooks/useAuthorization.ts`
- [X] T048 [US2] Enforce role-aware UI actions in `src/pages/Preferences/PreferencesPage.tsx`
- [X] T049 [US2] Add provider-specific identity claim mapping spike (Okta/Azure AD) in `backend/services/auth_context.py`
- [X] T050 [US2] Document identity integration limitations in `specs/001-databricks-apps-enterprise-feasibility/evidence/identity-limitations.md`
- [X] T051 [US2] Add architecture decision record for API-first module boundary and persistence split in `specs/001-databricks-apps-enterprise-feasibility/evidence/api-first-decision.md`
- [X] T052 [US2] Add contract compatibility/versioning decision note in `specs/001-databricks-apps-enterprise-feasibility/evidence/api-contract-compatibility.md`
- [X] T053 [US2] Implement evidence ingestion endpoint `POST /api/enterprise/evidence` in `backend/routes/enterprise.py`
- [X] T054 [US2] Add evidence ingestion service/model support in `backend/services/enterprise_service.py` and `backend/models/enterprise.py`
- [X] T055 [P] [US2] Add contract test for `POST /api/enterprise/evidence` in `backend/tests/test_enterprise_evidence_api.py`

**Checkpoint**: Admin/user/scoped RBAC behavior enforced and auditable.

## Phase 7: User Story 5 (P3) Comparative Strategy Notes

- [X] T056 [US5] Produce Databricks AI/BI vs Power BI comparison memo in `specs/001-databricks-apps-enterprise-feasibility/evidence/platform-comparison.md`
- [X] T057 [US5] Produce Databricks One implication memo in `specs/001-databricks-apps-enterprise-feasibility/evidence/databricks-one-notes.md`
- [X] T058 [US5] Complete weighted architecture scorecard in `specs/001-databricks-apps-enterprise-feasibility/evidence/decision-scorecard.md`

## Phase 8: User Story 4 (P2) Operational Readiness for Production

- [X] T059 [US4] Run and fix quality gate checks (`lint`, `build`, `test:frontend`, `test:backend`) using `.github/workflows/quality-gates.yml`
- [X] T060 [US4] Add load/performance test execution and report in `specs/001-databricks-apps-enterprise-feasibility/evidence/performance-load.md`
- [X] T061 [US4] Add observability validation artifact (health, logs, alerts baseline) in `specs/001-databricks-apps-enterprise-feasibility/evidence/observability.md`
- [X] T062 [US4] Draft operational lifecycle/runbook in `specs/001-databricks-apps-enterprise-feasibility/evidence/runbook.md`
- [X] T063 [US4] Run dependency-failure drill and capture graceful degradation evidence in `specs/001-databricks-apps-enterprise-feasibility/evidence/failure-drill.md`
- [X] T064 [US4] Add quickstart evidence links and run results in `specs/001-databricks-apps-enterprise-feasibility/quickstart.md`
- [X] T065 [US4] Finalize capability status table and risk closure in `specs/001-databricks-apps-enterprise-feasibility/evidence/capability-status.md`

## Phase 9: Finalization and Governance Closure

- [X] T066 Add explicit non-goals section and scope guard update in `specs/001-databricks-apps-enterprise-feasibility/stakeholder-explanation.md`
- [X] T067 Add architecture recommendation approval record (approver/date/blocker-count <=3) in `specs/001-databricks-apps-enterprise-feasibility/evidence/architecture-approval.md`
- [X] T068 Update stakeholder-ready summary and recommendation in `specs/001-databricks-apps-enterprise-feasibility/stakeholder-explanation.md`

## Dependencies & Execution Order

- Setup (Phase 1) -> Foundational (Phase 2) is mandatory.
- US1 can start after Phase 2.
- US2 can start after Phase 2 and should complete before US3/US4 final integration.
- US3 and US4 can run in parallel after US2 foundational APIs exist.
- US5 can run in parallel with US3/US4 after evidence starts accumulating.
- Governance finalization (Phase 9) runs after all selected user stories are complete.

## Parallel Opportunities

- [P] tests in each phase can run in parallel.
- Track 1 and Track 2 implementation can run in parallel after T026 foundation.
- Track 3 and Track 4 can run in parallel after T033/T034.

## Implementation Strategy

1. Deliver MVP evidence for US1 + US2 first (highest decision risk reduction).
2. Add collaboration/access control (US3 + US4).
3. Close strategic documentation (US5), operational readiness (US4), and governance closure (Phase 9).

## Notes

- Keep baseline KPI/Insights/Preferences behavior unchanged unless explicitly required by a track.
- Every track must update at least one evidence artifact under `specs/001-databricks-apps-enterprise-feasibility/evidence/`.
- Do not merge without passing quality gates and RBAC negative tests.
