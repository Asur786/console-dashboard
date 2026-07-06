/**
 * KPI service types.
 *
 * Schema column mapping — each KPI maps to specific fact-table columns:
 * ───────────────────────────────────────────────────────────────────────
 * Dollar Sales   SUM(fact.CurrentYearDollarSales)
 *                SUM(fact.PreviousYearDollarSales)
 *
 * Dollar Share   SUM(filtered CurrentYearDollarSales)
 *                / SUM(total-market CurrentYearDollarSales) × 100
 *
 * Volume Share   SUM(filtered CurrentYearVolumeSales)
 *                / SUM(total-market CurrentYearVolumeSales) × 100
 *
 * Distribution   COUNT(DISTINCT MarketID WHERE KPIIndicator = 1)
 *                / COUNT(DISTINCT MarketID in total market) × 100
 *                Source: marketdimension.KPIIndicator
 *
 * YoY Growth     (SUM(CurrentYearDollarSales) - SUM(PreviousYearDollarSales))
 *                / SUM(PreviousYearDollarSales) × 100
 *
 * Fact tables:   lfqfact | lqpfact | qtdfact | r12mfact | r13pfact
 * Dimensions:    marketdimension (join on MarketID)
 *                productdimension (join on ProductID)
 *                geodimension (join via Geo_Channel_Id)
 * ───────────────────────────────────────────────────────────────────────
 */

/** The filter payload sent to the service. */
export interface KpiFilters {
  channel: string;   // 'ALL' | marketdimension.GlobalChannel
  category: string;  // 'ALL' | productdimension.Category
  retailer: string;  // 'ALL' | marketdimension.GlobalRetailer
  country: string;   // 'ALL' | marketdimension.Country
}

/** A single KPI metric returned by the service. */
export interface KpiResult {
  id: string;
  label: string;
  /** Pre-formatted display value (e.g. "$4.8B", "51.2%") */
  value: string;
  /** Raw numeric value — useful for conditional formatting / sorting */
  numericValue: number;
  /** Previous-year raw numeric value */
  previousYearValue: number;
  /** Year-over-year change as a percentage */
  yoyChangePercent: number;
  /** Sub-label shown below the value (e.g. "GTM") */
  sublabel: string;
  /** Colour hint for the rendered card */
  valueColor: 'default' | 'green' | 'red';
}

/** The full response from getPerformanceSummary(). */
export interface PerformanceSummary {
  kpis: KpiResult[];
  /** ISO-8601 timestamp when the data was last refreshed */
  lastUpdated: string;
}
