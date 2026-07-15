# Decision Scorecard (Draft)

## Scoring Method

- Scale: 1 (poor) to 5 (strong)
- Weighted score = score x weight
- Recommendation requires highest weighted score and no unresolved High risk without owner

## Criteria Weights

| Criterion | Weight |
|-----------|--------|
| Data/AI-native velocity | 20 |
| Enterprise identity/RBAC fit | 20 |
| External integration flexibility | 15 |
| Operational overhead | 15 |
| Governance and auditability | 15 |
| Time-to-market from current baseline | 15 |
| **Total** | **100** |

## Initial Fit/Gap Snapshot

| Option | Fit Signals | Gap Signals | Preliminary Position |
|--------|-------------|-------------|----------------------|
| Databricks-only | Strong Lakehouse + Genie alignment, fastest baseline reuse | Enterprise identity/integration depth needs proof | Candidate if Tracks 2/4 close cleanly |
| Azure-only | Broad app platform controls and integrations | Highest migration cost from current validated baseline | Not preferred for near-term |
| Hybrid | Keeps Databricks data-native strengths while offloading select app controls | Added architecture and ops complexity | Strong fallback if critical gaps remain |

## Weighted Scoring (T058)

Scores use 1-5 scale. Weighted score = score x weight.

| Criterion | Weight | Databricks-only | Azure-only | Hybrid |
|-----------|--------|-----------------|------------|--------|
| Data/AI-native velocity | 20 | 5 (100) | 3 (60) | 4 (80) |
| Enterprise identity/RBAC fit | 20 | 3 (60) | 5 (100) | 4 (80) |
| External integration flexibility | 15 | 3 (45) | 5 (75) | 4 (60) |
| Operational overhead | 15 | 4 (60) | 3 (45) | 2 (30) |
| Governance and auditability | 15 | 4 (60) | 4 (60) | 4 (60) |
| Time-to-market from current baseline | 15 | 5 (75) | 2 (30) | 4 (60) |
| **Total / 500** | **100** | **400** | **370** | **370** |

## Recommendation

- Preferred: Databricks-only with tracked mitigation of remaining enterprise control gaps.
- Fallback: Hybrid if unresolved High-risk gaps persist after operational validation.

## Current Status

- This artifact is intentionally draft until all US1-US4 validation evidence is complete.
- Final weighted scoring will be populated in T058.
