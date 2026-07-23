"""
Pydantic models for the /api/filters endpoint.

Mirrors the frontend's FilterOption / FilterDimension types defined in
src/types/filter.types.ts.

The set of dimensions is config-driven (settings.FILTER_DIMENSIONS), so the
response is a generic list of dimensions rather than fixed axes.
"""

from pydantic import BaseModel


class FilterOption(BaseModel):
    value: str
    label: str


class FilterDimension(BaseModel):
    key: str
    label: str
    options: list[FilterOption]


class FiltersResponse(BaseModel):
    dimensions: list[FilterDimension]
