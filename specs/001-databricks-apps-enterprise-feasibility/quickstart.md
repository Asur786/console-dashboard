# Quickstart: Validate Feature 001 Plan Outputs

## Purpose

Run a focused validation sequence for enterprise-feasibility tracks while ensuring the KPI/Insights/Preferences baseline remains unchanged.

## Prerequisites

- Project dependencies installed (`npm install` and Python dependencies from `requirements.txt`).
- Databricks connection variables configured for baseline validation.
- Existing baseline app starts successfully.

## Baseline Validation (Must Pass First)

1. Start backend and frontend as currently documented.
2. Verify filters load and KPI cards refresh with selected filters.
3. Verify insights endpoint returns structured output.
4. Verify user preference CRUD and default selection behavior.

Expected outcome: no regression in baseline user journeys.

## Track Validation Scenarios

### Track 1: Multiple Data Sources

1. Enable default source (Databricks) and run KPI/filters requests.
2. Enable external adapter in test mode and run equivalent requests.
3. Compare response contract shape and error semantics.

Expected outcome: same response contract, source-specific metadata captured.

### Track 2: Cross-Workspace Access

1. Execute validation request against an allowed workspace mapping.
2. Execute validation request against a disallowed mapping.
3. Verify deny response and audit-log evidence.

Expected outcome: allowlist-based routing, deny-by-default enforced.

### Track 3: Application Access and Sharing

1. Share a saved view from owner to viewer.
2. Verify viewer can read but not edit when role is viewer.
3. Revoke share and verify access removal.

Expected outcome: share/revoke behavior follows role semantics.

### Track 4: User Access Management (RBAC)

1. Invoke protected admin action as non-admin user.
2. Invoke same action as admin user.
3. Verify backend decision payload and frontend guard behavior.

Expected outcome: consistent enforcement and auditable decisions.

## Quality Gate Validation

1. Run lint/build/tests.
2. Verify CI workflow is green for relevant branch.

Expected outcome: quality gates pass and produce traceable reports.

Latest run status:

- `npm run lint` -> pass
- `npm run build` -> pass
- `npm run test:frontend` -> pass
- `npm run test:backend` -> pass (21 tests)

Evidence links:

- `evidence/performance-load.md`
- `evidence/observability.md`
- `evidence/failure-drill.md`
- `evidence/capability-status.md`

## Decision Scorecard Completion

1. Score Databricks-only, Azure-only, Hybrid options using the criteria in `plan.md`.
2. Attach evidence links for each criterion score.
3. Produce recommendation with residual risks and mitigations.

Expected outcome: architecture recommendation ready for stakeholder review.

Current scorecard artifact: `evidence/decision-scorecard.md`
