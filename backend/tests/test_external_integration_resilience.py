import sys
from pathlib import Path

# Match backend runtime import behavior when tests run from repository root.
_BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from services.sources.external_mock_source import ExternalMockSourceAdapter


def test_external_source_fallback_on_timeout() -> None:
    adapter = ExternalMockSourceAdapter(enabled=True)

    result = adapter.fetch_kpis(filters={"year": "2026"}, force_timeout=True)

    assert result["status"] == "degraded"
    assert result["fallback"] == "databricks-default"
    assert result["items"] == []
