"""
FastAPI entry point for the Console Dashboard backend.

Run locally:
    cd backend
    uvicorn app:app --reload --port 8000

Databricks Apps deployment:
    app.yml runs: python -m uvicorn backend.app:app --host 0.0.0.0 --port 8000
    React frontend is built to ../dist/ and served as static files.
"""

import sys
from pathlib import Path

# Ensure backend/ is on sys.path so "from config..." / "from routes..." works
# whether uvicorn is started from backend/ (local) or project root (Databricks)
_BACKEND_DIR = Path(__file__).parent.resolve()
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

import logging
from contextlib import asynccontextmanager

from config.settings import settings
from routes.filters import router as filters_router
from routes.kpis import router as kpis_router
from routes.insights import router as insights_router
from routes.preferences import router as preferences_router
from repositories.preference_repository import preference_repository

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """
    Application lifespan handler.

    On startup, best-effort ensures the user preferences schema and Delta table
    exist in Unity Catalog so the API never fails on a missing object. The
    operation is idempotent — existing schema, table and data are never
    modified.

    Non-fatal policy: initialization runs inside the container boot sequence,
    so a failure here (missing UC privileges, cold/unavailable SQL warehouse,
    transient network error) must NOT crash the whole app. Databricks Apps
    treats a lifespan exception as a startup crash, which would take down the
    entire dashboard — including features that don't touch preferences. We log
    the failure and let the app start; because the table is provisioned once
    and normally already exists, CRUD continues to work regardless.

    When Databricks is not configured (local dev), initialization is skipped
    with a warning so the rest of the app can still be exercised.
    """
    if settings.is_databricks_configured:
        try:
            logger.info("Running Unity Catalog initialization for user preferences...")
            preference_repository.ensure_schema_and_table()
        except Exception:
            logger.exception(
                "User preferences initialization failed during startup — the app "
                "will still start. If the table already exists, preference endpoints "
                "remain fully functional."
            )
    else:
        logger.warning(
            "Databricks not configured — skipping preferences table initialization."
        )
    yield
    # No shutdown work required.


app = FastAPI(
    title="Console Dashboard API",
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# --- CORS (allows Vite dev server at localhost:5173) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Routes ---
app.include_router(filters_router, prefix="/api", tags=["filters"])
app.include_router(kpis_router, prefix="/api", tags=["kpis"])
app.include_router(insights_router, prefix="/api", tags=["insights"])
app.include_router(preferences_router, prefix="/api", tags=["preferences"])


@app.get("/api/health")
async def health() -> dict:
    return {
        "status": "ok",
        "databricks_configured": settings.is_databricks_configured,
    }


# --- Serve React frontend (production only) ---
DIST_DIR = Path(__file__).parent.parent / "dist"

if DIST_DIR.is_dir():
    # Serve static assets (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")

    # Serve other static files in dist root (favicon, etc.)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the React SPA — all non-API routes return index.html."""
        file_path = DIST_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(DIST_DIR / "index.html")
