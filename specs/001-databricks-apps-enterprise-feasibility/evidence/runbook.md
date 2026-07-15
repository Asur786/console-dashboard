# Operational Runbook (POC)

## Startup

1. Install dependencies:
   - Frontend: `npm install`
   - Backend: install Python deps from `requirements.txt`
2. Run backend API (FastAPI) and frontend app (Vite) per project README.

## Validation Commands

- Lint: `npm run lint`
- Build: `npm run build`
- Frontend tests: `npm run test:frontend`
- Backend tests: `npm run test:backend`

## Enterprise Validation Endpoints

- GET `/api/enterprise/sources/capabilities`
- POST `/api/enterprise/workspaces/validate-access`
- POST `/api/enterprise/shares`
- GET `/api/enterprise/authz/check`
- POST `/api/enterprise/evidence`

## Failure Handling

- If Databricks dependencies are unavailable, baseline startup should remain resilient per app lifespan policy.
- For authorization failures, review response `reason` and correlated audit logs.
