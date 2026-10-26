import { describe, expect, it } from 'vitest';
import { resolveComboComponents } from '@/lib/purchase-list-resolvers';

describe('purchase list combo resolver', () => {
  it('resolves a combo by stable product id before its display name', () => {
    const byId = {
      'trio-id': [{ name: 'Fresas premium', quantity: 1, unit: 'contenedor', variant: '500 g' }],
    };
    const byName = {
      'trío frutal premium': [{ name: 'wrong fallback', quantity: 9, unit: 'unidad' }],
    };

    expect(resolveComboComponents('trio-id', 'Trío Frutal Premium', byId, byName)).toEqual(byId['trio-id']);
  });

  it('resolves a combo by normalized display name when no id is available', () => {
    const components = [{ name: 'Menta', quantity: 1, unit: 'paquete', variant: 'peso pendiente' }];
    expect(resolveComboComponents(null, 'Trío Frutal Premium extra', {}, { 'trío frutal premium': components })).toEqual(components);
  });
});
