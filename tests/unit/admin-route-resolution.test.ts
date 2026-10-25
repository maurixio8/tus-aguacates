import { describe, expect, it } from 'vitest';
import { hasUsableSavedResolution } from '@/lib/admin-route';

describe('admin route saved resolution guard', () => {
  it('does not dereference a missing resolution for a guest order without a saved location', () => {
    const savedResolution = undefined;

    expect(hasUsableSavedResolution(savedResolution)).toBe(false);
  });

  it('continues only for a saved candidate or confirmed resolution', () => {
    expect(hasUsableSavedResolution({ status: 'candidata' })).toBe(true);
    expect(hasUsableSavedResolution({ status: 'confirmada' })).toBe(true);
    expect(hasUsableSavedResolution({ status: 'rechazada' })).toBe(false);
    expect(hasUsableSavedResolution({ status: 'sin_coordenadas' })).toBe(false);
  });
});