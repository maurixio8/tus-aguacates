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

      // Llamar calculateShipping para actualizar el shipping con el nuevo subtotal
      await useCartStore.getState().calculateShipping();

      const store = useCartStore.getState();

      // amountForFreeShipping = 68900 - 30000 = 38900
      expect(store.shipping.amountForFreeShipping).toBe(38900);
    });
  });

  describe('calculateShipping - API Response Validation', () => {
    it('✅ Debe manejar respuesta exitosa válida', async () => {
      // Agregar producto que califica para free shipping
      const mockProduct = {
        id: 'test-premium',
        name: 'Premium Product',
        price: 100000,
        discount_price: null,
        description: 'Test',
        image_url: null,
        category_id: 'cat-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        in_stock: true,
        featured: false
      };

      useCartStore.getState().addItem(mockProduct); // Subtotal = 100000 >= 68900

      await useCartStore.getState().calculateShipping('Bogotá');

      const store = useCartStore.getState();
      // Con subtotal > 68900, debe haber free shipping
      expect(store.shipping.cost).toBe(0);
      expect(store.shipping.freeShipping).toBe(true);
      expect(store.shipping.message).toBe('¡Envío GRATIS en tu pedido!');
    });

    it('✅ Debe validar estructura de respuesta API', async () => {
      // Sobrescribir handler de MSW con respuesta inválida
      server.use(
        http.post('/api/shipping/calculate', () => {
          return HttpResponse.json({
            success: true,
            shipping: {
              cost: 'invalid', // string en lugar de number
              freeShipping: 'true', // string en lugar de boolean
              // missing freeShippingMin, amountForFreeShipping, estimatedDays
              message: null // null en lugar de string
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
      // Sobrescribir handler con error
      server.use(
        http.post('/api/shipping/calculate', () => {
          return HttpResponse.json({
            success: false,
            error: 'Location not supported'
          });
        })
      );

      await useCartStore.getState().calculateShipping('Medellín');

      const store = useCartStore.getState();
      // Debe usar valores por defecto cuando success: false
      expect(store.shipping.cost).toBe(7400);
      expect(store.shipping.freeShipping).toBe(false);
      expect(store.shipping.message).toBe('Envío: $7.400');
    });

    it('✅ Debe manejar error HTTP (fallback)', async () => {
      // Simular error HTTP 500
      server.use(
        http.post('/api/shipping/calculate', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      await useCartStore.getState().calculateShipping();

      const store = useCartStore.getState();
      expect(store.shipping.cost).toBe(7400);
      expect(store.shipping.freeShipping).toBe(false);
    });

    it('✅ Debe manejar error de red (fallback)', async () => {
      // Simular error de red
      server.use(
        http.post('/api/shipping/calculate', () => {
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

      await useCartStore.getState().calculateShipping();

      const totals = useCartStore.getState().getTotals();
      expect(totals.subtotal).toBe(50000);
      // MSW retorna 7400 para Bogotá (default)
      expect(totals.shipping).toBe(7400);
      expect(totals.total).toBe(57400);
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

      // Con subtotal de 100000 >= 68900, debe haber free shipping
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
      // Llamar sin especificar ubicación (default: Bogotá)
      await useCartStore.getState().calculateShipping();

      const store = useCartStore.getState();
      // MSW retorna valores por defecto para Bogotá
      expect(store.shipping.cost).toBe(7400);
      expect(store.shipping.freeShipping).toBe(false);
      expect(store.shipping.freeShippingMin).toBe(68900);
      expect(store.shipping.estimatedDays).toBe(1);
      expect(store.shipping.message).toBe('Envío: $7.400');
    });

    it('✅ Debe actualizar shipping con location diferente', async () => {
      await useCartStore.getState().calculateShipping('Medellín');

      const store = useCartStore.getState();
      // MSW retorna 8900 para Medellín
      expect(store.shipping.cost).toBe(8900);
      expect(store.shipping.freeShippingMin).toBe(68900);
      expect(store.shipping.estimatedDays).toBe(2);
      expect(store.shipping.message).toBe('Envío: $8.900');
    });
  });
});