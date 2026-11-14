import { describe, expect, it } from 'vitest';
import {
  calculateAvocadoUnitsAndKilos,
  calculateCashChange,
  convertGramsToPackages,
} from '@/lib/purchase-offline-helpers';
import { findPurchaseSupplierForProduct, PURCHASE_PRODUCT_SUPPLIER_MAPPING } from '@/lib/suppliers-config';

describe('authoritative purchase supplier mapping', () => {
  it('contains all 25 requested product rules', () => {
    expect(PURCHASE_PRODUCT_SUPPLIER_MAPPING).toHaveLength(25);
    expect(findPurchaseSupplierForProduct('Maracuyá')).toMatchObject({ supplierId: 'especies', sub_location_hint: '📍 Alero Sur' });
    expect(findPurchaseSupplierForProduct('berenjena')).toMatchObject({ supplierId: 'hierbas', fallback_zone_id: 'especies' });
    expect(findPurchaseSupplierForProduct('Red Globe nacional')?.supplierId).toBe('reina');
  });

  it('normalizes accents and whitespace without losing the exact rule', () => {
    expect(findPurchaseSupplierForProduct('  MANDARINA  ')).toMatchObject({ supplierId: 'especies', sub_location_hint: '📍 Alero Sur' });
    expect(findPurchaseSupplierForProduct('Ajo Nacional')?.supplierId).toBe('especies');
  });
});

describe('offline purchase calculations', () => {
  it('converts grams to 125g/250g/500g packages', () => {
    expect(convertGramsToPackages(1000, 125)).toEqual({ packages: 8, remainderGrams: 0, packageGrams: 125 });
    expect(convertGramsToPackages(600, 250)).toEqual({ packages: 3, remainderGrams: 100, packageGrams: 250 });
  });

  it('calculates avocado kilos from units and average unit weight', () => {
    expect(calculateAvocadoUnitsAndKilos(24, 200)).toEqual({ units: 24, kilos: 4.8, grams: 4800 });
  });

  it('keeps cash change calculation local and explicit', () => {
    expect(calculateCashChange(18500, 20000)).toEqual({ total: 18500, received: 20000, change: 1500, missing: 0, canClose: true });
    expect(calculateCashChange(18500, 10000)).toEqual({ total: 18500, received: 10000, change: 0, missing: 8500, canClose: false });
  });
});
