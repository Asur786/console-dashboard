"""
Pydantic models for the /api/kpis endpoint.

Mirrors the frontend's KpiResult and PerformanceSummary types
defined in src/types/kpi.types.ts.

Schema column mapping (fact tables → KPIs):
  Dollar Sales  → SUM(CurrentYearDollarSales)
  Dollar Share  → filtered CY$ / total CY$ × 100
  Volume Share  → filtered CYVol / total CYVol × 100
  Distribution  → present markets (KPIIndicator=1) / total markets × 100
  YoY Growth    → (CY$ − PY$) / PY$ × 100
"""

from typing import Literal, Optional
from pydantic import BaseModel


class KpiFilters(BaseModel):
    """Query parameters for the KPI endpoint."""
    channel: str = "ALL"
    category: str = "ALL"
    retailer: str = "ALL"
    country: str = "ALL"


class KpiResult(BaseModel):
    """A single KPI card value."""
    id: str
    label: str
    value: str                                          # pre-formatted, e.g. "$4.8B"
    numeric_value: float                                # raw number
    previous_year_value: float
    yoy_change_percent: float
    sublabel: str
    value_color: Literal["default", "green", "red"]


class KpisResponse(BaseModel):
    """Full response envelope for the KPI endpoint."""
    kpis: list[KpiResult]
    last_updated: str                                   # ISO-8601
