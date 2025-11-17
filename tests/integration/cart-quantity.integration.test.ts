/**
 * TESTS DE INTEGRACIÓN: Cantidad en el Carrito
 *
 * Verifica que la cantidad seleccionada se agregue correctamente al carrito
 * desde ProductQuickViewModal y ProductDetailModal
 */

import { renderHook, act } from '@testing-library/react';
import { useCartStore } from '@/lib/cart-store';
import type { Product } from '@/lib/productStorage';

describe('🛒 Integración: Agregar Cantidad Correcta al Carrito', () => {
  beforeEach(() => {
    // Limpiar el carrito antes de cada test
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.clearCart();
    });
  });

  const mockProduct: Product = {
    id: '1',
    name: 'Aguacate Hass',
    description: 'Premium avocado',
    price: 6500,
    category: 'Aguacates',
    stock: 100,
    is_active: true,
  };

  test('✅ Debe agregar 1 unidad cuando quantity=1', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockProduct, 1);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(1);
    expect(result.current.getItemCount()).toBe(1);
  });

  test('✅ Debe agregar 3 unidades cuando quantity=3', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockProduct, 3);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(3);
    expect(result.current.getItemCount()).toBe(3);
  });

  test('✅ Debe sumar cantidad cuando se agrega el mismo producto dos veces', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockProduct, 2);
    });

    act(() => {
      result.current.addItem(mockProduct, 3);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(5); // 2 + 3
    expect(result.current.getItemCount()).toBe(5);
  });

  test('✅ Debe calcular el total correctamente con cantidad', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockProduct, 5);
    });

    const totalPrice = 6500 * 5; // 32,500
    expect(result.current.getTotal()).toBe(totalPrice);
  });

  test('✅ Debe manejar múltiples productos con diferentes cantidades', () => {
    const { result } = renderHook(() => useCartStore());

    const product2 = { ...mockProduct, id: '2', name: 'Aguacate Criollo', price: 3500 };

    act(() => {
      result.current.addItem(mockProduct, 2);
      result.current.addItem(product2, 3);
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.getItemCount()).toBe(5); // 2 + 3

    const expectedTotal = (6500 * 2) + (3500 * 3); // 13,000 + 10,500 = 23,500
    expect(result.current.getTotal()).toBe(expectedTotal);
  });

  test('✅ Debe usar cantidad=1 por defecto si no se especifica', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockProduct); // Sin quantity
    });

    expect(result.current.items[0].quantity).toBe(1);
  });

  test('✅ Debe actualizar quantity correctamente', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockProduct, 2);
    });

    act(() => {
      result.current.updateQuantity(mockProduct.id, 5);
    });

    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.getItemCount()).toBe(5);
  });

  test('✅ Debe remover producto si quantity=0', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockProduct, 3);
    });

    act(() => {
      result.current.updateQuantity(mockProduct.id, 0);
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.getItemCount()).toBe(0);
  });
});
