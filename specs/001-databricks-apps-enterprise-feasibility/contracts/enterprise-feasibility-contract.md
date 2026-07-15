# Contract: Enterprise Feasibility APIs and Evidence

## 1) Source Capability Contract

### GET `/api/enterprise/sources/capabilities`

- Purpose: Report available source adapters and support status.
- Response:

```json
{
  "sources": [
    {
      "sourceId": "databricks-default",
      "sourceType": "databricks_sql",
      "isDefault": true,
      "isActive": true,
      "capabilities": ["kpi", "filters", "insights", "preferences"]
    }
  ]
}
```

## 2) Cross-Workspace Validation Contract

### POST `/api/enterprise/workspaces/validate-access`

- Request:

```json
{
  "workspaceId": "workspace-a",
  "catalog": "workspace",
  "schema": "default"
}
```

- Response:

```json
{
  "allowed": true,
  "reason": "policy_match",
  "policyId": "policy-001"
}
```

## 3) Sharing Contract

### POST `/api/enterprise/shares`

- Request:

```json
{
  "resourceId": "view-123",
  "resourceType": "saved_view",
  "sharedWithUserId": "user@example.com",
  "shareRole": "viewer"
}
```

- Response:

```json
{
  "resourceId": "view-123",
  "sharedWithUserId": "user@example.com",
  "shareRole": "viewer",
  "createdAt": "2026-07-15T00:00:00Z"
}
```

### DELETE `/api/enterprise/shares/{resourceId}/{sharedWithUserId}`

- Purpose: Revoke sharing for a specific resource-user pair.
- Response: `204 No Content`

## 4) RBAC Authorization Contract

### GET `/api/enterprise/authz/check`

- Query params: `action`, `resourceType`, `resourceId`
- Response:

```json
{
  "allowed": false,
  "role": "user",
  "matchedScope": null,
  "reason": "insufficient_scope"
}
```

## 5) Evidence Contract

### POST `/api/enterprise/evidence`

- Purpose: Attach an artifact to an FR/scenario.
- Request:

```json
{
  "requirementId": "FR-003",
  "artifactType": "test_report",
  "artifactPath": "specs/001-databricks-apps-enterprise-feasibility/evidence/cross-workspace.md",
  "summary": "deny-by-default validated"
}
```

- Response includes generated `evidenceId` and timestamp.

## Non-Functional Contract Notes

- All enterprise feasibility endpoints require authenticated identity context.
- Unauthorized access MUST return `403` with machine-readable reason.
- Existing baseline endpoints remain backward compatible and unchanged.
