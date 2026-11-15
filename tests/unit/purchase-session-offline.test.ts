import { describe, expect, it } from 'vitest';
import { DEFINITIVE_PRODUCT_SUPPLIER_MAPPING, findPurchaseSupplierForProduct } from '@/lib/suppliers-config';
import { addPromoGifts, closeJornada, dedupeMutationQueue, enqueueMutation, getMissingItems } from '@/lib/purchase-session-offline';

describe('definitive supplier routing', () => {
  it('routes named products exactly and keeps 25 legacy mappings intact', () => {
    expect(findPurchaseSupplierForProduct('Mango Común')?.supplierId).toBe('medio-fruver');
    expect(findPurchaseSupplierForProduct('Limón Tahití')).toMatchObject({ supplierId: 'especies', sub_location_hint: '📍 Costado Sur' });
    expect(findPurchaseSupplierForProduct('Tomate chonto tamaño mixto')).toMatchObject({ supplierId: 'especies', sub_location_hint: '📍 Alero Sur' });
    expect(findPurchaseSupplierForProduct('Tomate cherry')?.supplierId).toBe('hierbas');
    expect(findPurchaseSupplierForProduct('Duraznos')).toMatchObject({ supplierId: 'popular', sub_location_hint: '📍 Mayorista' });
    expect(findPurchaseSupplierForProduct('Arándanos Orgánicos')).toMatchObject({ supplierId: 'popular', fallback_zone_id: 'reina' });
    expect(DEFINITIVE_PRODUCT_SUPPLIER_MAPPING).toHaveLength(34);
  });

  it('never routes ghost products', () => {
    expect(findPurchaseSupplierForProduct('Piña')).toBeNull();
    expect(findPurchaseSupplierForProduct('Semillas de Jessica')).toBeNull();
  });
});

describe('promo gift and offline jornada helpers', () => {
  it('adds one Mayorista Duraznos gift and customer card per Caja de 24 trigger', () => {
    const result = addPromoGifts([
      { name: 'Caja de 24 unidades hass mediano', variant: '24 unidades', quantity: 2, unit: 'caja', customerName: 'Ana', orderId: 'o1' },
    ]);
    expect(result.gifts).toEqual([{ name: 'Duraznos', quantity: 2, unit: 'paquete', supplierId: 'popular', subLocation: '📍 Mayorista', isGift: true }]);
    expect(result.pickingCards[0].text).toBe('🎁 OBSEQUIO PROMO: Paquete de 5-6 Duraznos gratis');
  });

  it('deduplicates queued mutations by mutation_id', () => {
    const record = { mutation_id: 'm1', kind: 'draft', payload: { id: 1 }, created_at: '2026-11-15T00:00:00Z' };
    const once = enqueueMutation([], record);
    expect(enqueueMutation(once, record)).toHaveLength(1);
    expect(dedupeMutationQueue([...once, record])).toHaveLength(1);
  });

  it('shows per-customer shortages and blocks close until resolved', () => {
    const lines = getMissingItems([{ customerName: 'Ana', orderId: 'o1', productName: 'Mango', requestedQuantity: 3, purchasedQuantity: 1, missingQuantity: 0 }]);
    expect(lines[0].missingQuantity).toBe(2);
    expect(closeJornada(lines)).toMatchObject({ status: 'blocked' });
    expect(closeJornada(lines.map(line => ({ ...line, purchasedQuantity: 3 })))).toMatchObject({ status: 'closed', missing: [] });
  });
});
