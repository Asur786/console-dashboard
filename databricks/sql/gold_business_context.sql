-- =============================================================================
-- gold_business_context
-- =============================================================================
-- Purpose  : Static business knowledge table for the Genie AI Insights POC.
--            Defines each KPI that appears on the dashboard: its meaning,
--            thresholds, and recommended narrative responses.
-- Grain    : One row per KPI (6 rows total for POC)
-- Sources  : No transactional data — populated by INSERT statements below.
-- Run in   : Databricks SQL Editor or as a SQL notebook cell
-- =============================================================================

-- CREATE OR REPLACE drops and recreates the table on every run — prevents duplicate rows
-- if the table already exists from a previous run or the PySpark notebook.
CREATE OR REPLACE TABLE workspace.gold.gold_business_context (

  kpi_id                      STRING    NOT NULL  COMMENT 'Unique identifier for the KPI (e.g. KPI_001)',
  kpi_name                    STRING    NOT NULL  COMMENT 'Display name shown on the dashboard (e.g. Dollar Sales)',
  kpi_definition              STRING              COMMENT 'Technical definition: what is measured and from which columns',
  business_meaning            STRING              COMMENT 'Plain-English explanation of what this KPI tells a business user',
  calculation_formula         STRING              COMMENT 'Human-readable formula used to compute this KPI',
  unit_of_measure             STRING              COMMENT 'Unit in which the KPI is expressed (USD, %, KG, units)',
  positive_threshold          DOUBLE              COMMENT 'YoY growth % above this value = positive/strong performance',
  negative_threshold          DOUBLE              COMMENT 'YoY growth % below this value = negative/declining performance',
  recommendation_if_positive  STRING              COMMENT 'Narrative template Genie uses when KPI is performing well',
  recommendation_if_negative  STRING              COMMENT 'Narrative template Genie uses when KPI is underperforming',
  genie_guidance              STRING              COMMENT 'Explicit instruction to Genie on how to interpret, compare, and narrate this KPI',
  updated_at                  TIMESTAMP           COMMENT 'Timestamp of last INSERT/UPDATE'

)
USING DELTA
COMMENT 'Static KPI business knowledge base for Genie AI Insights. No transactional data dependency.'
TBLPROPERTIES (
  'layer'   = 'gold',
  'purpose' = 'genie-business-context'
);


-- =============================================================================
-- Populate business knowledge rows
-- One row per KPI currently displayed on the Executive Summary dashboard
-- =============================================================================

INSERT INTO workspace.gold.gold_business_context VALUES

-- ── KPI 1: Dollar Sales ────────────────────────────────────────────────────
(
  'KPI_001',
  'Dollar Sales',
  'Sum of CurrentYearDollarSales from r12mfact / qtdfact / ytdfact, '
  || 'filtered by selected Channel, Category, Retailer, and Country.',
  'Total revenue generated in USD for the selected market and product combination. '
  || 'This is the primary headline KPI and the first number executives look at.',
  'SUM(CurrentYearDollarSales)',
  'USD',
  10.0,   -- > 10% YoY growth = strong positive performance
  -2.0,   -- < -2% YoY growth = declining performance
  'Dollar Sales are growing strongly. Sustain momentum by protecting distribution '
  || 'in high-performing channels and exploring expansion into adjacent markets.',
  'Dollar Sales are declining. Investigate pricing competitiveness, distribution losses, '
  || 'and whether key retailers or channels are underperforming.',
  'Always state the current_year_value, compare it to previous_year_value, and compute yoy_growth_pct. '
  || 'If yoy_growth_pct > 10, describe performance as strong growth. '
  || 'If yoy_growth_pct < -2, flag as declining and recommend investigation of distribution and pricing. '
  || 'Join with gold_kpi_summary on kpi_name = ''Dollar Sales'' to retrieve values.',
  CURRENT_TIMESTAMP()
),

-- ── KPI 2: Volume Sales ────────────────────────────────────────────────────
(
  'KPI_002',
  'Volume Sales',
  'Sum of CurrentYearVolumeSales from r12mfact / qtdfact / ytdfact — '
  || 'physical quantity sold in kg or equivalent unit.',
  'Physical volume of product sold, independent of price. '
  || 'When Volume Sales diverge from Dollar Sales, it signals a pricing or product mix shift.',
  'SUM(CurrentYearVolumeSales)',
  'KG or equivalent',
  8.0,    -- > 8% YoY volume growth = strong physical offtake
  -2.0,
  'Volume is growing — consumers are buying more product. '
  || 'Protect shelf space and ensure supply chain capacity is sufficient to meet demand.',
  'Volume is declining. Check for consumer trade-down to smaller pack sizes, '
  || 'competitive product launches, or distribution gaps limiting availability.',
  'Compare current_year_value (volume) with previous_year_value and compute yoy_growth_pct. '
  || 'If Dollar Sales grow but Volume Sales decline, surface a pricing or mix narrative: '
  || 'the business is generating more revenue per unit sold (premiumization). '
  || 'Join with gold_kpi_summary on kpi_name = ''Volume Sales''.',
  CURRENT_TIMESTAMP()
),

