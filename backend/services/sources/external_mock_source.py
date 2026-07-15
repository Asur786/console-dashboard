"""External mock source adapter for enterprise feasibility tests."""

from __future__ import annotations


class ExternalMockSourceAdapter:
    source_id = "external-mock"
    source_type = "external_api"
    is_default = False
    capabilities = ("kpi", "filters")

    def __init__(self, enabled: bool) -> None:
        self.is_active = enabled

    def fetch_kpis(self, *, filters: dict[str, str], force_timeout: bool = False) -> dict[str, object]:
        if force_timeout:
            return {
                "status": "degraded",
                "sourceId": self.source_id,
                "fallback": "databricks-default",
                "reason": "timeout",
                "filters": filters,
                "items": [],
            }

        return {
            "status": "ok",
            "sourceId": self.source_id,
            "filters": filters,
            "items": [],
        }
