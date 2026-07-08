"""
Prompt Builder — assembles the final prompt string from a base template
and runtime filter context supplied by the API caller.

Responsibilities:
  - Accept user-selected dashboard filters (country, channel, category, retailer).
  - Build a human-readable filter context block.
  - Append the filter context and a data-source instruction to the base prompt template.
  - Omit any filter that is set to ALL or left empty (clean, minimal prompts).

This module has no I/O dependencies — it is pure string manipulation and
is independently unit-testable.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


# =========================================================================== #
#  Filter Context                                                              #
# =========================================================================== #

@dataclass(frozen=True)
class FilterContext:
    """
    Holds the active dashboard filter values for a single insight request.

    A value of None or 'ALL' (case-insensitive) means "no filter applied"
    and that dimension will be omitted from the prompt.

    Attributes:
        country:  e.g. "FRANCE"
        channel:  e.g. "MODERN"
        category: e.g. "SAVOURY SNACKS"
        retailer: e.g. "WALMART"
    """
    country:  Optional[str] = None
    channel:  Optional[str] = None
    category: Optional[str] = None
    retailer: Optional[str] = None

    def is_active(self, value: Optional[str]) -> bool:
        """Return True if a filter value is set and not the default ALL sentinel."""
        return bool(value and value.strip().upper() not in ("", "ALL"))

    @property
    def has_any_filter(self) -> bool:
        """True if at least one non-ALL filter is active."""
        return any(
            self.is_active(v)
            for v in (self.country, self.channel, self.category, self.retailer)
        )

    def active_filters(self) -> dict[str, str]:
        """
        Return only the filters that are active as a label→value mapping.
        Order: Country, Channel, Category, Retailer (matches dashboard order).
        """
        candidates = {
            "Country":  self.country,
            "Channel":  self.channel,
            "Category": self.category,
            "Retailer": self.retailer,
        }
        return {
            label: value.strip()
            for label, value in candidates.items()
            if self.is_active(value)
        }


# =========================================================================== #
#  Prompt Builder                                                              #
# =========================================================================== #

_DATA_SOURCE_INSTRUCTION = (
    "Query the Gold Layer tables in this Genie Space:\n"
    "  - gold_kpi_summary: pre-aggregated KPI metrics "
    "(current_year_value, previous_year_value, yoy_growth_pct, "
    "share_pct, distribution_pct, trend_indicator)\n"
    "  - gold_business_context: KPI definitions, thresholds, and "
    "recommendation templates (business_meaning, positive_threshold, "
    "negative_threshold, recommendation_if_positive, recommendation_if_negative, "
    "genie_guidance)\n"
    "Join the two tables on kpi_name."
)


def build_prompt(base_template: str, filters: FilterContext) -> str:
    """
    Assemble the final prompt string from a base template and filter context.

    The output has three sections:
      1. The base prompt template (the 'what to generate' instruction).
      2. An active-filter block (the 'scope' of the analysis) — only included
         if at least one non-ALL filter is active.
      3. A data source instruction (the 'where to look' directive).

    Args:
        base_template: The prompt body from PromptStore (prompt.template).
        filters:       The active dashboard filters for this request.

    Returns:
        A complete, ready-to-send prompt string.

    Example output (PROMPT_FULL_INSIGHT, Country=FRANCE, Channel=MODERN):

        Generate a complete business performance insight with three sections:
        ...

        Filters applied to this analysis:
        - Country = FRANCE
        - Channel = MODERN

        Query the Gold Layer tables in this Genie Space:
          - gold_kpi_summary: ...
          - gold_business_context: ...
        Join the two tables on kpi_name.
    """
    sections: list[str] = [base_template.strip()]

    # --- Filter context block ---
    if filters.has_any_filter:
        active = filters.active_filters()
        filter_lines = "\n".join(
            f"- {label} = {value}" for label, value in active.items()
        )
        sections.append(
            f"Filters applied to this analysis:\n{filter_lines}"
        )
    else:
        sections.append(
            "No filters applied — analyse all available markets, "
            "channels, categories, and retailers."
        )

    # --- Data source instruction ---
    sections.append(_DATA_SOURCE_INSTRUCTION)

    return "\n\n".join(sections)
