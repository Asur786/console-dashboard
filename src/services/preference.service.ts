import type {
  SaveViewPayload,
  SavedView,
  ViewListResponse,
} from '../types/preference.types';

/**
 * PreferenceService — client for the User Preference API.
 *
 * Endpoints (backend, mounted under /api):
 *   GET    /api/preferences/views
 *   POST   /api/preferences/views
 *   PUT    /api/preferences/views/{viewId}
 *   DELETE /api/preferences/views/{viewId}
 *   POST   /api/preferences/views/{viewId}/set-default
 *
 * The frontend never sends a view name — the backend generates it.
 */

const BASE = '/api/preferences/views';
const TIMEOUT_MS = 30_000;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Request failed (${response.status}): ${text || response.statusText}`,
    );
  }

  // 204 No Content (delete) has no body
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const preferenceService = {
  /** List all saved views for the current user (default first). */
  async listViews(): Promise<SavedView[]> {
    const data = await request<ViewListResponse>(BASE);
    return data.views;
  },

  /** Create a new saved view. Backend auto-generates the name. */
  async createView(payload: SaveViewPayload): Promise<SavedView> {
    return request<SavedView>(BASE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** Update an existing view's visible config. */
  async updateView(viewId: string, payload: SaveViewPayload): Promise<SavedView> {
    return request<SavedView>(`${BASE}/${viewId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /** Delete a saved view. */
  async deleteView(viewId: string): Promise<void> {
    await request<void>(`${BASE}/${viewId}`, { method: 'DELETE' });
  },

  /** Mark a saved view as the user's default. */
  async setDefault(viewId: string): Promise<SavedView> {
    return request<SavedView>(`${BASE}/${viewId}/set-default`, {
      method: 'POST',
    });
  },
};
