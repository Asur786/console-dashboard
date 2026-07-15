# Data Model: Enterprise Feasibility POC

## Entity: CapabilityAssessment

- Purpose: Tracks each evaluated enterprise capability and outcome.
- Fields:
  - `id` (string, required)
  - `capability` (enum: `multi_source`, `cross_workspace`, `sharing`, `rbac`, required)
  - `status` (enum: `not_started`, `in_progress`, `supported`, `partial`, `not_supported`, required)
  - `owner` (string, required)
  - `evidence_links` (array<string>, required)
  - `notes` (string, optional)
  - `updated_at` (datetime, required)

## Entity: WorkspacePolicy

- Purpose: Defines allowed workspace/cross-catalog routing constraints.
- Fields:
  - `policy_id` (string, required)
  - `workspace_id` (string, required)
  - `allowed_catalogs` (array<string>, required)
  - `allowed_schemas` (array<string>, required)
  - `allowed_roles` (array<string>, required)
  - `is_active` (boolean, required)

## Entity: DataSourceConfig

- Purpose: Registers available data sources for adapter routing.
- Fields:
  - `source_id` (string, required)
  - `source_type` (enum: `databricks_sql`, `external_api`, `external_db`, required)
  - `connection_ref` (string, required)
  - `priority` (integer, required)
  - `is_default` (boolean, required)
  - `is_active` (boolean, required)

## Entity: ResourceShare

- Purpose: Captures resource-level sharing for application access.
- Fields:
  - `resource_id` (string, required)
  - `resource_type` (enum: `saved_view`, `report`, `future_resource`, required)
  - `owner_user_id` (string, required)
  - `shared_with_user_id` (string, required)
  - `share_role` (enum: `viewer`, `editor`, `owner`, required)
  - `created_at` (datetime, required)
  - `revoked_at` (datetime, optional)

## Entity: UserAccessProfile

- Purpose: Represents resolved role/scope claims used by guards.
- Fields:
  - `user_id` (string, required)
  - `display_name` (string, optional)
  - `roles` (array<enum: `admin`, `user`, required)
  - `scopes` (array<string>, required)
  - `identity_provider` (enum: `databricks`, `okta`, `azure_ad`, `other`, required)
  - `is_active` (boolean, required)

## Entity: EvaluationEvidence

- Purpose: Stores reproducible test and observation artifacts.
- Fields:
  - `evidence_id` (string, required)
  - `requirement_id` (string, required)
  - `artifact_type` (enum: `test_report`, `log_extract`, `screenshot`, `runbook`, `scorecard`, required)
  - `artifact_path` (string, required)
  - `summary` (string, required)
  - `created_by` (string, required)
  - `created_at` (datetime, required)

## Relationships

- `CapabilityAssessment` references many `EvaluationEvidence`.
- `UserAccessProfile` is evaluated against `WorkspacePolicy` and `ResourceShare`.
- `DataSourceConfig` selection influences evidence linked to FR-002/FR-003.

## State Transitions

### CapabilityAssessment.status

- `not_started` -> `in_progress`
- `in_progress` -> `supported` | `partial` | `not_supported`
- `partial` -> `supported` (after mitigation and re-test)

### ResourceShare

- active share (`revoked_at = null`) -> revoked share (`revoked_at != null`)

### UserAccessProfile

- active (`is_active = true`) -> inactive (`is_active = false`) on deprovisioning
