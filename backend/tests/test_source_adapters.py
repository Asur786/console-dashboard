import sys
from pathlib import Path

# Match backend runtime import behavior when tests run from repository root.
_BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from services.data_source_registry import DataSourceRegistry
from services.sources.databricks_source import DatabricksSourceAdapter
from services.sources.external_mock_source import ExternalMockSourceAdapter


def test_source_registry_lists_default_and_optional_sources() -> None:
    registry = DataSourceRegistry(
        sources=[DatabricksSourceAdapter(), ExternalMockSourceAdapter(enabled=True)]
    )

    capabilities = registry.capabilities()
    ids = {item["sourceId"] for item in capabilities}

    assert "databricks-default" in ids
    assert "external-mock" in ids


def test_source_registry_returns_default_source() -> None:
    registry = DataSourceRegistry(sources=[DatabricksSourceAdapter()])
    default_source = registry.default_source()
    assert default_source.source_id == "databricks-default"
    assert default_source.is_default is True
