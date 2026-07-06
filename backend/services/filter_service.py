"""
Filter service — returns distinct dimension values for each filter axis.

Delegates all SQL / mock logic to DatabricksService.
"""

from models.filters import FilterOption, FiltersResponse
from services.databricks_service import databricks_service


def get_filters() -> FiltersResponse:
    """
    Return all filter options.

    Schema source:
      channels   → marketdimension.GlobalChannel
      categories → productdimension.Category
      retailers  → marketdimension.GlobalRetailer
      countries  → marketdimension.Country
    """
    raw = databricks_service.get_filters()

    return FiltersResponse(
        channels=[FilterOption(**opt) for opt in raw["channels"]],
        categories=[FilterOption(**opt) for opt in raw["categories"]],
        retailers=[FilterOption(**opt) for opt in raw["retailers"]],
        countries=[FilterOption(**opt) for opt in raw["countries"]],
    )
