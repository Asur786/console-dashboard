"""
Prompt Store — single source of truth for all Genie business prompts.

Prompts are defined as structured constants so they can be:
  - Referenced by ID from any service or endpoint
  - Updated in one place without touching route logic
  - Extended with new prompts without modifying existing code

Design rules:
  - Never hardcode prompt text inside API endpoints or services.
  - Every prompt must have a unique PROMPT_ID string.
  - Prompt templates contain placeholder text that PromptBuilder
    will complement with runtime filter context.
"""

from __future__ import annotations

from dataclasses import dataclass


# =========================================================================== #
#  Prompt IDs — use these constants everywhere instead of raw strings          #
# =========================================================================== #

PROMPT_EXECUTIVE_SUMMARY = "PROMPT_EXECUTIVE_SUMMARY"
PROMPT_ROOT_CAUSE        = "PROMPT_ROOT_CAUSE"
PROMPT_RECOMMENDATION    = "PROMPT_RECOMMENDATION"
PROMPT_FULL_INSIGHT      = "PROMPT_FULL_INSIGHT"


# =========================================================================== #
#  Prompt Definition                                                           #
# =========================================================================== #

@dataclass(frozen=True)
class PromptDefinition:
    """
    Immutable descriptor for a single business prompt.

    Attributes:
        prompt_id:   Unique identifier — matches one of the PROMPT_* constants.
        title:       Human-readable name used for logging and documentation.
        description: What this prompt is designed to produce.
        template:    The base prompt text. PromptBuilder appends filter context
                     and a data-source instruction before sending to Genie.
    """
    prompt_id:   str
    title:       str
    description: str
    template:    str


# =========================================================================== #
#  Predefined Business Prompts                                                 #
# =========================================================================== #

_PROMPTS: dict[str, PromptDefinition] = {

    PROMPT_EXECUTIVE_SUMMARY: PromptDefinition(
        prompt_id=PROMPT_EXECUTIVE_SUMMARY,
        title="Executive Summary",
        description=(
            "Generates a concise executive-level summary of KPI performance "
            "covering Dollar Sales, Volume Sales, YoY Growth, Market Share, "
            "and Distribution."
        ),
        template=(
            "Generate an executive summary of the current KPI performance.\n\n"
            "Cover the following KPIs:\n"
            "- Dollar Sales: current year value vs prior year and YoY growth %\n"
            "- Volume Sales: physical volume trend\n"
            "- Dollar Share: market position as a percentage of total\n"
            "- Distribution: product presence across measured markets\n"
            "- YoY Growth: overall headline growth metric\n\n"
            "Use the trend_indicator column (Increasing / Stable / Declining) "
            "to frame the performance sentiment.\n"
            "Present the output in a concise executive narrative — 3 to 5 sentences."
        ),
    ),

    PROMPT_ROOT_CAUSE: PromptDefinition(
        prompt_id=PROMPT_ROOT_CAUSE,
        title="Root Cause Analysis",
        description=(
            "Identifies the most likely business drivers responsible for the "
            "current KPI performance — positive or negative."
        ),
        template=(
            "Identify the most likely business drivers responsible for the "
            "current KPI performance.\n\n"
            "Analyse the following areas:\n"
            "1. Distribution changes — is the product losing or gaining market presence?\n"
            "2. Rate of sale — are consumers buying more or less per visit?\n"
            "3. Channel mix — which channel (Modern / Traditional / Online) is driving "
            "   or dragging overall performance?\n"
            "4. Pricing or product mix — is Dollar Sales growing faster than Volume "
            "   Sales, indicating a price-driven effect?\n\n"
            "Use the business_meaning and genie_guidance columns from gold_business_context "
            "to frame the diagnostic.\n"
            "Structure the response as a numbered root cause list with one sentence "
            "per cause."
        ),
    ),

    PROMPT_RECOMMENDATION: PromptDefinition(
        prompt_id=PROMPT_RECOMMENDATION,
        title="Business Recommendations",
        description=(
            "Provides actionable business recommendations based on KPI trends "
            "and the thresholds defined in gold_business_context."
        ),
        template=(
            "Based on the current KPI trends and the performance thresholds "
            "defined in gold_business_context, provide actionable business "
            "recommendations.\n\n"
            "For each KPI that is Declining:\n"
            "  - Reference the recommendation_if_negative from gold_business_context.\n"
            "  - Suggest one concrete action the business should take.\n\n"
            "For each KPI that is Increasing:\n"
            "  - Reference the recommendation_if_positive from gold_business_context.\n"
            "  - Suggest how to protect or amplify the momentum.\n\n"
            "For KPIs that are Stable:\n"
            "  - Note they require monitoring but no immediate action.\n\n"
            "Format the output as a prioritised recommendation list. "
            "Lead with the most urgent action."
        ),
    ),

    PROMPT_FULL_INSIGHT: PromptDefinition(
        prompt_id=PROMPT_FULL_INSIGHT,
        title="Full Business Insight",
        description=(
            "Generates a complete AI insight covering Executive Summary, "
            "Root Cause Analysis, and Business Recommendations in a single response."
        ),
        template=(
            "Generate a complete business performance insight with three sections:\n\n"
            "## 1. Executive Summary\n"
            "Provide a concise (3–5 sentence) executive narrative covering all KPIs: "
            "Dollar Sales, Volume Sales, Dollar Share, Volume Share, Distribution, "
            "and YoY Growth. State the current year value, prior year comparison, "
            "and overall trend for the business.\n\n"
            "## 2. Root Cause Analysis\n"
            "Identify the top 3 business drivers behind the current performance. "
            "Investigate: distribution coverage changes, rate-of-sale shifts, "
            "channel mix effects, and pricing or product mix signals. "
            "If Dollar Sales are growing but Volume Sales are declining, "
            "surface a premiumisation narrative.\n\n"
            "## 3. Business Recommendations\n"
            "Provide prioritised, actionable recommendations using the thresholds "
            "and templates from gold_business_context. "
            "Lead with the most urgent action. "
            "For each declining KPI, reference recommendation_if_negative. "
            "For each growing KPI, reference recommendation_if_positive.\n\n"
            "Use business_meaning and genie_guidance from gold_business_context "
            "to ensure all interpretations are commercially relevant."
        ),
    ),
}


# =========================================================================== #
#  Public API                                                                  #
# =========================================================================== #

def get_prompt(prompt_id: str) -> PromptDefinition:
    """
    Retrieve a PromptDefinition by its unique prompt_id.

    Args:
        prompt_id: One of the PROMPT_* constants defined in this module.

    Returns:
        The corresponding PromptDefinition.

    Raises:
        KeyError: If the prompt_id is not registered in the store.
    """
    if prompt_id not in _PROMPTS:
        valid = ", ".join(_PROMPTS.keys())
        raise KeyError(
            f"Unknown prompt_id '{prompt_id}'. "
            f"Valid values: {valid}"
        )
    return _PROMPTS[prompt_id]


def list_prompt_ids() -> list[str]:
    """Return all registered prompt IDs. Useful for documentation and validation."""
    return list(_PROMPTS.keys())
