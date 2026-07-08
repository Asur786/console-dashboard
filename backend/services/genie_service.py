"""
GenieService — sends prompts to a Databricks Genie Space and returns insights.

Genie API flow (Databricks REST API):
  1. POST /api/2.0/genie/spaces/{space_id}/start-conversation
     → Creates a new conversation, sends the prompt as the first message.
     → Returns conversation_id + message_id.

  2. GET /api/2.0/genie/spaces/{space_id}/conversations/{conv_id}/messages/{msg_id}
     → Polls until the message status is COMPLETED or a terminal state.
     → Returns the Genie response with attachments (text, SQL, tables).

The response text is parsed to extract structured sections:
  - Executive Summary
  - Root Cause Analysis
  - Business Recommendations

If Genie returns unstructured text, the full response is returned as raw_response
and best-effort section extraction is attempted.
"""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from typing import Any, Optional

from config.settings import settings
from services.databricks_client import databricks_client

logger = logging.getLogger(__name__)

# =========================================================================== #
#  Constants                                                                   #
# =========================================================================== #

_POLL_INTERVAL_SECONDS = 3
_MAX_POLL_ATTEMPTS     = 40   # 40 × 3s = 120s max wait

_TERMINAL_STATUSES = frozenset({
    "COMPLETED",
    "FAILED",
    "CANCELLED",
    "QUERY_RESULT_EXPIRED",
})


# =========================================================================== #
#  GenieResponse DTO                                                           #
# =========================================================================== #

@dataclass
class GenieResponse:
    """
    Structured output from a Genie conversation.

    Attributes:
        executive_summary: Extracted '## 1. Executive Summary' section.
        root_cause:        Extracted '## 2. Root Cause Analysis' section.
        recommendation:    Extracted '## 3. Business Recommendations' section.
        raw_response:      The full unprocessed Genie text response.
    """
    executive_summary: str = ""
    root_cause:        str = ""
    recommendation:    str = ""
    raw_response:      str = ""


# =========================================================================== #
#  Section Extraction                                                          #
# =========================================================================== #

_SECTION_MARKERS = [
    # (field_name, list of heading variants to search for)
    ("executive_summary", [
        "## 1. Executive Summary",
        "## Executive Summary",
        "**Executive Summary**",
        "Executive Summary",
    ]),
    ("root_cause", [
        "## 2. Root Cause Analysis",
        "## Root Cause Analysis",
        "## Root Cause",
        "**Root Cause Analysis**",
        "Root Cause Analysis",
    ]),
    ("recommendation", [
        "## 3. Business Recommendations",
        "## Business Recommendations",
        "## Recommendations",
        "**Business Recommendations**",
        "Business Recommendations",
    ]),
]


def _extract_sections(text: str) -> dict[str, str]:
    """
    Best-effort extraction of the three insight sections from Genie's text.

    Strategy: find the heading markers in order and slice the text between them.
    If a heading is not found, the field remains empty.

    Args:
        text: The full Genie response text.

    Returns:
        Dict with keys 'executive_summary', 'root_cause', 'recommendation'.
    """
    # Find positions of each section heading
    positions: list[tuple[str, int]] = []
    for field_name, markers in _SECTION_MARKERS:
        for marker in markers:
            idx = text.find(marker)
            if idx != -1:
                # Start content after the heading line
                content_start = text.find("\n", idx)
                if content_start == -1:
                    content_start = idx + len(marker)
                else:
                    content_start += 1  # skip the newline
                positions.append((field_name, content_start))
                break

    # Sort by position in text
    positions.sort(key=lambda x: x[1])

    # Extract text between consecutive positions
    result: dict[str, str] = {
        "executive_summary": "",
        "root_cause":        "",
        "recommendation":    "",
    }

    for i, (field_name, start) in enumerate(positions):
        end = positions[i + 1][1] if i + 1 < len(positions) else len(text)
        # Walk backwards from end to find the heading of the next section
        # and trim it from this section's content
        section_text = text[start:end].strip()
        # Remove the next section's heading if it leaked into this section
        for _, markers in _SECTION_MARKERS:
            for marker in markers:
                if section_text.endswith(marker):
                    section_text = section_text[: -len(marker)].strip()
        result[field_name] = section_text

    return result


# =========================================================================== #
#  GenieService                                                                #
# =========================================================================== #

