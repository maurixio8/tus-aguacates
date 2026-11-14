import { describe, expect, it } from 'vitest';
import {
  aggregatePurchaseLines,
  assignPurchaseZone,
  expandPurchaseLines,
  type PurchaseInputLine,
} from '@/lib/purchase-list-resolvers';

const avocado = (name: string, quantity: number): PurchaseInputLine => ({
  name,
  quantity,
  unit: 'caja',
});

describe('approved purchase mapping rules', () => {
  it('maps every avocado variant, including Caja Selección 18 and Injerto 4 unidades, to Bodega del Aguacate', () => {
    expect(assignPurchaseZone({ name: 'Hass 500g', quantity: 1, unit: 'unidad' })).toBe('Bodega del Aguacate');
    expect(assignPurchaseZone(avocado('Caja Selección 18', 1))).toBe('Bodega del Aguacate');
    expect(assignPurchaseZone(avocado('Injerto 4 unidades', 1))).toBe('Bodega del Aguacate');
  });

  it('initializes Cerezas in Bodega Popular', () => {
    expect(assignPurchaseZone({ name: 'Cerezas', quantity: 1, unit: 'bandeja' })).toBe('Bodega Popular');
  });

  it('expands combos before aggregation and zone assignment', () => {
    const combo: PurchaseInputLine = {
      name: 'Combo Frutal', quantity: 2, unit: 'combo', isCombo: true,
      components: [
        { name: 'Cerezas', quantity: 1, unit: 'bandeja' },
        { name: 'Hass', quantity: 3, unit: 'unidad' },
      ],
    };
    const expanded = expandPurchaseLines([combo]);
    expect(expanded).toEqual([
      { name: 'Cerezas', quantity: 2, unit: 'bandeja' },
      { name: 'Hass', quantity: 6, unit: 'unidad' },
    ]);
    expect(aggregatePurchaseLines([combo])).toEqual([
      { key: 'cerezas|bandeja', name: 'Cerezas', quantity: 2, unit: 'bandeja', zone: 'Bodega Popular' },
      { key: 'hass|unidad', name: 'Hass', quantity: 6, unit: 'unidad', zone: 'Bodega del Aguacate' },
    ]);
  });

  it('contributes Caja Selección 18 and Caja de 24 to Calidad 3ra', () => {
    expect(aggregatePurchaseLines([
      avocado('Caja Selección 18', 2),
      avocado('Caja de 24', 3),
    ])).toEqual([
      { key: 'calidad 3ra|caja', name: 'Calidad 3ra', quantity: 5, unit: 'caja', zone: 'Bodega del Aguacate' },
    ]);
  });
});
