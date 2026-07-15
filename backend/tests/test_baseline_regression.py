import sys
from pathlib import Path

# Match backend runtime import behavior when tests run from repository root.
_BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

def test_baseline_routes_are_registered() -> None:
    app_file = _BACKEND_DIR / "app.py"
    contents = app_file.read_text(encoding="utf-8")

    required_router_lines = [
        'app.include_router(filters_router, prefix="/api", tags=["filters"])',
        'app.include_router(kpis_router, prefix="/api", tags=["kpis"])',
        'app.include_router(insights_router, prefix="/api", tags=["insights"])',
        'app.include_router(preferences_router, prefix="/api", tags=["preferences"])',
    ]

    for line in required_router_lines:
        assert line in contents, f"Missing baseline route registration: {line}"

    assert '@app.get("/api/health")' in contents
