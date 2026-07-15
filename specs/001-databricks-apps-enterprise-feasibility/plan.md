# Implementation Plan: Databricks Apps Enterprise Feasibility for AI for BI Console

**Branch**: `001-databricks-apps-enterprise-feasibility` | **Date**: 2026-07-15 | **Spec**: `specs/001-databricks-apps-enterprise-feasibility/spec.md`

**Input**: Feature specification from `/specs/001-databricks-apps-enterprise-feasibility/spec.md`

## Summary

Validate enterprise feasibility of the existing Databricks Apps POC without breaking the proven KPI/Insights/Preferences baseline. Deliver four implementation tracks: (1) multiple data source support, (2) cross-workspace access, (3) application access and sharing, and (4) user access management with RBAC. Produce evidence-backed architecture recommendation (Databricks-only vs Azure-only vs Hybrid) with explicit risks and decision criteria.

## Technical Context

**Language/Version**: Python 3.12 backend, TypeScript 6.x + React 19 frontend

**Primary Dependencies**: FastAPI, Pydantic, databricks-sql-connector, requests, React, Fluent UI, Axios

**Storage**: Unity Catalog/Databricks SQL Warehouse for current metadata and analytics; external system integration path to be validated by adapters

**Testing**: pytest (backend), Vitest (frontend), ESLint + TypeScript build, CI workflow checks

**Target Platform**: Databricks Apps runtime (primary), with comparative feasibility against Azure Web Apps

**Project Type**: Web application (React frontend + FastAPI backend)

**Performance Goals**: KPI and insights endpoint median <1.5s and p95 <2.0s during POC test load; graceful degradation when dependent systems are unavailable

**Constraints**: Keep baseline user workflows unchanged; no secret exposure to frontend; policy checks must default to deny for unauthorized access

**Scale/Scope**: Enterprise feasibility POC (not full production rollout); complete FR-001..FR-012 evidence mapping

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Pre-Phase-0 Gate Status: PASS

- Data Fidelity First: Authoritative data remains Unity Catalog/SQL Warehouse for baseline modules; new adapters must preserve deterministic filter behavior and data provenance fields.
- Contract-First API and Type Safety: New APIs will use versioned response envelopes; frontend types updated with role/share/source abstractions.
- Test-and-Trace Discipline: Each track includes contract/integration checks plus structured logging for allow/deny and data-source decisions.
- Responsible AI Insight Generation: Existing insight prompts and safety controls remain unchanged; added auth/source context must not alter prompt confidentiality guarantees.
- Observability, Performance, and Resilience: Health checks, error semantics, and fallback paths are required for each new dependency boundary.

## Project Structure

### Documentation (this feature)

```text
specs/001-databricks-apps-enterprise-feasibility/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── enterprise-feasibility-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── config/
├── models/
├── repositories/
├── routes/
├── services/
└── tests/

src/
├── components/
├── pages/
├── services/
├── types/
└── hooks/

databricks/
├── notebooks/
└── sql/

.github/workflows/
```

**Structure Decision**: Web application architecture using the existing repository layout where frontend source is `src/` and backend source is `backend/`.

## Implementation Tracks

### Track 1: Multiple Data Source Support

- Introduce backend source adapter abstraction and source registry.
- Keep Databricks source as default baseline and add one external-source POC adapter.
- Add source selection policy (request/context + server allowlist).
- Preserve existing KPI/Insights/Preferences API behavior for default source.

### Track 2: Cross-Workspace Data Access

- Add workspace context resolver (workspace/catalog/schema mapping by policy).
- Enforce allowlist-based workspace routing with deny-by-default.
- Add audit logs for allowed and denied workspace access attempts.
- Validate partial-access edge cases and fallback responses.

### Track 3: Application Access and Sharing

- Add sharing model for key resources (owner/editor/viewer semantics).
- Add share/revoke/list APIs and enforce visibility constraints.
- Add frontend sharing UX hooks for resource-level access checks.
- Capture governance controls for app sharing boundaries.

### Track 4: User Access Management with RBAC

- Add auth context extraction middleware with normalized identity claims.
- Add RBAC policy guards for admin/user/scoped actions.
- Apply guards to protected backend routes and sensitive UI actions.
- Ensure unauthorized actions are blocked and auditable.

