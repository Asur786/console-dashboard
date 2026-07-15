# Identity Integration Limitations (POC)

## Providers Evaluated

- Databricks forwarded identity headers
- Okta (group/scope header mapping spike)
- Azure AD (role/scope header mapping spike)

## Current Mapping Approach

- Canonical roles/scopes use `X-User-Roles` and `X-User-Scopes`.
- Okta extension headers: `X-Okta-Groups`, `X-Okta-Scopes`.
- Azure extension headers: `X-Azure-Roles`, `X-Azure-Scopes`.
- Effective access profile merges canonical and provider-specific claims.

## Limitations

- Header-based mapping is a feasibility shortcut; production should validate signed tokens and issuer trust.
- Group-to-role normalization policy is not finalized (naming conventions may vary by tenant).
- Scope taxonomy is still project-specific and not centrally governed.

## Follow-Up

- Add token verification middleware when moving beyond POC.
- Define enterprise role catalog and claim normalization standards.
