# Stakeholder Explanation and Reasoning

## Executive Position

Databricks Apps is validated as a strong data-native application platform for the currently proven scope (Dashboard, Insights, User Preferences). The remaining decision is not whether it works, but whether it can satisfy enterprise application-layer requirements without excessive workaround complexity.

## What Is Already Proven

- React + FastAPI app deployed and running inside Databricks Apps.
- Dynamic filter and KPI retrieval from Unity Catalog through SQL Warehouse.
- Prompt/Genie-driven insights flow integrated with backend APIs.
- User Preferences module with CRUD persistence in Unity Catalog.
- Startup-time schema/table initialization improves deployment portability.

## Why Further Evaluation Is Still Required

- Current evidence is strong for data-native modules, but not yet complete for enterprise controls.
- Architecture risk now sits in identity, RBAC granularity, cross-system integration, and operational governance.
- A premature platform conclusion without these checks can create rework later.

## Reasoned Guidance to Explain to Leadership

1. Databricks Apps is a valid candidate for the AI for BI Console core where value is tightly coupled to Lakehouse data and Genie.
2. Platform choice must be decided by enterprise capability fit, not by generic assumptions from product categories.
3. If enterprise requirements are partially supported, a hybrid model may provide best time-to-value with controlled risk.

## Pending Items (from discussion) and Why They Matter

- Multiple Data Source Support: required for broader enterprise workflows beyond single data platform assumptions.
- Cross-Workspace Data Access: required when business domains span workspace boundaries.
- Application Access and Sharing: required for controlled rollout and collaboration.
- User Access Management (Admin/User + configurable scopes): required for governance and compliance.
- Enterprise Integrations (identity + external APIs + non-Databricks systems): required for real production adoption.
- Operational Readiness (CI/CD, monitoring, scalability, lifecycle): required to move from POC to production reliability.
- Comparative Notes (Databricks AI/BI vs Power BI, Databricks One): required for strategic roadmap communication.

## Current Fit/Gap Snapshot

- Databricks-only fit: strongest alignment to the already validated data-native baseline and shortest path to extend KPI/Insights/Preferences.
- Databricks-only gaps: enterprise identity provider depth, fine-grained RBAC evidence, and external integration resilience still need proof artifacts.
- Azure-only fit: broad enterprise app controls and integration ecosystem are mature.
- Azure-only gaps: migration cost and delivery delay are materially higher because current validated paths would need platform relocation.
- Hybrid fit: preserves Databricks data/AI strengths while allowing selective enterprise controls in external app layer.
- Hybrid gaps: adds operational and architectural complexity that must be justified by unresolved high-risk findings.

## Recommended Decision Method

- Use evidence-based scorecard across three options: Databricks-only, Azure-only, Hybrid.
- For each option, score: integration effort, governance fit, time-to-market, operational overhead, and long-term maintainability.
- Approve platform direction only after P1/P2 validations in the feature spec are complete.

## Expected Outcome

A decision that is technically defensible, business-aligned, and low-risk for enterprise rollout, with clear explanation of what Databricks Apps should own and what should remain in external application layers.

## Explicit Non-Goals

- This phase does not attempt a full migration to Azure-only application hosting.
- This phase does not finalize enterprise production IAM/token validation architecture beyond feasibility mapping.
- This phase does not replace baseline KPI/Insights/Preferences contracts.

## Final Recommendation Snapshot

- Recommended near-term direction: Databricks-first extension of the validated baseline.
- Conditional fallback: Hybrid architecture if unresolved High-risk enterprise control gaps remain after readiness validation.
- Rejected for near-term scope: Azure-only migration due to higher migration/revalidation overhead relative to current baseline value.
