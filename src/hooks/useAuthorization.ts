import { useMemo } from 'react';

export interface AuthorizationState {
  roles: string[];
  scopes: string[];
  isAdmin: boolean;
  canWritePreferences: boolean;
  canShare: boolean;
}

function parseCsv(input: string | null): string[] {
  if (!input) return [];
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function resolveAuthorization(roles: string[], scopes: string[]): AuthorizationState {
  const normalizedRoles = roles.length ? roles : ['user'];
  const normalizedScopes = scopes;
  const isAdmin = normalizedRoles.includes('admin');

  const hasWriteScope = normalizedScopes.includes('saved_view:write');
  // Legacy compatibility: when scopes are absent, keep existing behavior.
  const canWritePreferences = isAdmin || hasWriteScope || normalizedScopes.length === 0;
  const canShare = isAdmin || normalizedRoles.includes('user');

  return {
    roles: normalizedRoles,
    scopes: normalizedScopes,
    isAdmin,
    canWritePreferences,
    canShare,
  };
}

export function useAuthorization(): AuthorizationState {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return resolveAuthorization(['user'], []);
    }

    const roles = parseCsv(window.localStorage.getItem('console_dashboard_roles'));
    const scopes = parseCsv(window.localStorage.getItem('console_dashboard_scopes'));
    return resolveAuthorization(roles, scopes);
  }, []);
}
