/**
 * Tests Unitarios - Shipping Calculation
 * Cubre la funcionalidad de cálculo de envíos y validación de datos
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCartStore } from '../../lib/cart-store';
import { server } from '../setup/mocks/server';
import { http, HttpResponse } from 'msw';

describe('🚚 Shipping Calculation - Unit Tests', () => {
  beforeEach(() => {
    // Resetear el store antes de cada test
    useCartStore.getState().clearCart();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    server.resetHandlers();
  });

  describe('Función getDefaultShippingInfo', () => {
    it('✅ Debe retornar valores por defecto correctos', () => {
      const store = useCartStore.getState();
      const defaultShipping = store.shipping;

      expect(defaultShipping.cost).toBe(7400);
      expect(defaultShipping.freeShipping).toBe(false);
      expect(defaultShipping.freeShippingMin).toBe(68900);
      expect(defaultShipping.amountForFreeShipping).toBe(68900);
      expect(defaultShipping.estimatedDays).toBe(1);
      expect(defaultShipping.message).toBe('Envío: $7.400');
    });

    it('✅ Debe calcular amountForFreeShipping correctamente con subtotal', async () => {
      // Agregar un producto al carrito
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

      useCartStore.getState().addItem(mockProduct, 3); // 3 * 10000 = 30000

      // Recalcular shipping con el nuevo subtotal
      await useCartStore.getState().calculateShipping();

      const store = useCartStore.getState();

      // amountForFreeShipping = 68900 - 30000 = 38900
      expect(store.shipping.amountForFreeShipping).toBe(38900);
    });
  });

  describe('calculateShipping - API Response Validation', () => {
    it('✅ Debe manejar respuesta exitosa válida', async () => {
      // Override MSW handler for this test to simulate free shipping
      server.use(
        http.post('/api/shipping/calculate', async () => {
          return HttpResponse.json({
            success: true,
            shipping: {
              cost: 0,
              freeShipping: true,
              freeShippingMin: 68900,
              amountForFreeShipping: 0,
              estimatedDays: 2,
              message: '¡Envío GRATIS en tu pedido!'
            }
          });
        })
      );

      await useCartStore.getState().calculateShipping('Bogotá');

      const store = useCartStore.getState();
      expect(store.shipping.cost).toBe(0);
      expect(store.shipping.freeShipping).toBe(true);
      expect(store.shipping.message).toBe('¡Envío GRATIS en tu pedido!');
    });

    it('✅ Debe validar estructura de respuesta API', async () => {
      // Override MSW handler to return invalid structure
      server.use(
        http.post('/api/shipping/calculate', async () => {
          return HttpResponse.json({
            success: true,
            shipping: {
              // Faltan campos obligatorios
              cost: 'invalid', // debería ser number
              freeShipping: 'true', // debería ser boolean
              // missing freeShippingMin
              message: null // debería ser string
            }
          });
        })
      );

      await useCartStore.getState().calculateShipping();

      const store = useCartStore.getState();
      // Debe usar fallbacks para valores inválidos
      expect(store.shipping.cost).toBe(7400); // fallback
      expect(store.shipping.freeShipping).toBe(true); // Boolean('true') = true
      expect(store.shipping.freeShippingMin).toBe(68900); // fallback
      expect(store.shipping.message).toBe('Envío: $7.400'); // fallback
    });

    it('✅ Debe manejar respuesta de API con success: false', async () => {
      // Override MSW handler to return success: false
      server.use(
        http.post('/api/shipping/calculate', async () => {
          return HttpResponse.json({
            success: false,
            error: 'Location not supported'
          });
        })
      );

      await useCartStore.getState().calculateShipping('Medellín');

      const store = useCartStore.getState();
      expect(store.shipping.cost).toBe(7400);
      expect(store.shipping.freeShipping).toBe(false);
      expect(store.shipping.message).toBe('Envío: $7.400');
    });

    it('✅ Debe manejar error HTTP (fallback)', async () => {
      // Override MSW handler to return HTTP error
      server.use(
        http.post('/api/shipping/calculate', async () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      await useCartStore.getState().calculateShipping();

      const store = useCartStore.getState();
      expect(store.shipping.cost).toBe(7400);
      expect(store.shipping.freeShipping).toBe(false);
    });

    it('✅ Debe manejar error de red (fallback)', async () => {
      // Override MSW handler to simulate network error
      server.use(
        http.post('/api/shipping/calculate', async () => {
          return HttpResponse.error();
        })
      );

      await useCartStore.getState().calculateShipping();

      const store = useCartStore.getState();
      expect(store.shipping.cost).toBe(7400);
      expect(store.shipping.freeShipping).toBe(false);
    });
  });

  describe('Input Validation', () => {
    it('✅ Debe validar subtotal inválido (negative)', async () => {
      // Mockear getSubtotal para retornar valor negativo
      vi.spyOn(useCartStore.getState(), 'getSubtotal').mockReturnValue(-1000);

      await useCartStore.getState().calculateShipping();

      const store = useCartStore.getState();
      expect(store.shipping.cost).toBe(7400);
      expect(store.shipping.amountForFreeShipping).toBe(68900);
    });

    it('✅ Debe validar subtotal inválido (NaN)', async () => {
      vi.spyOn(useCartStore.getState(), 'getSubtotal').mockReturnValue(NaN);

      await useCartStore.getState().calculateShipping();

      const store = useCartStore.getState();
      expect(store.shipping.cost).toBe(7400);
    });

    it('✅ Debe validar subtotal inválido (Infinity)', async () => {
      vi.spyOn(useCartStore.getState(), 'getSubtotal').mockReturnValue(Infinity);

      await useCartStore.getState().calculateShipping();

      const store = useCartStore.getState();
      expect(store.shipping.cost).toBe(7400);
    });
  });

  describe('getTotals Integration', () => {
    it('✅ Debe incluir shipping en el total sin errores', async () => {
      // Agregar producto
      const mockProduct = {
        id: 'test-1',
        name: 'Test Product',
        price: 50000,
        discount_price: null,
        description: 'Test Description',
        image_url: null,
        category_id: 'cat-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        in_stock: true,
        featured: false
      };

      useCartStore.getState().addItem(mockProduct);

      // Override MSW handler for custom shipping cost
      server.use(
        http.post('/api/shipping/calculate', async () => {
          return HttpResponse.json({
            success: true,
            shipping: {
              cost: 5000,
              freeShipping: false,
              freeShippingMin: 68900,
              amountForFreeShipping: 18900,
              estimatedDays: 1,
              message: 'Envío: $5.000'
            }
          });
        })
      );

      await useCartStore.getState().calculateShipping();

      const totals = useCartStore.getState().getTotals();
      expect(totals.subtotal).toBe(50000);
      expect(totals.shipping).toBe(5000);
      expect(totals.total).toBe(55000);
    });

    it('✅ Debe calcular free shipping correctamente', async () => {
      // Agregar producto que califica para free shipping
      const mockProduct = {
        id: 'test-1',
        name: 'Premium Product',
        price: 100000,
        discount_price: null,
        description: 'Test Description',
        image_url: null,
        category_id: 'cat-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        in_stock: true,
        featured: false
      };

      useCartStore.getState().addItem(mockProduct);

      // MSW handler already returns free shipping for subtotal >= 68900
      await useCartStore.getState().calculateShipping();

      const totals = useCartStore.getState().getTotals();
      expect(totals.subtotal).toBe(100000);
      expect(totals.shipping).toBe(0);
      expect(totals.total).toBe(100000);
    });
  });

  describe('Edge Cases', () => {
    it('✅ Debe mantener shipping válido en clearCart', () => {
      const store = useCartStore.getState();

      // Verificar que shipping existe después de clearCart
      store.clearCart();
      expect(store.shipping).toBeDefined();
      expect(store.shipping.cost).toBe(7400);
      expect(store.shipping.freeShipping).toBe(false);
    });

    it('✅ Debe manejar ubicación por defecto Bogotá', async () => {
      // Llamar sin especificar ubicación (usa 'Bogotá' por defecto)
      await useCartStore.getState().calculateShipping();

      const store = useCartStore.getState();
      // MSW handler returns cost 7400 for Bogotá
      expect(store.shipping.cost).toBe(7400);
      expect(store.shipping.estimatedDays).toBe(1);
    });

    it('✅ Debe actualizar shipping con location diferente', async () => {
      await useCartStore.getState().calculateShipping('Soacha');

      const store = useCartStore.getState();
      // MSW handler returns cost 8000 for Soacha
      expect(store.shipping.cost).toBe(8000);
      expect(store.shipping.estimatedDays).toBe(1);
      expect(store.shipping.message).toContain('8.000');
    });
  });
});