import sys
from pathlib import Path

# Match backend runtime import behavior when tests run from repository root.
_BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from services.enterprise_service import enterprise_service


def test_scorecard_template_schema_and_weights() -> None:
    result = enterprise_service.scorecard_template()

    assert result.options == ["databricks-only", "azure-only", "hybrid"]
    assert len(result.criteria) >= 6
    assert sum(item.weight for item in result.criteria) == 100
    assert all(item.weight > 0 for item in result.criteria)
