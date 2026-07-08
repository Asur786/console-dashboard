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
    "Use gold_business_context from this Genie Space to look up KPI definitions, "
    "thresholds (positive_threshold, negative_threshold), and recommendation "
    "templates (recommendation_if_positive, recommendation_if_negative, "
    "genie_guidance) for each KPI mentioned above.\n"
    "Join on kpi_name."
)

_DATA_SOURCE_INSTRUCTION_NO_KPI_VALUES = (
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


@dataclass(frozen=True)
class KpiSnapshot:
    """A single KPI value from the dashboard, injected into the prompt."""
    label: str
    value: str
    sublabel: str = ""


def build_prompt(
    base_template: str,
    filters: FilterContext,
    kpi_values: list[KpiSnapshot] | None = None,
) -> str:
    """
    Assemble the final prompt string from a base template, filter context,
    and optionally the exact KPI values currently shown on the dashboard.

    When kpi_values are provided, the prompt tells Genie to interpret those
    exact numbers rather than recalculating from the gold tables. This ensures
    the AI narrative matches the dashboard KPI cards exactly.

    Args:
        base_template: The prompt body from PromptStore (prompt.template).
        filters:       The active dashboard filters for this request.
        kpi_values:    Optional list of KPI snapshots from the dashboard.

    Returns:
        A complete, ready-to-send prompt string.
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

    # --- KPI values block (injected from dashboard) ---
    if kpi_values:
        kpi_lines = "\n".join(
            f"- {kpi.label} = {kpi.value}" for kpi in kpi_values
        )

        # Place KPI values BEFORE the main template so Genie sees them first
        sections.insert(0,
            "IMPORTANT: The following KPI values are the ONLY values you should "
            "reference in your response. These are the exact values currently "
            "displayed on the dashboard. Do NOT query gold_kpi_summary. "
            "Do NOT run any SQL to look up KPI metrics. "
            "Use ONLY the values listed below.\n\n"
            f"Dashboard KPI Values:\n{kpi_lines}"
        )

        # Only reference business context table — not gold_kpi_summary
        sections.append(
            "For KPI definitions, thresholds, and recommendation templates, "
            "use gold_business_context from this Genie Space. "
            "Join on kpi_name. "
            "Do NOT query gold_kpi_summary — the KPI values above are "
            "already provided and must be used as-is."
        )
    else:
        # No KPI values provided — fall back to Genie querying the gold tables
        sections.append(_DATA_SOURCE_INSTRUCTION_NO_KPI_VALUES)

    return "\n\n".join(sections)
