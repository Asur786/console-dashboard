"""
InsightService — orchestrates AI-generated business insights.

Responsibility chain:
  1. Validate the requested prompt_id against the Prompt Store.
  2. Build the FilterContext from caller-supplied filter values.
  3. Delegate to PromptBuilder to assemble the final prompt string.
  4. Send the prompt to GenieService → Databricks Genie Space.
  5. Return the structured insight (executive summary, root cause, recommendation).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

from services.prompt_store import get_prompt, PromptDefinition
from services.prompt_builder import FilterContext, KpiSnapshot, build_prompt
from services.genie_service import genie_service, GenieResponse

logger = logging.getLogger(__name__)


# =========================================================================== #
#  InsightService                                                              #
# =========================================================================== #

class InsightService:
    """
    Orchestrates the full insight generation pipeline:
      PromptStore → PromptBuilder → GenieService → InsightResult

    Usage:
        service = InsightService()
        result = service.generate_insight(
            prompt_id="PROMPT_FULL_INSIGHT",
            country="FRANCE",
            channel="MODERN",
        )
        # result.executive_summary → "..."
        # result.root_cause → "..."
        # result.recommendation → "..."
    """

    async def generate_insight(
        self,
        prompt_id: str,
        country:   Optional[str] = None,
        channel:   Optional[str] = None,
        category:  Optional[str] = None,
        retailer:  Optional[str] = None,
        kpi_values: Optional[list[KpiSnapshot]] = None,
    ) -> "InsightResult":
        """
        Build a prompt from the store + filters + KPI values, send it to Genie,
        and return the structured insight.

        Args:
            prompt_id:  One of the PROMPT_* constants from prompt_store.py.
            country:    Dashboard Country filter value (or None / 'ALL').
            channel:    Dashboard Channel filter value (or None / 'ALL').
            category:   Dashboard Category filter value (or None / 'ALL').
            retailer:   Dashboard Retailer filter value (or None / 'ALL').
            kpi_values: Optional KPI snapshots from the dashboard. When provided,
                        the exact values are injected into the prompt so Genie
                        interprets them instead of recalculating.

        Returns:
            InsightResult with structured sections and metadata.

        Raises:
            KeyError:      If prompt_id is not registered.
            RuntimeError:  If Genie is not configured or fails.
            TimeoutError:  If Genie does not respond in time.
        """
        # 1. Load prompt definition — raises KeyError for unknown prompt_id
        prompt_def: PromptDefinition = get_prompt(prompt_id)

        logger.info(
            "Generating insight | prompt_id=%s | kpi_values=%d | filters: "
            "country=%s channel=%s category=%s retailer=%s",
            prompt_id, len(kpi_values) if kpi_values else 0,
            country, channel, category, retailer,
        )

        # 2. Build filter context
        filters = FilterContext(
            country=country,
            channel=channel,
            category=category,
            retailer=retailer,
        )

        # 3. Assemble the final prompt (with injected KPI values if provided)
        final_prompt = build_prompt(
            base_template=prompt_def.template,
            filters=filters,
            kpi_values=kpi_values,
        )

        logger.debug("Assembled prompt (%d chars)", len(final_prompt))

        # 4. Send to Genie and get response
        genie_response: GenieResponse = await genie_service.ask(final_prompt)

        # 5. Return structured result
        return InsightResult(
            prompt_id=prompt_id,
            title=prompt_def.title,
            prompt=final_prompt,
            active_filters=filters.active_filters(),
            executive_summary=genie_response.executive_summary,
            root_cause=genie_response.root_cause,
            recommendation=genie_response.recommendation,
            raw_response=genie_response.raw_response,
        )


# =========================================================================== #
#  Result DTO                                                                  #
# =========================================================================== #

class InsightResult:
    """
    Value object returned by InsightService.generate_insight.

    Attributes:
        prompt_id:         The prompt_id that was used.
        title:             Human-readable name of the prompt.
        prompt:            The assembled prompt string that was sent to Genie.
        active_filters:    Dict of filter label → value for non-ALL filters.
        executive_summary: Extracted executive summary section from Genie.
        root_cause:        Extracted root cause analysis section.
        recommendation:    Extracted business recommendations section.
        raw_response:      The full unprocessed Genie text response.
    """

    def __init__(
        self,
        prompt_id:         str,
        title:             str,
        prompt:            str,
        active_filters:    dict[str, str],
        executive_summary: str = "",
        root_cause:        str = "",
        recommendation:    str = "",
        raw_response:      str = "",
    ) -> None:
        self.prompt_id         = prompt_id
        self.title             = title
        self.prompt            = prompt
        self.active_filters    = active_filters
        self.executive_summary = executive_summary
        self.root_cause        = root_cause
        self.recommendation    = recommendation
        self.raw_response      = raw_response

    def __repr__(self) -> str:
        return (
            f"InsightResult(prompt_id={self.prompt_id!r}, "
            f"title={self.title!r}, "
            f"filters={self.active_filters}, "
            f"exec_summary_len={len(self.executive_summary)}, "
            f"root_cause_len={len(self.root_cause)}, "
            f"recommendation_len={len(self.recommendation)})"
        )


# Module-level singleton — reuse across requests (no state)
insight_service = InsightService()
