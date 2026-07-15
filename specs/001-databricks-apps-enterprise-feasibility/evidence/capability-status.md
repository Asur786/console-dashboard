# Capability Status and Risk Closure

## Capability Table

| Capability | Status | Evidence |
|------------|--------|----------|
| Multiple data sources | In progress (POC-level support) | `backend/services/data_source_registry.py`, `backend/tests/test_source_adapters.py` |
| Cross-workspace access | In progress (policy-based validation) | `backend/services/workspace_policy.py`, `backend/tests/test_cross_workspace_access.py` |
| Application sharing | In progress (share/list/revoke APIs + UI controls) | `backend/tests/test_sharing_api.py`, `src/pages/Preferences/PreferencesPage.tsx` |
| RBAC/access management | In progress (route guards + authz check + role-aware UI actions) | `backend/tests/test_rbac_route_protection.py`, `src/hooks/useAuthorization.ts` |
| Evidence ingestion | Supported (feasibility contract level) | `backend/tests/test_enterprise_evidence_api.py` |

## High-Risk Closure Summary

- R1 Contract drift: mitigated by explicit enterprise DTOs and tests.
- R2 RBAC gaps: mitigated by centralized checks and protected-route tests.
- R3 Cross-workspace complexity: partially mitigated via allowlist policy model.
- R4 Operational readiness drift: mitigated by successful quality gate run sequence.
- R5 Scorecard bias: mitigated by completed weighted scorecard and evidence references.
