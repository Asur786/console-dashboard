# API Contract Compatibility Note

## Compatibility Policy

- Existing baseline endpoints remain unchanged.
- Enterprise endpoints are additive under `/api/enterprise/*`.
- Response aliases preserve camelCase contract expectations.

## Versioning Decision

- Current change set is backward-compatible and remains within the same API version.
- Any future breaking payload changes must be introduced via explicit versioned endpoints.

## Validation

- Contract checks include enterprise evidence endpoint shape and scorecard schema tests.
- Frontend type exports were updated with enterprise DTOs to keep client/server alignment.
