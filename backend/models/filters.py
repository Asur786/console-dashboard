"""
Pydantic models for the /api/filters endpoint.

Mirrors the frontend's FilterOption and DashboardFilterOptions types
defined in src/types/filter.types.ts.

Schema column mapping:
  channels   → marketdimension.GlobalChannel
  categories → productdimension.Category
  retailers  → marketdimension.GlobalRetailer
  countries  → marketdimension.Country
"""

from pydantic import BaseModel


class FilterOption(BaseModel):
    value: str
    label: str


class FiltersResponse(BaseModel):
    channels: list[FilterOption]
    categories: list[FilterOption]
    retailers: list[FilterOption]
    countries: list[FilterOption]
