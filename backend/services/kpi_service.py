"""
KPI service — returns Performance Summary metrics.

Delegates SQL / mock logic to DatabricksService.
Handles formatting raw numbers into display-ready KpiResult objects.
"""

from datetime import datetime, timezone
from typing import Any

from models.kpis import KpiFilters, KpiResult, KpisResponse
from services.databricks_service import databricks_service


# --------------------------------------------------------------------------- #
#  Formatters                                                                  #
# --------------------------------------------------------------------------- #
def _fmt_dollar(n: float) -> str:
    if n >= 1e9:
        return f"${n / 1e9:.1f}B"
    if n >= 1e6:
        return f"${n / 1e6:.0f}M"
    return f"${n / 1e3:.0f}K"


def _fmt_volume(n: float) -> str:
    if n >= 1e9:
        return f"{n / 1e9:.1f}B"
    if n >= 1e6:
        return f"{n / 1e6:.0f}M"
    return f"{n / 1e3:.0f}K"


def _color(pct: float) -> str:
    if pct > 0:
        return "green"
    if pct < 0:
        return "red"
    return "default"


# --------------------------------------------------------------------------- #
#  Gold rows → KpiResult[] mapper (fully dynamic)                              #
# --------------------------------------------------------------------------- #
def _slug(name: str) -> str:
    return name.strip().lower().replace(" ", "-")


def _fmt_value(value: float, unit: str) -> str:
    """Format a KPI value based on its unit_of_measure from the gold table."""
    u = (unit or "").lower()
    if "%" in u or "percent" in u or "share" in u:
        return f"{value:.1f}%"
    if "currency" in u or "usd" in u or "$" in u or "dollar" in u:
        return _fmt_dollar(value)
    return _fmt_volume(value)


def _build_from_gold(rows: list[dict[str, Any]]) -> list[KpiResult]:
    """Build KPI cards from gold_kpi_summary rows. Whatever KPIs exist in the
    table are returned — adding/removing a KPI needs no code change."""
    results: list[KpiResult] = []
    for r in rows:
        name = str(r.get("kpi_name") or "").strip()
        if not name:
            continue
        cy = float(r.get("current_year_value") or 0)
        py = float(r.get("previous_year_value") or 0)
        yoy = float(r.get("yoy_growth_pct") or 0)
        unit = str(r.get("unit_of_measure") or "")
        results.append(
            KpiResult(
                id=_slug(name),
                label=name,
                value=_fmt_value(cy, unit),
                numeric_value=cy,
                previous_year_value=py,
                yoy_change_percent=yoy,
                sublabel=unit or "GTM",
                value_color=_color(yoy) if yoy else "default",
            )
        )
    return results


# --------------------------------------------------------------------------- #
#  Public API                                                                   #
# --------------------------------------------------------------------------- #
def get_kpis(filters: KpiFilters) -> KpisResponse:
    """Fetch KPIs live from the gold KPI table (fully dynamic) and format."""
    rows = databricks_service.get_gold_kpis(filters.filters)

    return KpisResponse(
        kpis=_build_from_gold(rows),
        last_updated=datetime.now(timezone.utc).isoformat(),
    )
