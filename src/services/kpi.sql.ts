import type { KpiFilters } from '../types/kpi.types';
import { SqlQueryBuilder, applyDashboardFilters } from './sql-builder';
import type { SqlBuildResult } from './sql-builder';

/**
 * SQL query builder for Performance Summary KPIs.
 *
 * Uses the generic SqlQueryBuilder to produce a parameterized query
 * with two CTEs (filtered + total) that returns all five metrics.
 *
 * Schema mapping:
 * ───────────────────────────────────────────────────────────────────
 * Dollar Sales   SUM(f.CurrentYearDollarSales)
 * Dollar Share   SUM(filtered CY$) / SUM(total-market CY$) × 100
 * Volume Share   SUM(filtered CYVol) / SUM(total-market CYVol) × 100
 * Distribution   COUNT(DISTINCT filtered MarketID where KPIIndicator=1)
 *                / COUNT(DISTINCT total MarketID) × 100
 * YoY Growth     (SUM(CY$) − SUM(PY$)) / SUM(PY$) × 100
 * ───────────────────────────────────────────────────────────────────
 *
 * Filter columns (applied via applyDashboardFilters):
 *   Channel  → marketdimension.GlobalChannel
 *   Category → productdimension.Category
 *   Retailer → marketdimension.GlobalRetailer
 *   Country  → marketdimension.Country
 */

/* ------------------------------------------------------------------ */
/*  Filtered CTE — uses parameterized WHERE conditions                 */
/* ------------------------------------------------------------------ */
function buildFilteredCte(filters: KpiFilters): SqlBuildResult {
  const builder = new SqlQueryBuilder()
    .select([
      'SUM(f.CurrentYearDollarSales)  AS cy_dollar_sales',
      'SUM(f.PreviousYearDollarSales) AS py_dollar_sales',
      'SUM(f.CurrentYearVolumeSales)  AS cy_volume_sales',
      'SUM(f.PreviousYearVolumeSales) AS py_volume_sales',
      'COUNT(DISTINCT CASE WHEN m.KPIIndicator = 1 THEN m.MarketId END) AS dist_present_markets',
    ])
    .from('r12mfact f')
    .join('marketdimension m', 'f.MarketID = m.MarketId')
    .join('productdimension p', 'f.ProductID = p.ProductId');

  applyDashboardFilters(builder, filters);

  return builder.build();
}

/* ------------------------------------------------------------------ */
/*  Total-market CTE — no filter predicates                            */
/* ------------------------------------------------------------------ */
const TOTAL_CTE_SQL = `  SELECT
    SUM(f.CurrentYearDollarSales)  AS total_cy_dollar_sales,
    SUM(f.CurrentYearVolumeSales)  AS total_cy_volume_sales,
    COUNT(DISTINCT m.MarketId)     AS total_markets
  FROM r12mfact f
  JOIN marketdimension m   ON f.MarketID  = m.MarketId
  JOIN productdimension p  ON f.ProductID = p.ProductId`;

/* ------------------------------------------------------------------ */
/*  Final SELECT — computes share / distribution / YoY from CTEs       */
/* ------------------------------------------------------------------ */
const FINAL_SELECT = [
  'filtered.cy_dollar_sales',
  'filtered.py_dollar_sales',
  `CASE
    WHEN total.total_cy_dollar_sales > 0
    THEN ROUND(filtered.cy_dollar_sales / total.total_cy_dollar_sales * 100, 1)
    ELSE 0
  END AS dollar_share`,
  `CASE
    WHEN total.total_cy_volume_sales > 0
    THEN ROUND(filtered.cy_volume_sales / total.total_cy_volume_sales * 100, 1)
    ELSE 0
  END AS volume_share`,
  `CASE
    WHEN total.total_markets > 0
    THEN ROUND(filtered.dist_present_markets * 1.0 / total.total_markets * 100, 1)
    ELSE 0
  END AS distribution`,
  `CASE
    WHEN filtered.py_dollar_sales > 0
    THEN ROUND((filtered.cy_dollar_sales - filtered.py_dollar_sales) / filtered.py_dollar_sales * 100, 1)
    ELSE 0
  END AS yoy_growth`,
  'filtered.cy_volume_sales',
  'filtered.py_volume_sales',
];

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Builds a parameterized SQL query for all five KPIs.
 * Returns the SQL string and an array of Databricks-native parameters.
 */
export function buildPerformanceSummarySQL(filters: KpiFilters): SqlBuildResult {
  const filteredCte = buildFilteredCte(filters);

  const outer = new SqlQueryBuilder()
    .withCte('filtered', filteredCte.sql)
    .withCte('total', TOTAL_CTE_SQL)
    .select(FINAL_SELECT)
    .from('filtered')
    .crossJoin('total');

  const result = outer.build();

  return {
    sql: result.sql,
    params: filteredCte.params,  // only the filtered CTE has params
  };
}
