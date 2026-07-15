# API-First Module Boundary Decision

## Decision

Adopt API-first boundaries for enterprise feasibility tracks:

- Routes define stable contract shapes.
- Services contain orchestration and policy decisions.
- Persistence remains split by concern (existing repositories for baseline data; in-memory stores for feasibility-only artifacts).

## Rationale

- Preserves backward compatibility for baseline KPI/Insights/Preferences modules.
- Reduces contract drift risk across Python backend and TypeScript frontend.
- Enables incremental migration from in-memory feasibility state to persistent storage later.

## Trade-Offs

- Temporary duplication between baseline and enterprise service surfaces.
- Additional wrapper code for source/policy abstraction.

## Result

Accepted for feature 001 feasibility scope.
