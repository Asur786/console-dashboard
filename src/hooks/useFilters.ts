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

    const loadFilters = async () => {
      try {
        const [channels, categories, retailers, countries] = await Promise.all<FilterOption[]>([
          filterService.getChannels(),
          filterService.getCategories(),
          filterService.getRetailers(),
          filterService.getCountries(),
        ]);
        if (!cancelled) {
          setOptions({ channels, categories, retailers, countries });
          setLoading(false);
        }
      } catch {
        // If first load fails (cold start), retry once after a short delay
        if (!cancelled) {
          try {
            const [channels, categories, retailers, countries] = await Promise.all<FilterOption[]>([
              filterService.getChannels(),
              filterService.getCategories(),
              filterService.getRetailers(),
              filterService.getCountries(),
            ]);
            if (!cancelled) {
              setOptions({ channels, categories, retailers, countries });
              setLoading(false);
            }
          } catch {
            // Both attempts failed — stop loading to unblock UI
            if (!cancelled) setLoading(false);
          }
        }
      }
    };

    loadFilters();

    return () => { cancelled = true; };
  }, []);

  return { filterOptions: options, filterOptionsLoading: loading };
}
