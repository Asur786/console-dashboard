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


def _fmt_pct(n: float) -> str:
    sign = "+" if n > 0 else ""
    return f"{sign}{n:.1f}%"


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
#  Raw dict → KpiResult[] mapper                                               #
# --------------------------------------------------------------------------- #
def _build_kpi_results(raw: dict[str, Any]) -> list[KpiResult]:
    """Convert the raw dict from DatabricksService into display-ready KPIs."""
    cy_dollar = float(raw.get("cy_dollar_sales", 0))
    py_dollar = float(raw.get("py_dollar_sales", 0))
    cy_vol = float(raw.get("cy_volume_sales", 0))
    py_vol = float(raw.get("py_volume_sales", 0))
    dollar_share = float(raw.get("dollar_share", 0))
    volume_share = float(raw.get("volume_share", 0))
    distribution = float(raw.get("distribution", 0))
    yoy_growth = float(raw.get("yoy_growth", 0))

    dollar_yoy = (
        round((cy_dollar - py_dollar) / py_dollar * 100, 1) if py_dollar else 0
    )
    vol_yoy = round((cy_vol - py_vol) / py_vol * 100, 1) if py_vol else 0

    # Approximate PY dollar share from the same ratio
    dollar_share_py = (
        round(dollar_share * (py_dollar / cy_dollar), 1) if cy_dollar else 0
    )
    dsh_yoy = round(dollar_share - dollar_share_py, 1)

    return [
        KpiResult(
            id="dollar-sales",
            label="Dollar Sales",
            value=_fmt_dollar(cy_dollar),
            numeric_value=cy_dollar,
            previous_year_value=py_dollar,
            yoy_change_percent=dollar_yoy,
            sublabel="GTM",
            value_color=_color(dollar_yoy),
        ),
        KpiResult(
            id="dollar-share",
            label="Dollar Share",
            value=f"{dollar_share}%",
            numeric_value=dollar_share,
            previous_year_value=dollar_share_py,
            yoy_change_percent=dsh_yoy,
            sublabel="GTM",
            value_color=_color(dsh_yoy),
        ),
        KpiResult(
            id="volume-share",
            label="Volume Share",
            value=_fmt_volume(cy_vol),
            numeric_value=cy_vol,
            previous_year_value=py_vol,
            yoy_change_percent=vol_yoy,
            sublabel="GTM",
            value_color="default",
        ),
        KpiResult(
            id="distribution",
            label="Distribution",
            value=f"{distribution}%",
            numeric_value=distribution,
            previous_year_value=0,
            yoy_change_percent=0,
            sublabel="GTM",
            value_color="default",
        ),
        KpiResult(
            id="yoy-growth",
            label="YoY Growth",
            value=_fmt_pct(yoy_growth),
            numeric_value=yoy_growth,
            previous_year_value=0,
            yoy_change_percent=yoy_growth,
            sublabel="GTM",
            value_color=_color(yoy_growth),
        ),
    ]


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
