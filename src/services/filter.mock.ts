/**
 * Mock data derived from the database schema.
 *
 * Schema column mapping
 * ─────────────────────────────────────────────────────────────────────
 * Channel   → marketdimension.GlobalChannel  (distinct values)
 *             geodimension.intnl_chnl_val    (international channel)
 *             geodimension.order_channel     (ordered channel label)
 *
 * Category  → productdimension.Category      (product category hierarchy)
 *
 * Retailer  → marketdimension.GlobalRetailer (global retailer name)
 *             geodimension.intnl_rtlr_val    (international retailer value)
 *             geodimension.bnrr_val          (banner value)
 *
 * Country   → marketdimension.Country        (country name)
 *             geodimension.ctry_val          (country value / code)
 * ─────────────────────────────────────────────────────────────────────
 *
 * Replace the arrays below with real DISTINCT queries against these
 * columns once the Databricks API is connected.
 */

/**
 * marketdimension.GlobalChannel  /  geodimension.intnl_chnl_val
 */
export const MOCK_CHANNELS: string[] = [
  'Modern Trade',
  'Traditional Trade',
  'E-Commerce',
  'Convenience',
  'Foodservice',
  'Cash & Carry',
];

/**
 * productdimension.Category
 */
export const MOCK_CATEGORIES: string[] = [
  'Beverages',
  'Snacks',
  'Dairy',
  'Personal Care',
  'Household',
];

/**
 * marketdimension.GlobalRetailer  /  geodimension.intnl_rtlr_val
 */
export const MOCK_RETAILERS: string[] = [
  'Walmart',
  'Tesco',
  'Amazon',
  'Carrefour',
  'REWE',
  'Woolworths',
  'Sainsbury',
  'Aldi',
  'Lidl',
  'Target',
];

/**
 * marketdimension.Country  /  geodimension.ctry_val
 */
export const MOCK_COUNTRIES: string[] = [
  'United States',
  'United Kingdom',
  'Germany',
  'France',
  'Australia',
  'Canada',
  'Netherlands',
  'Spain',
];
