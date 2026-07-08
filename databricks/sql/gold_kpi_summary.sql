-- =============================================================================
-- gold_kpi_summary  (v2 — Genie-ready)
-- =============================================================================
-- Changes from v1:
--   1. cy_ / py_ renamed to current_year_ / previous_year_
--   2. Unpivoted to TALL format — one row per (filter_combo, KPI)
--   3. kpi_id + kpi_name added → direct JOIN key to gold_business_context
--   4. unit_of_measure added per KPI row
-- Grain    : (time_frame, country, global_channel, global_retailer,
--             category, brand, kpi_name)
-- Sources  : r12mfact | qtdfact | ytdfact × marketdimension × productdimension
-- Run in   : Databricks SQL Editor or as a SQL notebook cell
-- =============================================================================

-- NOTE: TBLPROPERTIES removed from CREATE AS SELECT — causes empty table on Databricks SQL Serverless.
-- Run the ALTER statements at the bottom after the table is created if needed.
CREATE OR REPLACE TABLE workspace.gold.gold_kpi_summary
AS

-- ----------------------------------------------------------------------------
-- CTE 1: fact_union
-- Stack the three time-frame fact tables into one relation and tag each row
-- with a time_frame label so Genie can filter by reporting period.
-- ----------------------------------------------------------------------------
WITH fact_union AS (

  -- Rolling 12 Months
  SELECT
    'R12M'                                      AS time_frame,
    MarketID,
    ProductID,
    PeriodMonth,
    CAST(CurrentYearDollarSales  AS DOUBLE)     AS current_year_dollar_sales,
    CAST(PreviousYearDollarSales AS DOUBLE)     AS previous_year_dollar_sales,
    CAST(CurrentYearVolumeSales  AS DOUBLE)     AS current_year_volume_sales,
    CAST(PreviousYearVolumeSales AS DOUBLE)     AS previous_year_volume_sales,
    CAST(CurrentYearUnitSales    AS DOUBLE)     AS current_year_unit_sales,
    CAST(PreviousYearUnitSales   AS DOUBLE)     AS previous_year_unit_sales,
    CAST(CurrentYearValueSales   AS DOUBLE)     AS current_year_value_sales,
    CAST(PreviousYearValueSales  AS DOUBLE)     AS previous_year_value_sales
  FROM workspace.default.r12mfact

  UNION ALL

  -- Quarter-to-Date
  SELECT
    'QTD'                                       AS time_frame,
    MarketID, ProductID, PeriodMonth,
    CAST(CurrentYearDollarSales  AS DOUBLE),
    CAST(PreviousYearDollarSales AS DOUBLE),
    CAST(CurrentYearVolumeSales  AS DOUBLE),
    CAST(PreviousYearVolumeSales AS DOUBLE),
    CAST(CurrentYearUnitSales    AS DOUBLE),
    CAST(PreviousYearUnitSales   AS DOUBLE),
    CAST(CurrentYearValueSales   AS DOUBLE),
    CAST(PreviousYearValueSales  AS DOUBLE)
  FROM workspace.default.qtdfact

  UNION ALL

  -- Year-to-Date
  SELECT
    'YTD'                                       AS time_frame,
    MarketID, ProductID, PeriodMonth,
    CAST(CurrentYearDollarSales  AS DOUBLE),
    CAST(PreviousYearDollarSales AS DOUBLE),
    CAST(CurrentYearVolumeSales  AS DOUBLE),
    CAST(PreviousYearVolumeSales AS DOUBLE),
    CAST(CurrentYearUnitSales    AS DOUBLE),
    CAST(PreviousYearUnitSales   AS DOUBLE),
    CAST(CurrentYearValueSales   AS DOUBLE),
    CAST(PreviousYearValueSales  AS DOUBLE)
  FROM workspace.default.ytdfact
),

-- ----------------------------------------------------------------------------
-- CTE 2: enriched
-- Attach market and product attributes to every fact row.
-- LEFT JOINs preserve all fact rows even if a dimension key is missing.
-- ----------------------------------------------------------------------------
enriched AS (
  SELECT
    fu.time_frame,
    fu.PeriodMonth                              AS period_month,

    -- Market dimension attributes (the "Where")
    m.Country                                   AS country,
    m.RegionName                                AS region_name,
    m.GlobalChannel                             AS global_channel,
    m.GlobalRetailer                            AS global_retailer,
    m.MarketType                                AS market_type,
    m.KPIIndicator,                             -- 1 = market is in measured universe
    fu.MarketID,

    -- Product dimension attributes (the "What")
    p.Category                                  AS category,
    p.Manufacturer                              AS manufacturer,
    p.Brand                                     AS brand,
    p.Segment                                   AS segment,

    -- Sales metrics (current_year_ / previous_year_ naming)
    fu.current_year_dollar_sales,
    fu.previous_year_dollar_sales,
    fu.current_year_volume_sales,
    fu.previous_year_volume_sales,
    fu.current_year_unit_sales,
    fu.previous_year_unit_sales,
    fu.current_year_value_sales,
    fu.previous_year_value_sales

  FROM fact_union fu
  LEFT JOIN workspace.default.marketdimension  m ON fu.MarketID  = m.MarketId
  LEFT JOIN workspace.default.productdimension p ON fu.ProductID = p.ProductId
),

