"""
GET /api/kpis

Returns the Performance Summary KPI metrics from the gold KPI table.
Accepts any configured filter dimension as an optional query parameter
(e.g. channel, category, retailer, country, or any custom dimension defined
in settings.FILTER_DIMENSIONS).
"""

import logging

from fastapi import APIRouter, HTTPException, Request
from models.kpis import KpiFilters, KpisResponse
from services.kpi_service import get_kpis

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/kpis", response_model=KpisResponse)
async def kpis_endpoint(request: Request) -> KpisResponse:
    # Any query param is treated as a filter dimension value. 'ALL' (or a
    # missing param) means "no filter" for that dimension.
    selected = {
        key: value
        for key, value in request.query_params.items()
        if value and value != "ALL"
    }
    filters = KpiFilters(filters=selected)
    try:
        return get_kpis(filters)
    except Exception as exc:
        logger.exception("Failed to load KPIs")
        raise HTTPException(status_code=502, detail=str(exc)) from exc
