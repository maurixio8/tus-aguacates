import { describe, expect, it } from 'vitest';
import { formatPurchaseQuantity } from '@/lib/purchase-list-format';

describe('purchase-list quantity formatting', () => {
  it('uses the weight variant instead of a generic kilo', () => {
    expect(formatPurchaseQuantity({ productName: 'Ciruela nacional', variantName: '500 g', totalQuantity: 1 })).toBe('1 x 500 g');
    expect(formatPurchaseQuantity({ productName: 'Mango Comun', variantName: '500 g', totalQuantity: 1 })).toBe('1 x 500 g');
    expect(formatPurchaseQuantity({ productName: 'Banano criollo', variantName: '1 Kilo', totalQuantity: 1 })).toBe('1 kg');
    expect(formatPurchaseQuantity({ productName: 'Banano criollo', variantName: '1 Kilo', totalQuantity: 1, physicalUnitName: 'kilo' })).toBe('1 kg');
    expect(formatPurchaseQuantity({ productName: 'Papaya', variantName: '2 kg', totalQuantity: 1 })).toBe('1 x 2 kg');
  });

  it('uses the unit variant instead of the product fallback unit', () => {
    expect(formatPurchaseQuantity({ productName: 'Batata Rosada', variantName: 'unidad', totalQuantity: 3, physicalUnitName: 'kilo' })).toBe('3 unidades');
  });

  it('keeps presentation counts in the physical quantity', () => {
    expect(formatPurchaseQuantity({ productName: 'Granadillas', variantName: 'bandeja', totalQuantity: 3, totalPhysicalUnits: 3 })).toBe('3 bandejas');
  });
});
