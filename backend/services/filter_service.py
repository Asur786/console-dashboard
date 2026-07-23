"""
Filter service — returns distinct dimension values for each filter axis.

Delegates all SQL / mock logic to DatabricksService. The set of dimensions is
config-driven (settings.FILTER_DIMENSIONS).
"""

from models.filters import FilterDimension, FilterOption, FiltersResponse
from services.databricks_service import databricks_service


def get_filters() -> FiltersResponse:
    """Return all filter dimensions with their selectable options."""
    raw = databricks_service.get_filters()

    return FiltersResponse(
        dimensions=[
            FilterDimension(
                key=dim["key"],
                label=dim["label"],
                options=[FilterOption(**opt) for opt in dim["options"]],
            )
            for dim in raw
        ]
    )
