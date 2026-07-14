/**
 * Types for the User Preference module.
 *
 * Mirrors the backend Pydantic models. The frontend never sends a view name —
 * the backend auto-generates it from the selected filters and KPIs.
 */

/** Filter dimension keys that can be toggled visible. */
export type FilterKey = 'channel' | 'category' | 'retailer' | 'country';

/** KPI card keys that can be toggled visible. */
export type KpiKey =
  | 'dollar_sales'
  | 'volume_sales'
  | 'dollar_share'
  | 'volume_share'
  | 'distribution'
  | 'yoy_growth';

/** Display option (key + human-readable label) for checkbox lists. */
export interface ToggleOption<K extends string> {
  key: K;
  label: string;
}

/** All available filters shown as checkboxes. */
export const AVAILABLE_FILTERS: ToggleOption<FilterKey>[] = [
  { key: 'channel',  label: 'Channel' },
  { key: 'category', label: 'Category' },
  { key: 'retailer', label: 'Retailer' },
  { key: 'country',  label: 'Country' },
];

/** All available KPIs shown as checkboxes. */
export const AVAILABLE_KPIS: ToggleOption<KpiKey>[] = [
  { key: 'dollar_sales', label: 'Dollar Sales' },
  { key: 'volume_sales', label: 'Volume Sales' },
  { key: 'dollar_share', label: 'Dollar Share' },
  { key: 'volume_share', label: 'Volume Share' },
  { key: 'distribution', label: 'Distribution' },
  { key: 'yoy_growth',   label: 'YoY Growth' },
];

/** Request body for POST/PUT — no view name is ever sent. */
export interface SaveViewPayload {
  visibleFilters: FilterKey[];
  visibleKpis: KpiKey[];
  isDefault: boolean;
}

/** A single saved view returned by the backend. */
export interface SavedView {
  viewId: string;
  userId: string;
  generatedViewName: string;
  visibleFilters: FilterKey[];
  visibleKpis: KpiKey[];
  isDefault: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Response envelope for GET /api/preferences/views. */
export interface ViewListResponse {
  views: SavedView[];
}
