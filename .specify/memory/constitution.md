<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Modified principles:
	- [PRINCIPLE_1_NAME] -> I. Data Fidelity First
	- [PRINCIPLE_2_NAME] -> II. Contract-First API and Type Safety
	- [PRINCIPLE_3_NAME] -> III. Test-and-Trace Discipline (NON-NEGOTIABLE)
	- [PRINCIPLE_4_NAME] -> IV. Responsible AI Insight Generation
	- [PRINCIPLE_5_NAME] -> V. Observability, Performance, and Resilience
- Added sections:
	- Technical Standards and Security Constraints
	- Development Workflow and Quality Gates
- Removed sections:
	- None
- Templates requiring updates:
	- ✅ .specify/templates/plan-template.md
	- ✅ .specify/templates/spec-template.md
	- ✅ .specify/templates/tasks-template.md
- Command files review:
	- ✅ .github/agents/speckit.*.agent.md and .github/prompts/speckit.*.prompt.md checked for outdated CLAUDE-only guidance
- Follow-up TODOs:
	- None
-->

# Console Dashboard Constitution

## Core Principles

### I. Data Fidelity First
All KPI values, filter options, and insight context MUST originate from governed
Databricks sources or validated backend transformations. Production code MUST NOT
hardcode business outcomes. Every filter-aware response MUST apply the active
filter context deterministically in SQL or service logic.

Rationale: executive decisions rely on trusted data lineage and reproducible
numbers.

### II. Contract-First API and Type Safety
Backend API contracts (FastAPI + Pydantic models) and frontend TypeScript types
MUST stay aligned. Any API contract change MUST include corresponding frontend
type/service updates and a documented compatibility decision (compatible,
versioned, or breaking). Silent contract drift is prohibited.

Rationale: this project spans Python and TypeScript; contract drift is the
highest-leverage source of runtime failure.

### III. Test-and-Trace Discipline (NON-NEGOTIABLE)
Behavior-changing work MUST include automated verification at the impacted layer
(backend tests, frontend tests, or both) and MUST pass lint/build checks before
merge. Bug fixes MUST include a regression test or an explicit rationale when a
test is infeasible. Every critical path change MUST emit or preserve actionable
logs.

Rationale: reliable iteration in a mixed UI/API/AI system requires both tests
and traceability.

### IV. Responsible AI Insight Generation
All Genie prompt templates MUST be centralized and versioned in the prompt store.
Prompt execution MUST include explicit filter context and MUST NOT include
secrets, tokens, or unnecessary sensitive data. AI outputs MUST be treated as
decision support, not authoritative fact, and error/fallback behavior MUST be
defined for timeout and upstream failures.

Rationale: AI-generated guidance is useful only when constrained, auditable, and
safe.

### V. Observability, Performance, and Resilience
APIs MUST return clear HTTP semantics and actionable error messages. Startup and
runtime dependencies (for example Databricks/Genie) MUST fail gracefully when
possible so non-dependent features remain available. KPI/insight endpoints SHOULD
target sub-2s p95 under normal load and MUST document justified exceptions.

Rationale: dashboards are operational tools; partial availability and debuggable
failures are mandatory.

## Technical Standards and Security Constraints

- Frontend standard stack: React + TypeScript + Vite + Fluent UI components.
- Backend standard stack: FastAPI + typed models/services with environment-driven
	configuration.
- Databricks credentials and service tokens MUST remain server-side only; browser
	code MUST NOT receive secrets.
- New data access paths MUST use centralized service/repository layers rather
	than ad hoc query logic spread across routes/components.

## Development Workflow and Quality Gates

- Required SDD order for feature work: `/speckit.constitution` (when amended) ->
	`/speckit.specify` -> `/speckit.plan` -> `/speckit.tasks` ->
	`/speckit.implement`.
- Every PR MUST link to a spec/plan/tasks artifact set and state constitution
	compliance.
- Review gate MUST verify: data fidelity impact, contract impact, test evidence,
	AI-safety impact, and observability impact.
- Converge/analyze/checklist commands SHOULD be used before merging medium or
	high-risk changes.

## Governance
This constitution overrides conflicting local process notes for delivery work.
Amendments require: (1) explicit change rationale, (2) impacted template review,
and (3) version update under semantic governance versioning.

Versioning policy:
- MAJOR: remove or redefine a principle/governance rule incompatibly.
- MINOR: add a new principle/section or materially expand mandatory guidance.
- PATCH: clarifications, wording improvements, and non-semantic refinements.

Compliance review expectations:
- Each feature PR MUST include a constitution check summary.
- Reviewers MUST block merges that violate non-negotiable principles.
- Exceptions MUST be documented with scope, risk, owner, and expiry date.

**Version**: 1.0.0 | **Ratified**: 2026-07-15 | **Last Amended**: 2026-07-15
