import { useState, useCallback, useMemo } from 'react';
import { dashboardService } from '../services/dashboard.service';
import type { DashboardFilters, DashboardData, FilterOptions } from '../types/dashboard.types';

const DEFAULT_FILTERS: DashboardFilters = {
  country: 'ALL',
  category: 'ALL',
  brand: 'ALL',
  timeframe: 'R12M',
  periodMonth: 'ALL',
};

export function useDashboard() {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const data: DashboardData | null = useMemo(
    () => dashboardService.getDashboardData(filters),
    [filters]
  );

  const filterOptions: FilterOptions = useMemo(
    () => dashboardService.getFilterOptions(),
    []
  );

  const updateFilter = useCallback(
    <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
      setFilters(prev => ({
        ...prev,
        [key]: value,
        // Reset brand when category changes
        ...(key === 'category' ? { brand: 'ALL' } : {}),
      }));
    },
    []
  );

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  return { filters, data, filterOptions, updateFilter, resetFilters };
}
