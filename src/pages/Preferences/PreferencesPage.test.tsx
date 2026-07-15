import { describe, expect, it } from 'vitest';

import { resolveAuthorization } from '../../hooks/useAuthorization';

describe('Preferences role guards', () => {
  it('allows legacy user when scopes are absent', () => {
    const auth = resolveAuthorization(['user'], []);
    expect(auth.canWritePreferences).toBe(true);
    expect(auth.canShare).toBe(true);
  });

  it('denies write when explicit scopes do not include write', () => {
    const auth = resolveAuthorization(['user'], ['saved_view:read']);
    expect(auth.canWritePreferences).toBe(false);
  });

  it('allows admin regardless of scope', () => {
    const auth = resolveAuthorization(['admin'], ['saved_view:read']);
    expect(auth.canWritePreferences).toBe(true);
    expect(auth.canShare).toBe(true);
  });
});