## Evidence Matrix

| Requirement | Evidence Artifact | Validation Method | Owner |
|-------------|-------------------|-------------------|-------|
| FR-002 | `specs/001-databricks-apps-enterprise-feasibility/evidence/multi-source.md` | Contract test across default + external adapter | Backend |
| FR-003 | `specs/001-databricks-apps-enterprise-feasibility/evidence/cross-workspace.md` | Allow/deny integration tests with logs | Backend + Data |
| FR-004 | `specs/001-databricks-apps-enterprise-feasibility/evidence/access-sharing.md` | Share/revoke workflow tests | Backend + Frontend |
| FR-005 | `specs/001-databricks-apps-enterprise-feasibility/evidence/rbac.md` | Role/scope enforcement tests | Backend + Frontend |
| FR-009 | `.github/workflows/quality-gates.yml` run history | CI pass + local runbook validation | Engineering |
| FR-010 | `specs/001-databricks-apps-enterprise-feasibility/evidence/decision-scorecard.md` | Weighted score review + risk review | Architecture |
| FR-011 | `specs/001-databricks-apps-enterprise-feasibility/stakeholder-explanation.md` | Explicit non-goals section and scope guard review | Product + Architecture |
| FR-008 | `specs/001-databricks-apps-enterprise-feasibility/evidence/api-first-decision.md` | ADR review for API-first boundary and persistence split | Architecture |
| FR-006 | `specs/001-databricks-apps-enterprise-feasibility/evidence/identity-limitations.md` | Provider-specific identity feasibility and limitations review | Security + Architecture |

## Risk Register

| ID | Risk | Impact | Likelihood | Mitigation | Exit Criteria |
|----|------|--------|------------|------------|---------------|
| R1 | Contract drift while adding source/workspace context | High | Medium | Versioned DTOs + contract tests | All contract tests pass for legacy and new paths |
| R2 | RBAC gaps permit unauthorized operations | High | Medium | Centralized guard middleware + deny-by-default | Negative authorization tests pass |
| R3 | Cross-workspace policy complexity blocks rollout | High | Medium | Restrict to allowlist and explicit mappings in POC | Access matrix validated for all target scenarios |
| R4 | Operational readiness not reflected by CI reality | Medium | Medium | Fix current lint/test blockers and enforce gates on PRs | CI green on target branch for 3 consecutive runs |
| R5 | Scorecard bias due to missing evidence | Medium | Low | Require evidence links for every scored criterion | Review board accepts completeness checklist |

## Decision Scorecard: Databricks-only vs Azure-only vs Hybrid

Scoring scale: 1 (poor) to 5 (strong). Weighted score = score x weight.

| Criterion | Weight | Databricks-only | Azure-only | Hybrid |
|-----------|--------|-----------------|------------|--------|
| Data/AI-native velocity | 20 | TBD | TBD | TBD |
| Enterprise identity/RBAC fit | 20 | TBD | TBD | TBD |
| External integration flexibility | 15 | TBD | TBD | TBD |
| Operational overhead | 15 | TBD | TBD | TBD |
| Governance and auditability | 15 | TBD | TBD | TBD |
| Time-to-market from current baseline | 15 | TBD | TBD | TBD |
| **Total / 500** | **100** | **TBD** | **TBD** | **TBD** |

Decision rule: choose highest weighted score only if there are no unresolved High risks without mitigation owners.

## Baseline Preservation Rules

- Existing KPI/Insights/Preferences API contracts remain backward-compatible during this phase.
- Existing Databricks-default behavior remains primary path unless feature-flagged alternatives are explicitly requested.
- No prompt-store semantics are changed by this phase; only access/control and source-routing extensions are added.

## Phase 0 and Phase 1 Outputs

- Phase 0 research output: `research.md` resolves architecture unknowns and trade-off decisions.
- Phase 1 design outputs: `data-model.md`, `contracts/enterprise-feasibility-contract.md`, and `quickstart.md` define implementation contracts and validation scenarios.

## Post-Design Constitution Re-Check

Post-Phase-1 Gate Status: PASS (design artifacts align with constitution principles and maintain baseline safety constraints).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