-- ── KPI 3: Dollar Share ────────────────────────────────────────────────────
(
  'KPI_003',
  'Dollar Share',
  'Filtered CY Dollar Sales divided by Total CY Dollar Sales across all markets and products, '
  || 'expressed as a percentage.',
  'This segment''s revenue contribution as a percentage of total portfolio revenue. '
  || 'A rising share means this segment is growing faster than the market average.',
  'SUM(filtered.CY_Dollar_Sales) / SUM(total.CY_Dollar_Sales) × 100',
  '%',
  1.0,    -- > +1 percentage point gain = positive share momentum
  -0.5,   -- < -0.5 pp loss = declining share position
  'Dollar Share is gaining. The segment is outperforming the broader portfolio. '
  || 'Identify which channel or retailer is driving share growth and amplify investment.',
  'Dollar Share is declining. The segment is growing slower than the market average. '
  || 'Review whether a specific channel, retailer, or geography is losing ground.',
  'Report current_year_value as the share percentage. '
  || 'Compare with Volume Share (kpi_name = ''Volume Share''): if Dollar Share > Volume Share, the segment commands a price premium. '
  || 'If Dollar Share < Volume Share, the segment is priced below market average. '
  || 'Always state whether share is gaining or losing vs prior period.',
  CURRENT_TIMESTAMP()
),

-- ── KPI 4: Volume Share ────────────────────────────────────────────────────
(
  'KPI_004',
  'Volume Share',
  'Filtered CY Volume Sales divided by Total CY Volume Sales across all markets, '
  || 'expressed as a percentage.',
  'This segment''s physical volume as a percentage of total volume sold. '
  || 'Comparing Volume Share with Dollar Share reveals price positioning: '
  || 'if Dollar Share > Volume Share, the segment commands a price premium.',
  'SUM(filtered.CY_Volume_Sales) / SUM(total.CY_Volume_Sales) × 100',
  '%',
  1.0,    -- > +1 pp gain = positive volume share momentum
  -0.5,
  'Volume Share is gaining — physical presence is expanding. '
  || 'If Dollar Share is also growing, this indicates both volume and value improvement.',
  'Volume Share is declining. Physical presence is shrinking relative to the market. '
  || 'Investigate distribution coverage, promotional intensity, and shelf space allocation.',
  'Report current_year_value as the volume share percentage. '
  || 'Always compare Volume Share with Dollar Share from the same filter combination. '
  || 'If volume share > dollar share, the segment sells below market average price. '
  || 'If dollar share > volume share, the segment commands a premium price positioning.',
  CURRENT_TIMESTAMP()
),

-- ── KPI 5: Distribution ────────────────────────────────────────────────────
(
  'KPI_005',
  'Distribution',
  'Count of distinct markets with KPIIndicator = 1 divided by '
  || 'total distinct markets in the selected filter, expressed as a percentage.',
  'The percentage of measured market outlets where this product is present and selling. '
  || 'Distribution is a leading indicator — it drives future sales performance. '
  || 'A loss of distribution today predicts a sales decline in the next period.',
  'COUNT(DISTINCT MarketId WHERE KPIIndicator=1) / COUNT(DISTINCT MarketId) × 100',
  '%',
  2.0,    -- > 2 pp distribution gain = expanding presence
  -1.0,   -- < -1 pp = at-risk de-listing situation
  'Distribution is expanding — the product is gaining presence in new markets or outlets. '
  || 'Ensure supply chain is ready to service new listings and monitor rate-of-sale in new markets.',
  'Distribution is contracting. The product may be losing shelf space or being de-listed. '
  || 'Urgently engage with key retailers and review range review calendars.',
  'Distribution is a leading indicator. Report current_year_value as the distribution percentage. '
  || 'If distribution is declining AND Dollar Sales are declining, root cause is likely physical de-listing. '
  || 'If distribution is stable but Dollar Sales are declining, investigate rate-of-sale (consumers buying less per visit). '
  || 'Distribution above 80% indicates strong presence; below 50% indicates significant risk.',
  CURRENT_TIMESTAMP()
),

-- ── KPI 6: YoY Growth ─────────────────────────────────────────────────────
(
  'KPI_006',
  'YoY Growth',
  '(CurrentYearDollarSales minus PreviousYearDollarSales) '
  || 'divided by PreviousYearDollarSales, expressed as a percentage.',
  'Year-over-Year percentage change in dollar revenue. '
  || 'The primary performance diagnostic: tells whether the business is growing or declining '
  || 'versus the same period last year on a like-for-like basis.',
  '(SUM(CY_Dollar_Sales) - SUM(PY_Dollar_Sales)) / SUM(PY_Dollar_Sales) × 100',
  '%',
  10.0,   -- > 10% = strong growth
  -2.0,   -- < -2% = declining — requires investigation
  'Strong year-on-year growth. Business momentum is positive. '
  || 'Attribute growth to the best-performing channel, country, or category in the selected view '
  || 'and protect the drivers of that growth.',
  'Year-on-year decline. Investigate root causes: '
  || '(1) Is distribution declining? (2) Is rate-of-sale falling? '
  || '(3) Is a specific market or channel dragging overall performance? '
  || '(4) Is pricing or promotional strategy out of step with competitors?',
  'YoY Growth is the primary headline diagnostic. Lead every performance summary with this metric. '
  || 'Report current_year_value as the YoY growth percentage. '
  || 'If positive: attribute to the strongest channel, country, or category in the filtered data. '
  || 'If negative: investigate distribution (kpi_name = ''Distribution''), then rate-of-sale, then pricing. '
  || 'Growth above 10% = strong. 2-10% = moderate. -2% to +2% = stable. Below -2% = declining.',
  CURRENT_TIMESTAMP()
);


-- =============================================================================
-- Verify
-- =============================================================================
SELECT
  kpi_id,
  kpi_name,
  unit_of_measure,
  positive_threshold,
  negative_threshold
FROM workspace.gold.gold_business_context
ORDER BY kpi_id;
