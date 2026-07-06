import { useState, useEffect } from 'react';
import { filterService } from '../services/filter.service';
import type { DashboardFilterOptions, FilterOption } from '../types/filter.types';

const EMPTY: DashboardFilterOptions = {
  channels:   [],
  categories: [],
  retailers:  [],
  countries:  [],
};

interface UseFiltersResult {
  filterOptions: DashboardFilterOptions;
  filterOptionsLoading: boolean;
}

/**
 * Loads all filter dimension values from FilterService in parallel.
 * The returned options are ready to pass directly to <FilterDropdown>.
 */
export function useFilters(): UseFiltersResult {
  const [options, setOptions]   = useState<DashboardFilterOptions>(EMPTY);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all<FilterOption[]>([
      filterService.getChannels(),
      filterService.getCategories(),
      filterService.getRetailers(),
      filterService.getCountries(),
    ]).then(([channels, categories, retailers, countries]) => {
      if (!cancelled) {
        setOptions({ channels, categories, retailers, countries });
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  return { filterOptions: options, filterOptionsLoading: loading };
}
