"""
GET /api/filters

Returns distinct filter dimension values for the dashboard dropdowns.
"""

import logging

from fastapi import APIRouter, HTTPException
from models.filters import FiltersResponse
from services.filter_service import get_filters

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/filters", response_model=FiltersResponse)
async def filters_endpoint() -> FiltersResponse:
    try:
        return get_filters()
    except Exception as exc:
        logger.exception("Failed to load filters")
        raise HTTPException(status_code=502, detail=str(exc)) from exc
