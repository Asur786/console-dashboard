"""
GET /api/kpis

Returns the five Performance Summary KPI metrics.
Accepts optional query parameters: channel, category, retailer, country.
"""

import logging

from fastapi import APIRouter, HTTPException, Query
from models.kpis import KpiFilters, KpisResponse
from services.kpi_service import get_kpis

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/kpis", response_model=KpisResponse)
async def kpis_endpoint(
    channel: str = Query("ALL", description="marketdimension.GlobalChannel"),
    category: str = Query("ALL", description="productdimension.Category"),
    retailer: str = Query("ALL", description="marketdimension.GlobalRetailer"),
    country: str = Query("ALL", description="marketdimension.Country"),
) -> KpisResponse:
    filters = KpiFilters(
        channel=channel,
        category=category,
        retailer=retailer,
        country=country,
    )
    try:
        return get_kpis(filters)
    except Exception as exc:
        logger.exception("Failed to load KPIs")
        raise HTTPException(status_code=502, detail=str(exc)) from exc
