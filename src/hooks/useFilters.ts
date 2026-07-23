import { useState, useEffect } from 'react';
import { filterService } from '../services/filter.service';
import type { FilterDimension } from '../types/filter.types';

interface UseFiltersResult {
  /** Config-driven filter dimensions (from settings.FILTER_DIMENSIONS). */
  dimensions: FilterDimension[];
  filterOptionsLoading: boolean;
}

/**
 * Loads the config-driven filter dimensions from FilterService.
 * Each dimension carries its own options, ready to render generically.
 */
export function useFilters(): UseFiltersResult {
  const [dimensions, setDimensions] = useState<FilterDimension[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadFilters = async () => {
      try {
        const dims = await filterService.getDimensions();
        if (!cancelled) {
          setDimensions(dims);
          setLoading(false);
        }
      } catch {
        // If first load fails (cold start), retry once after a short delay
        if (!cancelled) {
          try {
            const dims = await filterService.getDimensions();
            if (!cancelled) {
              setDimensions(dims);
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

  return { dimensions, filterOptionsLoading: loading };
}
