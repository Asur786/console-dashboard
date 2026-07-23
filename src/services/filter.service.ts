import type { FilterDimension } from '../types/filter.types';

/**
 * FilterService
 *
 * Fetches the config-driven filter dimensions from the FastAPI backend.
 * GET /api/filters returns every dimension defined in settings.FILTER_DIMENSIONS
 * along with its distinct option values — so adding a filter needs no frontend
 * code change.
 */

interface ApiFiltersResponse {
  dimensions: FilterDimension[];
}

/** Cached result — filters don't change during a session */
let cached: ApiFiltersResponse | null = null;

async function fetchAll(): Promise<ApiFiltersResponse> {
  if (cached) return cached;

  // First attempt — 60s timeout to handle SQL Warehouse cold start
  try {
    const response = await fetch('/api/filters', {
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `Filters request failed (${response.status}): ${text || response.statusText}`
      );
    }

    cached = await response.json();
    return cached!;
  } catch (err) {
    // Auto-retry once on timeout (warehouse is now awake after first attempt)
    const isTimeout = err instanceof DOMException && err.name === 'TimeoutError';
    if (!isTimeout) throw err;

    const response = await fetch('/api/filters', {
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `Filters request failed on retry (${response.status}): ${text || response.statusText}`,
        { cause: err }
      );
    }

    cached = await response.json();
    return cached!;
  }
}

export const filterService = {
  /** All configured filter dimensions with their selectable options. */
  async getDimensions(): Promise<FilterDimension[]> {
    const data = await fetchAll();
    return data.dimensions;
  },
};
