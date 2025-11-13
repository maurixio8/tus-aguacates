/**
 * Test simple para verificar que el fix de shipping funciona
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useCartStore } from '../../lib/cart-store';

describe('🚚 Shipping Fix Verification', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('✅ Debe inicializar shipping con valores válidos', () => {
    const store = useCartStore.getState();

    // El shipping nunca debe ser null/undefined
    expect(store.shipping).toBeDefined();
    expect(store.shipping).not.toBeNull();

    // Debe tener valores por defecto válidos
    expect(typeof store.shipping.cost).toBe('number');
    expect(typeof store.shipping.freeShipping).toBe('boolean');
    expect(typeof store.shipping.freeShippingMin).toBe('number');
    expect(typeof store.shipping.amountForFreeShipping).toBe('number');
    expect(typeof store.shipping.estimatedDays).toBe('number');
    expect(typeof store.shipping.message).toBe('string');
  });

  it('✅ Debe mantener shipping válido después de clearCart', () => {
    const store = useCartStore.getState();

    store.clearCart();

    expect(store.shipping).toBeDefined();
    expect(store.shipping.cost).toBe(7400);
    expect(store.shipping.freeShipping).toBe(false);
    expect(store.shipping.message).toBe('Envío: $7.400');
  });

  it('✅ getTotals() debe incluir shipping sin errores', () => {
    const store = useCartStore.getState();

    // Agregar un producto
    const mockProduct = {
      id: 'test-1',
      name: 'Test Product',
      price: 10000,
      discount_price: null,
      description: 'Test Description',
      image_url: null,
      category_id: 'cat-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      in_stock: true,
      featured: false
    };

    store.addItem(mockProduct);

    const totals = store.getTotals();

    // Verificar que getTotals() funciona sin errores
    expect(typeof totals.subtotal).toBe('number');
    expect(typeof totals.shipping).toBe('number');
    expect(typeof totals.total).toBe('number');

    // shipping debe ser un número válido
    expect(totals.shipping).toBeGreaterThanOrEqual(0);
    expect(isFinite(totals.shipping)).toBe(true);
  });

  it('✅ calculateShipping debe manejar errores sin romperse', async () => {
    const store = useCartStore.getState();

    // Mock fetch para que falle
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    // No debe lanzar excepción
    await expect(store.calculateShipping()).resolves.not.toThrow();

    // Debe mantener valores por defecto
    expect(store.shipping.cost).toBe(7400);
    expect(store.shipping.freeShipping).toBe(false);

    // Restaurar fetch
    global.fetch = originalFetch;
  });

  it('✅ calculateShipping debe validar subtotal inválido', async () => {
    const store = useCartStore.getState();

    // Mock getSubtotal para retornar NaN
    vi.spyOn(store, 'getSubtotal').mockReturnValue(NaN);

    await expect(store.calculateShipping()).resolves.not.toThrow();

    // Debe usar fallback para subtotal inválido
    expect(store.shipping.amountForFreeShipping).toBe(68900);
  });
});