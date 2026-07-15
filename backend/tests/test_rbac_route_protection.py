import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

# Match backend runtime import behavior when tests run from repository root.
_BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from routes.enterprise import router as enterprise_router


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(enterprise_router, prefix="/api")
    return TestClient(app)


def test_enterprise_share_endpoint_rejects_unrecognized_role() -> None:
    client = _client()
    response = client.post(
        "/api/enterprise/shares",
        headers={"X-User-Roles": "guest", "X-Forwarded-Email": "guest@example.com"},
        json={
            "resourceId": "view-rbac-1",
            "resourceType": "saved_view",
            "sharedWithUserId": "viewer@example.com",
            "shareRole": "viewer",
        },
    )
    assert response.status_code == 403


def test_enterprise_share_endpoint_allows_user_role() -> None:
    client = _client()
    response = client.post(
        "/api/enterprise/shares",
        headers={"X-User-Roles": "user", "X-Forwarded-Email": "owner@example.com"},
        json={
            "resourceId": "view-rbac-2",
            "resourceType": "saved_view",
            "sharedWithUserId": "viewer@example.com",
            "shareRole": "viewer",
        },
    )
    assert response.status_code == 201
