import type { FilterOption } from '../types/filter.types';

/**
 * FilterService
 *
 * Fetches distinct dimension values from the FastAPI backend.
 * GET /api/filters returns all four axes in one response.
 *
 * Schema column mapping (executed server-side):
 *   channels   → SELECT DISTINCT GlobalChannel  FROM marketdimension
 *   categories → SELECT DISTINCT Category       FROM productdimension
 *   retailers  → SELECT DISTINCT GlobalRetailer  FROM marketdimension
 *   countries  → SELECT DISTINCT Country         FROM marketdimension
 */

interface ApiFiltersResponse {
  channels: FilterOption[];
  categories: FilterOption[];
  retailers: FilterOption[];
  countries: FilterOption[];
}

/** Cached result — filters don't change during a session */
let cached: ApiFiltersResponse | null = null;

async function fetchAll(): Promise<ApiFiltersResponse> {
  if (cached) return cached;

  const response = await fetch('/api/filters', {
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Filters request failed (${response.status}): ${text || response.statusText}`
    );
  }

  cached = await response.json();
  return cached!;
}

export const filterService = {
  async getChannels(): Promise<FilterOption[]> {
    const data = await fetchAll();
    return data.channels;
  },

  async getCategories(): Promise<FilterOption[]> {
    const data = await fetchAll();
    return data.categories;
  },

  async getRetailers(): Promise<FilterOption[]> {
    const data = await fetchAll();
    return data.retailers;
  },

  async getCountries(): Promise<FilterOption[]> {
    const data = await fetchAll();
    return data.countries;
  },
};
