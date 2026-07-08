"""
POST /api/insights

Thin controller — all business logic lives in InsightService.

Responsibilities:
  - Parse and validate the request body via InsightRequest.
  - Delegate to InsightService (which calls PromptBuilder → GenieService).
  - Map the structured result to InsightResponse.
  - Handle error cases with appropriate HTTP status codes.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from models.insights import InsightRequest, InsightResponse
from services.insight_service import insight_service
from services.prompt_builder import KpiSnapshot

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/insights",
    response_model=InsightResponse,
    response_model_by_alias=True,
    summary="Generate AI-driven business insights via Databricks Genie",
    description=(
        "Accepts a prompt_id and optional dashboard filters. "
        "Builds a prompt, sends it to the configured Genie Space, "
        "and returns the structured insight with executive summary, "
        "root cause analysis, and business recommendations."
    ),
    tags=["insights"],
)
async def insights_endpoint(body: InsightRequest) -> InsightResponse:
    """
    Generate a business insight using Genie.

    - **promptId**: One of PROMPT_EXECUTIVE_SUMMARY, PROMPT_ROOT_CAUSE,
      PROMPT_RECOMMENDATION, PROMPT_FULL_INSIGHT.
    - **country / channel / category / retailer**: Dashboard filter values.
      Omit or pass 'ALL' for no filter on that dimension.
    """
    try:
        # Convert Pydantic KpiValue models to KpiSnapshot dataclasses
        kpi_snapshots = None
        if body.kpi_values:
            kpi_snapshots = [
                KpiSnapshot(label=kv.label, value=kv.value, sublabel=kv.sublabel)
                for kv in body.kpi_values
            ]

        result = await insight_service.generate_insight(
            prompt_id=body.prompt_id,
            country=body.country,
            channel=body.channel,
            category=body.category,
            retailer=body.retailer,
            kpi_values=kpi_snapshots,
        )
    except KeyError as exc:
        logger.warning("Invalid prompt_id requested: %s", body.prompt_id)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except TimeoutError as exc:
        logger.error("Genie timed out: %s", exc)
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except RuntimeError as exc:
        logger.error("Genie runtime error: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected error generating insight")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate insight: {exc}",
        ) from exc

    return InsightResponse(
        executiveSummary=result.executive_summary,
        rootCause=result.root_cause,
        recommendation=result.recommendation,
        rawResponse=result.raw_response,
        promptId=result.prompt_id,
        title=result.title,
        activeFilters=result.active_filters,
    )
