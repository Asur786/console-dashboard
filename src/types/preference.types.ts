/**
 * Types for the User Preference module.
 *
 * Mirrors the backend Pydantic models. The frontend never sends a view name —
 * the backend auto-generates it from the selected filters and KPIs.
 *
 * The available filters and KPIs are NOT defined here — they are fetched at
 * runtime from `GET /api/preferences/schema` (KPIs come live from the gold
 * table), so this module holds no hardcoded lists.
 */

/** Request body for POST/PUT — no view name is ever sent. */
export interface SaveViewPayload {
  visibleFilters: string[];
  visibleKpis: string[];
  sourceId: string;
  isDefault: boolean;
}

/** A single saved view returned by the backend. */
export interface SavedView {
  viewId: string;
  userId: string;
  generatedViewName: string;
  visibleFilters: string[];
  visibleKpis: string[];
  sourceId: string;
  isDefault: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Response envelope for GET /api/preferences/views. */
export interface ViewListResponse {
  views: SavedView[];
}

/**
 * Configuration passed from the User Preference page to the Dashboard via
 * router navigation state. Describes which filters and KPI cards the dashboard
 * should render (values are chosen on the dashboard itself, not here).
 */
export interface DashboardViewConfig {
  visibleFilters: string[];
  visibleKpis: string[];
  sourceId?: string;
  viewId?: string;
  viewName?: string;
}
