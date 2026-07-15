import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

# Match backend runtime import behavior when tests run from repository root.
_BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from routes.enterprise import router as enterprise_router


def test_evidence_api_contract_shape() -> None:
    app = FastAPI()
    app.include_router(enterprise_router, prefix="/api")
    client = TestClient(app)

    response = client.post(
        "/api/enterprise/evidence",
        headers={"X-User-Roles": "admin", "X-Forwarded-Email": "admin@example.com"},
        json={
            "requirementId": "FR-003",
            "artifactType": "test_report",
            "artifactPath": "specs/001-databricks-apps-enterprise-feasibility/evidence/cross-workspace.md",
            "summary": "deny-by-default validated",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["requirementId"] == "FR-003"
    assert body["artifactType"] == "test_report"
    assert "evidenceId" in body
    assert "createdAt" in body
