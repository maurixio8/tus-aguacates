/**
 * Tests Unitarios para Cart Store
 * Verificación del estado y lógica del carrito
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCartStore } from '@/lib/cart-store';

// Mock de producto para testing
const mockProduct = {
  id: 'prod-1',
  name: 'Aguacate Hass',
  description: 'Producto de prueba',
  price: 5000,
  discount_price: 4500,
  unit: 'unidad',
  stock: 100,
  main_image_url: 'test.jpg',
  rating: 4.5,
  review_count: 10,
  slug: 'aguacate-test',
  category_id: 'cat-1',
  is_active: true,
  is_featured: false,
  reserved_stock: 0,
  min_quantity: 1,
  weight: 200,
  benefits: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockVariant = {
  id: 'var-1',
  variant_name: 'Presentación',
  variant_value: 'Caja de 12',
  price: 50000,
};

describe('🛒 Cart Store - Unit Tests', () => {
  beforeEach(() => {
    // Resetear store antes de cada test
    useCartStore.getState().clearCart();
  });

  describe(' addItem', () => {
    it('✅ Debe agregar un producto simple al carrito', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].product.id).toBe('prod-1');
      expect(result.current.items[0].quantity).toBe(1);
      expect(result.current.items[0].price).toBe(4500); // Precio con descuento
    });

    it('✅ Debe agregar un producto con variante al carrito', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem({ ...mockProduct, variant: mockVariant });
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].product.id).toBe('prod-1');
      expect(result.current.items[0].variant?.variant_value).toBe('Caja de 12');
      expect(result.current.items[0].price).toBe(50000);
    });

    it('✅ Debe incrementar cantidad si el producto ya existe', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      act(() => {
        result.current.addItem(mockProduct, 2);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(3);
    });

    it('✅ Debe manejar productos diferentes como items separados', () => {
      const { result } = renderHook(() => useCartStore());
      const anotherProduct = { ...mockProduct, id: 'prod-2', name: 'Otro producto' };

      act(() => {
        result.current.addItem(mockProduct);
      });

      act(() => {
        result.current.addItem(anotherProduct);
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0].product.name).toBe('Aguacate Hass');
      expect(result.current.items[1].product.name).toBe('Otro producto');
    });

    it('✅ Debe manejar misma variante como el mismo item', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem({ ...mockProduct, variant: mockVariant });
      });

      act(() => {
        result.current.addItem({ ...mockProduct, variant: mockVariant }, 2);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(3);
    });

    it('✅ Debe manejar diferentes variantes como items separados', () => {
      const { result } = renderHook(() => useCartStore());
      const anotherVariant = { ...mockVariant, id: 'var-2', variant_value: 'Caja de 24' };

      act(() => {
        result.current.addItem({ ...mockProduct, variant: mockVariant });
      });

      act(() => {
        result.current.addItem({ ...mockProduct, variant: anotherVariant });
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0].variant?.variant_value).toBe('Caja de 12');
      expect(result.current.items[1].variant?.variant_value).toBe('Caja de 24');
    });
  });

  describe(' updateQuantity', () => {
    it('✅ Debe actualizar cantidad de un item', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      act(() => {
        result.current.updateQuantity('prod-1', 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
    });

    it('✅ Debe actualizar cantidad de un item con variante', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem({ ...mockProduct, variant: mockVariant });
      });

      act(() => {
        result.current.updateQuantity('prod-1', 3, 'var-1');
      });

      expect(result.current.items[0].quantity).toBe(3);
    });

    it('✅ Debe eliminar item si cantidad es 0', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      act(() => {
        result.current.updateQuantity('prod-1', 0);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('✅ Debe eliminar item si cantidad es negativa', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      act(() => {
        result.current.updateQuantity('prod-1', -1);
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe(' removeItem', () => {
    it('✅ Debe eliminar un producto simple', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct);
      });

      act(() => {
        result.current.removeItem('prod-1');
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('✅ Debe eliminar un producto con variante específica', () => {
      const { result } = renderHook(() => useCartStore());
      const anotherVariant = { ...mockVariant, id: 'var-2', variant_value: 'Caja de 24' };

      act(() => {
        result.current.addItem({ ...mockProduct, variant: mockVariant });
      });

      act(() => {
        result.current.addItem({ ...mockProduct, variant: anotherVariant });
      });

      expect(result.current.items).toHaveLength(2);

      act(() => {
        result.current.removeItem('prod-1', 'var-1');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].variant?.variant_value).toBe('Caja de 24');
    });
  });

  describe(' getTotal', () => {
    it('✅ Debe calcular total de items sin variantes', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct, 3);
      });

      expect(result.current.getTotal()).toBe(13500); // 3 * 4500
    });

    it('✅ Debe calcular total con diferentes productos', () => {
      const { result } = renderHook(() => useCartStore());
      const anotherProduct = { ...mockProduct, id: 'prod-2', price: 8000, discount_price: 7000 };

      act(() => {
        result.current.addItem(mockProduct, 2); // 2 * 4500 = 9000
      });

      act(() => {
        result.current.addItem(anotherProduct, 1); // 1 * 7000 = 7000
      });

      expect(result.current.getTotal()).toBe(16000); // 9000 + 7000
    });

    it('✅ Debe calcular total con variantes', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem({ ...mockProduct, variant: mockVariant }, 2); // 2 * 50000 = 100000
      });

      expect(result.current.getTotal()).toBe(100000);
    });

    it('✅ Debe retornar 0 si el carrito está vacío', () => {
      const { result } = renderHook(() => useCartStore());

      expect(result.current.getTotal()).toBe(0);
    });
  });

  describe(' getItemCount', () => {
    it('✅ Debe contar total de items individuales', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct, 3);
      });

      act(() => {
        result.current.addItem({ ...mockProduct, id: 'prod-2' }, 2);
      });

      expect(result.current.getItemCount()).toBe(5); // 3 + 2
    });

    it('✅ Debe contar items con variantes', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem({ ...mockProduct, variant: mockVariant }, 4);
      });

      expect(result.current.getItemCount()).toBe(4);
    });

    it('✅ Debe retornar 0 si el carrito está vacío', () => {
      const { result } = renderHook(() => useCartStore());

      expect(result.current.getItemCount()).toBe(0);
    });
  });

  describe(' toggleCart', () => {
    it('✅ Debe alternar estado de visibilidad del carrito', () => {
      const { result } = renderHook(() => useCartStore());

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.toggleCart();
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.toggleCart();
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe(' clearCart', () => {
    it('✅ Debe vaciar el carrito completamente', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct, 3);
      });

      act(() => {
        result.current.addItem({ ...mockProduct, id: 'prod-2' }, 2);
      });

      expect(result.current.items).toHaveLength(2);

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.getTotal()).toBe(0);
      expect(result.current.getItemCount()).toBe(0);
    });
  });

  describe(' Persistencia', () => {
    it('✅ Debe persistir datos en localStorage', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockProduct, 2);
      });

      // Simular recarga de página
      const { result: newResult } = renderHook(() => useCartStore());

      expect(newResult.current.items).toHaveLength(1);
      expect(newResult.current.items[0].quantity).toBe(2);
      expect(newResult.current.getTotal()).toBe(9000);
    });
  });

  describe(' Edge Cases', () => {
    it('✅ Debe manejar productos sin precio de descuento', () => {
      const { result } = renderHook(() => useCartStore());
      const productWithoutDiscount = { ...mockProduct, discount_price: undefined };

      act(() => {
        result.current.addItem(productWithoutDiscount);
      });

      expect(result.current.items[0].price).toBe(5000); // Precio base
    });

    it('✅ Debe manejar precios con descuento de 0 (usa precio base)', () => {
      const { result } = renderHook(() => useCartStore());
      const productWithZeroDiscount = { ...mockProduct, discount_price: 0 };

      act(() => {
        result.current.addItem(productWithZeroDiscount);
      });

      // Cuando discount_price es 0, se usa el precio base (considerado falsy)
      expect(result.current.items[0].price).toBe(5000); // Precio base
    });

    it('✅ Debe priorizar precio de variante sobre descuento', () => {
      const { result } = renderHook(() => useCartStore());
      const expensiveVariant = { ...mockVariant, price: 75000 };

      act(() => {
        result.current.addItem({ ...mockProduct, variant: expensiveVariant });
      });

      expect(result.current.items[0].price).toBe(75000); // Precio de variante
    });
  });
});