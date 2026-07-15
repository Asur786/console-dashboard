# Platform Comparison: Databricks AI/BI vs Power BI

## Scope

Comparison is framed for this project's architecture: React + FastAPI app with data-native KPI/insights workflows already validated in Databricks context.

## Summary Table

| Dimension | Databricks AI/BI + Apps | Power BI + Azure App Stack |
|-----------|--------------------------|----------------------------|
| Data-native Lakehouse integration | Strong (first-class Unity Catalog + SQL Warehouse + Genie alignment) | Strong for Microsoft ecosystem, but requires additional integration from current baseline |
| AI-assisted insight path | Native Genie-centric pathway already integrated | Rich ecosystem, but migration of prompt/workflow logic is non-trivial |
| Enterprise app controls | Improving, some controls require custom implementation in app layer | Mature app platform patterns across Azure services |
| Time-to-value from current baseline | Highest (reuse current proven stack) | Lower (platform relocation + contract migration effort) |
| Cross-system integration flexibility | Good with adapter layer, still to validate depth | Broad integration catalog and established enterprise patterns |

## Implications for Feature 001

- Databricks-first is the fastest route to preserve and extend validated data-native value.
- If unresolved enterprise control gaps remain after US2/US4 completion, hybrid architecture becomes the preferred fallback.
- Azure-only is currently least favorable due to migration and re-validation overhead.
