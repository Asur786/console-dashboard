/**
 * Centralised route paths for the application.
 *
 * Flow: the User Preference page is the landing page. The Dashboard is only
 * reachable via "Save & Continue" or "Open Dashboard" (which pass the selected
 * view configuration through router navigation state).
 */
export const ROUTES = {
  /** Landing page — choose visible filters & KPIs, or open a saved view. */
  PREFERENCES: '/UserPreference',
  /** Dashboard — renders only the filters/KPIs from the selected view. */
  DASHBOARD: '/ExecutiveSummary',
} as const;