-- ----------------------------------------------------------------------------
-- CTE 3: aggregated
-- Roll up to the dashboard filter grain:
--   (time_frame, country, global_channel, global_retailer, category, brand)
-- This matches exactly the dimensions exposed on the dashboard filter bar.
-- ----------------------------------------------------------------------------
aggregated AS (
  SELECT
    time_frame,
    country,
    region_name,
    global_channel,
    global_retailer,
    market_type,
    category,
    manufacturer,
    brand,
    segment,

    MAX(period_month)                           AS period_month,

    -- ---- Current Year totals ----
    SUM(current_year_dollar_sales)              AS current_year_dollar_sales,
    SUM(current_year_volume_sales)              AS current_year_volume_sales,
    SUM(current_year_unit_sales)                AS current_year_unit_sales,
    SUM(current_year_value_sales)               AS current_year_value_sales,

    -- ---- Previous Year totals (denominator for YoY) ----
    SUM(previous_year_dollar_sales)             AS previous_year_dollar_sales,
    SUM(previous_year_volume_sales)             AS previous_year_volume_sales,
    SUM(previous_year_unit_sales)               AS previous_year_unit_sales,
    SUM(previous_year_value_sales)              AS previous_year_value_sales,

    -- ---- Distribution numerator ----
    -- Count distinct markets that have KPIIndicator = 1
    -- (market is present/listed in the measured universe)
    COUNT(DISTINCT CASE WHEN KPIIndicator = 1
                        THEN MarketID END)      AS dist_present_markets,

    -- ---- Distribution denominator ----
    COUNT(DISTINCT MarketID)                    AS total_market_count

  FROM enriched
  GROUP BY
    time_frame, country, region_name, global_channel, global_retailer,
    market_type, category, manufacturer, brand, segment
),

-- ----------------------------------------------------------------------------
-- CTE 4: with_totals
-- Add grand totals per time_frame using window functions.
-- These totals are the denominators for Dollar Share and Volume Share.
-- A window over the entire time_frame partition replicates the "total CTE"
-- pattern from the dashboard SQL.
-- ----------------------------------------------------------------------------
with_totals AS (
  SELECT
    *,
    SUM(current_year_dollar_sales) OVER (PARTITION BY time_frame) AS grand_total_current_year_dollar_sales,
    SUM(current_year_volume_sales) OVER (PARTITION BY time_frame) AS grand_total_current_year_volume_sales
  FROM aggregated
),

-- ============================================================================
-- COMPUTED WIDE TABLE — source for the unpivot below
-- All KPI columns are in full business-friendly names
-- ============================================================================
wide AS (
  SELECT
    time_frame, period_month, country, region_name, global_channel,
    global_retailer, market_type, category, manufacturer, brand, segment,

    ROUND(current_year_dollar_sales,  2) AS current_year_dollar_sales,
    ROUND(previous_year_dollar_sales, 2) AS previous_year_dollar_sales,
    ROUND(current_year_volume_sales,  2) AS current_year_volume_sales,
    ROUND(previous_year_volume_sales, 2) AS previous_year_volume_sales,
    ROUND(current_year_unit_sales,    2) AS current_year_unit_sales,
    ROUND(previous_year_unit_sales,   2) AS previous_year_unit_sales,

    -- YoY Growth %: (current_year - previous_year) / previous_year × 100
    CASE WHEN previous_year_dollar_sales > 0
      THEN ROUND((current_year_dollar_sales - previous_year_dollar_sales)
                 / previous_year_dollar_sales * 100, 2)
      ELSE NULL END AS dollar_sales_yoy_growth_pct,

    CASE WHEN previous_year_volume_sales > 0
      THEN ROUND((current_year_volume_sales - previous_year_volume_sales)
                 / previous_year_volume_sales * 100, 2)
      ELSE NULL END AS volume_yoy_growth_pct,

    -- Share %: this row / grand total × 100
    CASE WHEN grand_total_current_year_dollar_sales > 0
      THEN ROUND(current_year_dollar_sales / grand_total_current_year_dollar_sales * 100, 2)
      ELSE 0.0 END AS dollar_share_pct,

    CASE WHEN grand_total_current_year_volume_sales > 0
      THEN ROUND(current_year_volume_sales / grand_total_current_year_volume_sales * 100, 2)
      ELSE 0.0 END AS volume_share_pct,

    -- Distribution %
    CASE WHEN total_market_count > 0
      THEN ROUND(dist_present_markets * 1.0 / total_market_count * 100, 2)
      ELSE 0.0 END AS distribution_pct,

    -- Trend Indicator based on Dollar Sales YoY
    CASE
      WHEN previous_year_dollar_sales > 0
        AND (current_year_dollar_sales - previous_year_dollar_sales)
            / previous_year_dollar_sales * 100 >  2 THEN 'Increasing'
      WHEN previous_year_dollar_sales > 0
        AND (current_year_dollar_sales - previous_year_dollar_sales)
            / previous_year_dollar_sales * 100 < -2 THEN 'Declining'
      ELSE 'Stable'
    END AS trend_indicator
  FROM with_totals
)

