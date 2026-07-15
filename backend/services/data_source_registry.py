"""Registry for enterprise data source adapters."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SourceDescriptor:
    source_id: str
    source_type: str
    is_default: bool
    is_active: bool
    capabilities: tuple[str, ...]


class DataSourceRegistry:
    def __init__(self, sources: list[object]) -> None:
        self._sources = sources

    def default_source(self):
        for source in self._sources:
            if getattr(source, "is_default", False):
                return source
        raise ValueError("No default source configured")

    def capabilities(self) -> list[dict[str, object]]:
        result: list[dict[str, object]] = []
        for source in self._sources:
            result.append(
                {
                    "sourceId": source.source_id,
                    "sourceType": source.source_type,
                    "isDefault": source.is_default,
                    "isActive": source.is_active,
                    "capabilities": list(source.capabilities),
                }
            )
        return result
