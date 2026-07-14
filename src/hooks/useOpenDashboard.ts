import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import type { DashboardViewConfig } from '../types/preference.types';

/**
 * Navigate to the Dashboard while carrying the selected saved-view
 * configuration in router navigation state (no localStorage).
 *
 * Used by both entry points into the dashboard:
 *   - "Save & Continue" (after creating a new view)
 *   - "Open Dashboard" (from an existing saved view card)
 */
export function useOpenDashboard() {
  const navigate = useNavigate();

  return useCallback(
    (config: DashboardViewConfig) => {
      navigate(ROUTES.DASHBOARD, { state: config });
    },
    [navigate],
  );
}