-- ============================================================================
-- UNPIVOT — 6 KPI rows per filter combination
-- kpi_name is the JOIN key to workspace.gold.gold_business_context
-- ============================================================================

-- KPI 1: Dollar Sales
SELECT
  time_frame, period_month,
  country, region_name, global_channel, global_retailer, market_type,
  category, manufacturer, brand, segment,
  'KPI_001'           AS kpi_id,
  'Dollar Sales'      AS kpi_name,
  'Currency (USD)'    AS unit_of_measure,
  current_year_dollar_sales    AS current_year_value,
  previous_year_dollar_sales   AS previous_year_value,
  dollar_sales_yoy_growth_pct  AS yoy_growth_pct,
  dollar_share_pct             AS share_pct,
  trend_indicator,
  CURRENT_TIMESTAMP()          AS updated_at
FROM wide

UNION ALL

-- KPI 2: Volume Sales
SELECT
  time_frame, period_month,
  country, region_name, global_channel, global_retailer, market_type,
  category, manufacturer, brand, segment,
  'KPI_002', 'Volume Sales', 'Volume (KG or equivalent)',
  current_year_volume_sales, previous_year_volume_sales,
  volume_yoy_growth_pct, volume_share_pct, trend_indicator, CURRENT_TIMESTAMP()
FROM wide

UNION ALL

-- KPI 3: Dollar Share
SELECT
  time_frame, period_month,
  country, region_name, global_channel, global_retailer, market_type,
  category, manufacturer, brand, segment,
  'KPI_003', 'Dollar Share', 'Percentage (%)',
  dollar_share_pct, NULL, NULL, dollar_share_pct, trend_indicator, CURRENT_TIMESTAMP()
FROM wide

UNION ALL

-- KPI 4: Volume Share
SELECT
  time_frame, period_month,
  country, region_name, global_channel, global_retailer, market_type,
  category, manufacturer, brand, segment,
  'KPI_004', 'Volume Share', 'Percentage (%)',
  volume_share_pct, NULL, NULL, volume_share_pct, trend_indicator, CURRENT_TIMESTAMP()
FROM wide

UNION ALL

-- KPI 5: Distribution
SELECT
  time_frame, period_month,
  country, region_name, global_channel, global_retailer, market_type,
  category, manufacturer, brand, segment,
  'KPI_005', 'Distribution', 'Percentage (%)',
  distribution_pct, NULL, NULL, NULL, trend_indicator, CURRENT_TIMESTAMP()
FROM wide

UNION ALL

-- KPI 6: YoY Growth
SELECT
  time_frame, period_month,
  country, region_name, global_channel, global_retailer, market_type,
  category, manufacturer, brand, segment,
  'KPI_006', 'YoY Growth', 'Percentage (%)',
  dollar_sales_yoy_growth_pct, NULL, dollar_sales_yoy_growth_pct, NULL,
  trend_indicator, CURRENT_TIMESTAMP()
FROM wide;

-- =============================================================================
-- Verify — run after the CTAS above completes
-- Expected: 6 rows (one per KPI), each with same row count
-- =============================================================================
SELECT kpi_name, unit_of_measure, COUNT(*) AS rows
FROM workspace.gold.gold_kpi_summary
GROUP BY kpi_name, unit_of_measure
ORDER BY kpi_name;
