"""
PreferenceService — business logic for the User Preference module.

Responsibilities:
  - Generate the view name from selected filters and KPIs.
  - Generate the view_id (UUID) on creation.
  - Enforce the "at most one default per user" rule.
  - Map repository rows to UserPreferenceView domain models.

Routes never talk to the repository directly — they go through this service.
"""

from __future__ import annotations

import logging
import uuid
from typing import Optional

from models.preference import (
    UserPreferenceView,
    SaveViewRequest,
    FILTER_LABELS,
    KPI_LABELS,
)
from repositories.preference_repository import preference_repository

logger = logging.getLogger(__name__)


class PreferenceService:
    """Orchestrates preference operations on top of the repository."""

    # ------------------------------------------------------------------ #
    #  Name generation                                                   #
    # ------------------------------------------------------------------ #

    @staticmethod
    def generate_view_name(
        visible_filters: list[str],
        visible_kpis: list[str],
    ) -> str:
        """
        Build a human-readable name from selected filter and KPI keys.

        Format:  "Filters(<filters>) | KPIs(<kpis>)"
        Example: "Filters(Channel, Category) | KPIs(Dollar Sales, YoY Growth, Distribution)"

        Uses "All" when a group is empty, e.g. "Filters(All)".
        Labels come from FILTER_LABELS / KPI_LABELS so the output stays
        human-readable and independent of the internal key names.
        """
        filter_part = (
            ", ".join(FILTER_LABELS.get(f, f) for f in visible_filters)
            if visible_filters else "All"
        )
        kpi_part = (
            ", ".join(KPI_LABELS.get(k, k) for k in visible_kpis)
            if visible_kpis else "All"
        )
        return f"Filters({filter_part}) | KPIs({kpi_part})"

    # ------------------------------------------------------------------ #
    #  Read                                                               #
    # ------------------------------------------------------------------ #

    def list_views(self, user_id: str) -> list[UserPreferenceView]:
        """Return all saved views for a user (default first, then newest)."""
        rows = preference_repository.list_by_user(user_id)
        return [self._to_model(r) for r in rows]

    def get_view(self, user_id: str, view_id: str) -> Optional[UserPreferenceView]:
        """Return a single saved view, or None if not found for this user."""
        row = preference_repository.get_by_id(user_id, view_id)
        return self._to_model(row) if row else None

    # ------------------------------------------------------------------ #
    #  Create                                                            #
    # ------------------------------------------------------------------ #

    def create_view(
        self,
        user_id: str,
        req: SaveViewRequest,
    ) -> UserPreferenceView:
        """
        Create a new saved view. Auto-generates view_id and view_name.
        If is_default is requested, clears any existing default first.
        """
        view_id = str(uuid.uuid4())
        view_name = self.generate_view_name(req.visible_filters, req.visible_kpis)

        if req.is_default:
            preference_repository.clear_default_for_user(user_id)

        preference_repository.insert(
            user_id=user_id,
            view_id=view_id,
            view_name=view_name,
            visible_filters=list(req.visible_filters),
            visible_kpis=list(req.visible_kpis),
            source_id=req.source_id,
            is_default=req.is_default,
        )

        logger.info("Created view %s for user %s (default=%s)",
                    view_id, user_id, req.is_default)

        created = preference_repository.get_by_id(user_id, view_id)
        if not created:
            # Should never happen — the insert just succeeded
            raise RuntimeError("View was created but could not be read back.")
        return self._to_model(created)

    # ------------------------------------------------------------------ #
    #  Update                                                            #
    # ------------------------------------------------------------------ #

    def update_view(
        self,
        user_id: str,
        view_id: str,
        req: SaveViewRequest,
    ) -> Optional[UserPreferenceView]:
        """
        Update an existing view's visible config and default flag.
        Regenerates the view name. Returns None if the view does not exist.
        """
        existing = preference_repository.get_by_id(user_id, view_id)
        if not existing:
            return None

        view_name = self.generate_view_name(req.visible_filters, req.visible_kpis)

        if req.is_default:
            preference_repository.clear_default_for_user(user_id)

        preference_repository.update(
            user_id=user_id,
            view_id=view_id,
            view_name=view_name,
            visible_filters=list(req.visible_filters),
            visible_kpis=list(req.visible_kpis),
            is_default=req.is_default,
        )

        logger.info("Updated view %s for user %s (default=%s)",
                    view_id, user_id, req.is_default)

        updated = preference_repository.get_by_id(user_id, view_id)
        return self._to_model(updated) if updated else None

    # ------------------------------------------------------------------ #
    #  Delete                                                            #
    # ------------------------------------------------------------------ #

    def delete_view(self, user_id: str, view_id: str) -> bool:
        """Delete a view. Returns True if it existed, False otherwise."""
        existing = preference_repository.get_by_id(user_id, view_id)
        if not existing:
            return False
        preference_repository.delete(user_id, view_id)
        logger.info("Deleted view %s for user %s", view_id, user_id)
        return True

    # ------------------------------------------------------------------ #
    #  Set default                                                       #
    # ------------------------------------------------------------------ #

    def set_default(self, user_id: str, view_id: str) -> Optional[UserPreferenceView]:
        """
        Mark a view as the user's default. Clears any prior default first.
        Returns the updated view, or None if it does not exist.
        """
        existing = preference_repository.get_by_id(user_id, view_id)
        if not existing:
            return None

        preference_repository.clear_default_for_user(user_id)
        preference_repository.update(
            user_id=user_id,
            view_id=view_id,
            view_name=existing["generated_view_name"],
            visible_filters=existing["visible_filters"],
            visible_kpis=existing["visible_kpis"],
            is_default=True,
        )

        logger.info("Set view %s as default for user %s", view_id, user_id)
        updated = preference_repository.get_by_id(user_id, view_id)
        return self._to_model(updated) if updated else None

    # ------------------------------------------------------------------ #
    #  Mapping                                                           #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _to_model(row: dict) -> UserPreferenceView:
        """Map a repository row dict to the API domain model."""
        return UserPreferenceView(
            viewId=row["view_id"],
            userId=row["user_id"],
            generatedViewName=row["generated_view_name"],
            visibleFilters=row["visible_filters"],
            visibleKpis=row["visible_kpis"],
            sourceId=row.get("source_id", "databricks-default"),
            isDefault=row["is_default"],
            createdAt=row.get("created_at"),
            updatedAt=row.get("updated_at"),
        )


# Module-level singleton
preference_service = PreferenceService()