class GenieService:
    """
    Sends a prompt to Databricks Genie and returns a structured insight.

    Usage:
        service = GenieService()
        response = service.ask("Generate an executive summary...")
        # response.executive_summary → "..."
        # response.raw_response → full text
    """

    def __init__(self) -> None:
        self._space_id = settings.GENIE_SPACE_ID
        if not self._space_id:
            logger.warning("GENIE_SPACE_ID is not configured — GenieService will fail at runtime.")

    # ------------------------------------------------------------------ #
    #  Public API                                                         #
    # ------------------------------------------------------------------ #

    async def ask(self, prompt: str) -> GenieResponse:
        """
        Send a prompt to the Genie Space and wait for a response.

        Args:
            prompt: The fully assembled prompt string from PromptBuilder.

        Returns:
            GenieResponse with extracted sections and raw text.

        Raises:
            RuntimeError: If Genie is not configured or the conversation fails.
            TimeoutError: If polling exceeds the maximum wait time.
        """
        if not self._space_id:
            raise RuntimeError(
                "GENIE_SPACE_ID is not configured. "
                "Set it in the environment variables or app.yml."
            )

        logger.info("Starting Genie conversation | space_id=%s | prompt_length=%d",
                     self._space_id, len(prompt))

        # 1. Start conversation
        conversation_id, message_id = self._start_conversation(prompt)

        # 2. Poll for completion (async — does not block the event loop)
        raw_text = await self._poll_for_result(conversation_id, message_id)

        # 3. Extract sections
        if not raw_text:
            # Genie ran SQL but returned no narrative text.
            # Surface a useful message rather than blank sections.
            no_text_msg = (
                "Genie executed the query successfully but returned data results "
                "rather than a narrative summary. "
                "Try rephrasing as a direct business question, e.g. "
                "'What is the overall KPI performance and what actions should I take?'"
            )
            return GenieResponse(
                executive_summary=no_text_msg,
                root_cause="",
                recommendation="",
                raw_response="[No text response — Genie returned query/table results only]",
            )

        sections = _extract_sections(raw_text)

        response = GenieResponse(
            executive_summary=sections["executive_summary"],
            root_cause=sections["root_cause"],
            recommendation=sections["recommendation"],
            raw_response=raw_text,
        )

        logger.info(
            "Genie response received | sections found: exec=%d root=%d rec=%d | raw_length=%d",
            len(response.executive_summary),
            len(response.root_cause),
            len(response.recommendation),
            len(raw_text),
        )

        return response

    # ------------------------------------------------------------------ #
    #  Internal: Genie API calls                                          #
    # ------------------------------------------------------------------ #

    def _start_conversation(self, prompt: str) -> tuple[str, str]:
        """
        POST to start a new Genie conversation with the prompt as the first message.

        Official response structure (Databricks REST API):
            {
              "conversation": { "id": "...", ... },
              "message":      { "message_id": "...", ... }
            }

        Returns:
            (conversation_id, message_id)

        Raises:
            RuntimeError: If conversation_id or message_id is missing.
        """
        path = f"/api/2.0/genie/spaces/{self._space_id}/start-conversation"
        body = {"content": prompt}

        data = databricks_client.post(path, json=body)

        # Extract from nested response per official Databricks Genie API schema
        conversation_obj = data.get("conversation")
        message_obj      = data.get("message")

        if not isinstance(conversation_obj, dict) or not conversation_obj.get("id"):
            logger.error(
                "Genie start-conversation: missing conversation.id in response: %s",
                data,
            )
            raise RuntimeError(
                f"Genie response missing 'conversation.id'. "
                f"Full response: {data}"
            )

        if not isinstance(message_obj, dict) or not message_obj.get("message_id"):
            logger.error(
                "Genie start-conversation: missing message.message_id in response: %s",
                data,
            )
            raise RuntimeError(
                f"Genie response missing 'message.message_id'. "
                f"Full response: {data}"
            )

        conversation_id: str = conversation_obj["id"]
        message_id: str      = message_obj["message_id"]

        logger.debug("Genie conversation started | conv=%s | msg=%s",
                      conversation_id, message_id)
        return conversation_id, message_id

    async def _poll_for_result(self, conversation_id: str, message_id: str) -> str:
        """
        Poll the Genie message endpoint until the status is terminal.

        Uses asyncio.sleep so the FastAPI event loop is not blocked
        during the wait between poll attempts.

        Returns:
            The extracted text content from Genie's response.

        Raises:
            TimeoutError: If polling exceeds _MAX_POLL_ATTEMPTS.
            RuntimeError: If the message enters a FAILED or CANCELLED state.
        """
        path = (
            f"/api/2.0/genie/spaces/{self._space_id}"
            f"/conversations/{conversation_id}"
            f"/messages/{message_id}"
        )

        for attempt in range(1, _MAX_POLL_ATTEMPTS + 1):
            data = databricks_client.get(path)
            status = data.get("status", "UNKNOWN")

            logger.debug("Poll attempt %d/%d | status=%s",
                         attempt, _MAX_POLL_ATTEMPTS, status)

            if status == "COMPLETED":
                return self._extract_text_from_message(data)

            if status in _TERMINAL_STATUSES:
                error_detail = data.get("error", status)
                raise RuntimeError(
                    f"Genie message reached terminal state: {status}. "
                    f"Detail: {error_detail}"
                )

            await asyncio.sleep(_POLL_INTERVAL_SECONDS)

        raise TimeoutError(
            f"Genie did not complete within "
            f"{_MAX_POLL_ATTEMPTS * _POLL_INTERVAL_SECONDS}s. "
            f"conversation_id={conversation_id}, message_id={message_id}"
        )

    @staticmethod
    def _extract_text_from_message(message_data: dict[str, Any]) -> str:
        """
        Extract the human-readable text from a completed Genie message response.

        Genie responses contain attachments. A text narrative attachment has a
        'text' key (with a 'content' sub-key). SQL query attachments have a
        'query' key. We collect all text narratives.

        Important: message_data['content'] is the USER's message (our prompt),
        NOT Genie's reply — we must never return that as the insight.
        """
        attachments = message_data.get("attachments") or []

        text_parts: list[str] = []
        for att in attachments:
            # Detect text attachment by presence of 'text' key (not by type field,
            # which is not consistently present in the Genie API response)
            text_obj = att.get("text")
            if isinstance(text_obj, dict):
                content = text_obj.get("content", "")
                if content:
                    text_parts.append(content)

        if text_parts:
            return "\n\n".join(text_parts)

        # Genie executed SQL but returned no narrative text attachment.
        # Log the structure so we can debug in Databricks App logs.
        logger.warning(
            "Genie COMPLETED but returned no text attachment. "
            "Attachment types received: %s",
            [list(att.keys()) for att in attachments],
        )
        return ""


# Module-level singleton
genie_service = GenieService()
