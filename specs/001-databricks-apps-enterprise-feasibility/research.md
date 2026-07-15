# Research: Databricks Apps Enterprise Feasibility

## Context

This research resolves implementation uncertainties for feature 001 while preserving the validated baseline (KPI, Insights, User Preferences) in Databricks Apps.

## Decision 1: Use an Adapter Pattern for Multiple Data Sources

- Decision: Implement a backend source adapter layer (`DataSourceAdapter`) with Databricks as default and one external-source adapter for feasibility.
- Rationale: Keeps current Databricks paths intact while enabling controlled experimentation for FR-002 and FR-007.
- Alternatives considered:
  - Directly branch source logic in route handlers: rejected due to coupling and contract-drift risk.
  - Full data virtualization platform change: rejected as out of scope for feasibility phase.

## Decision 2: Enforce Explicit Workspace Routing Policy

- Decision: Add allowlist-based workspace routing with policy mapping (workspace -> catalog/schema constraints).
- Rationale: Satisfies FR-003 with least privilege and auditable deny-by-default behavior.
- Alternatives considered:
  - Free-form workspace selection from client: rejected for security and governance risk.
  - Hardcoded single workspace only: rejected because it cannot validate cross-workspace requirement.

## Decision 3: Resource-Level Sharing Model (owner/editor/viewer)

- Decision: Implement sharing controls at resource level (saved views and future governed resources) with owner/editor/viewer roles.
- Rationale: Addresses FR-004 and prepares for controlled collaboration workflows.
- Alternatives considered:
  - Global app-level role only: rejected since it cannot represent resource ownership.
  - Manual out-of-band access provisioning: rejected due to poor traceability.

## Decision 4: Centralized RBAC Guarding in Backend

- Decision: Add middleware + policy guard layer for role and scope checks, then apply to protected endpoints.
- Rationale: Meets FR-005 and reduces duplicated authorization logic.
- Alternatives considered:
  - Frontend-only role checks: rejected because it is bypassable.
  - Per-endpoint ad hoc checks: rejected due to maintainability and consistency risk.

## Decision 5: Keep Databricks-First Baseline with Feature-Flagged Extensions

- Decision: Preserve current Databricks-default path and gate new enterprise capabilities via config/feature flags.
- Rationale: Maintains FR-001 and minimizes regression risk in validated modules.
- Alternatives considered:
  - Replace baseline path immediately: rejected because it risks destabilizing POC outcomes.

## Decision 6: Weighted Architecture Scorecard for Final Recommendation

- Decision: Use weighted criteria to compare Databricks-only, Azure-only, and Hybrid options.
- Rationale: Produces transparent recommendation aligned with FR-010 and stakeholder guidance.
- Alternatives considered:
  - Narrative-only recommendation: rejected due to subjectivity.
  - Cost-only comparison: rejected because governance and integration fit are equally critical.

## Open Clarifications Resolved

- Need for preserving baseline modules: confirmed and mandatory.
- Need for enterprise identity and external integration evaluation: included as explicit tracks with evidence artifacts.
- Need for ops-readiness proof: backed by CI quality gates plus targeted test evidence.

## Implementation Sequencing Recommendation

1. Foundation contract and policy primitives.
2. Track 1 and Track 2 (source and workspace controls).
3. Track 3 and Track 4 (sharing and RBAC).
4. Scorecard completion, risk closure, and stakeholder sign-off package.
