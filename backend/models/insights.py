"""
Pydantic models for the POST /api/insights endpoint.

Request:  InsightRequest
Response: InsightResponse
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field

from services.prompt_store import list_prompt_ids


class InsightRequest(BaseModel):
    """
    Request body for POST /api/insights.

    The promptId must be one of the registered PROMPT_* constants.
    Filters that are omitted or set to 'ALL' are treated as no filter.

    Example:
        {
            "promptId": "PROMPT_FULL_INSIGHT",
            "country":  "FRANCE",
            "channel":  "MODERN",
            "category": "SAVOURY SNACKS",
            "retailer": "ALL"
        }
    """
    prompt_id: str = Field(
        alias="promptId",
        description=(
            f"ID of the predefined business prompt. "
            f"Valid values: {list_prompt_ids()}"
        ),
        examples=["PROMPT_FULL_INSIGHT"],
    )
    country:  Optional[str] = Field(
        default=None,
        description="Dashboard Country filter. Omit or set to 'ALL' for no filter.",
        examples=["FRANCE"],
    )
    channel:  Optional[str] = Field(
        default=None,
        description="Dashboard Channel filter (e.g. MODERN, TRADITIONAL, ONLINE).",
        examples=["MODERN"],
    )
    category: Optional[str] = Field(
        default=None,
        description="Dashboard Category filter (e.g. BEVERAGES, SAVOURY SNACKS).",
        examples=["SAVOURY SNACKS"],
    )
    retailer: Optional[str] = Field(
        default=None,
        description="Dashboard Retailer filter (e.g. WALMART, TESCO, CARREFOUR).",
        examples=["WALMART"],
    )

    model_config = {"populate_by_name": True}


class InsightResponse(BaseModel):
    """
    Response body for POST /api/insights.

    Returns the structured Genie insight with extracted sections,
    the prompt that was sent, and metadata about the request.

    Example:
        {
            "executiveSummary": "Dollar Sales grew 10% YoY...",
            "rootCause":        "Growth is driven by Modern channel...",
            "recommendation":   "Protect distribution in MODERN...",
            "rawResponse":      "## 1. Executive Summary\n...",
            "promptId":         "PROMPT_FULL_INSIGHT",
            "title":            "Full Business Insight",
            "activeFilters": {
                "Country": "FRANCE",
                "Channel": "MODERN"
            }
        }
    """
    executive_summary: str = Field(
        alias="executiveSummary",
        description="Extracted executive summary section from Genie response.",
    )
    root_cause: str = Field(
        alias="rootCause",
        description="Extracted root cause analysis section from Genie response.",
    )
    recommendation: str = Field(
        alias="recommendation",
        description="Extracted business recommendations section from Genie response.",
    )
    raw_response: str = Field(
        alias="rawResponse",
        description="The full unprocessed text response from Genie.",
    )
    prompt_id: str = Field(
        alias="promptId",
        description="The prompt_id that was used to generate this insight.",
    )
    title: str = Field(
        description="Human-readable name of the selected prompt.",
    )
    active_filters: dict[str, str] = Field(
        alias="activeFilters",
        description=(
            "The filters that were applied. "
            "Only non-ALL filters are included."
        ),
    )

    model_config = {"populate_by_name": True}
