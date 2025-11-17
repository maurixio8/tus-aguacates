/**
 * TESTS E2E: Flujo Completo del Carrito
 *
 * Simula el flujo completo desde seleccionar cantidad
 * hasta agregar al carrito y verificar el total
 */

import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import { useCartStore } from '@/lib/cart-store';
import type { Product } from '@/lib/productStorage';

describe('🛒 E2E: Flujo Completo - Carrito con Cantidades', () => {
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Aguacate Hass',
      description: 'Premium avocado',
      price: 6500,
      category: 'Aguacates',
      stock: 100,
      is_active: true,
    },
    {
      id: '2',
      name: 'Aguacate Criollo',
      description: 'Colombian avocado',
      price: 3500,
      category: 'Aguacates',
      stock: 150,
      is_active: true,
    },
    {
      id: '3',
      name: 'Limón Tahití',
      description: 'Lime',
      price: 2500,
      category: 'Frutas',
      stock: 200,
      is_active: true,
    },
  ];

  beforeEach(() => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.clearCart();
    });
  });

  test('✅ E2E: Usuario selecciona múltiples productos con cantidades diferentes', () => {
    const { result } = renderHook(() => useCartStore());

    // PASO 1: Usuario ve producto 1 (Aguacate Hass) y selecciona cantidad 2
    act(() => {
      result.current.addItem(mockProducts[0], 2);
    });

    expect(result.current.getItemCount()).toBe(2);
    expect(result.current.getTotal()).toBe(6500 * 2); // 13,000

    // PASO 2: Usuario ve producto 2 (Aguacate Criollo) y selecciona cantidad 3
    act(() => {
      result.current.addItem(mockProducts[1], 3);
    });

    expect(result.current.getItemCount()).toBe(5); // 2 + 3
    expect(result.current.getTotal()).toBe((6500 * 2) + (3500 * 3)); // 23,500

    // PASO 3: Usuario ve producto 3 (Limón) y selecciona cantidad 1
    act(() => {
      result.current.addItem(mockProducts[2], 1);
    });

    expect(result.current.getItemCount()).toBe(6); // 2 + 3 + 1
    expect(result.current.getTotal()).toBe((6500 * 2) + (3500 * 3) + (2500 * 1)); // 26,000

    // Verificar estructura del carrito
    expect(result.current.items).toHaveLength(3);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.items[1].quantity).toBe(3);
    expect(result.current.items[2].quantity).toBe(1);
  });

  test('✅ E2E: Usuario agrega el mismo producto múltiples veces', () => {
    const { result } = renderHook(() => useCartStore());

    // Usuario agrega el mismo producto 3 veces
    act(() => {
      result.current.addItem(mockProducts[0], 2);
    });

    act(() => {
      result.current.addItem(mockProducts[0], 3);
    });

    act(() => {
      result.current.addItem(mockProducts[0], 1);
    });

    // Debe sumar todas las cantidades
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(6); // 2 + 3 + 1
    expect(result.current.getItemCount()).toBe(6);
    expect(result.current.getTotal()).toBe(6500 * 6); // 39,000
  });

  test('✅ E2E: Usuario modifica cantidades después de agregar', () => {
    const { result } = renderHook(() => useCartStore());

    // PASO 1: Agregar 2 unidades
    act(() => {
      result.current.addItem(mockProducts[0], 2);
    });

    expect(result.current.getItemCount()).toBe(2);
    expect(result.current.getTotal()).toBe(13000);

    // PASO 2: Cambiar a 5 unidades
    act(() => {
      result.current.updateQuantity(mockProducts[0].id, 5);
    });

    expect(result.current.getItemCount()).toBe(5);
    expect(result.current.getTotal()).toBe(6500 * 5); // 32,500

    // PASO 3: Cambiar a 1 unidad
    act(() => {
      result.current.updateQuantity(mockProducts[0].id, 1);
    });

    expect(result.current.getItemCount()).toBe(1);
    expect(result.current.getTotal()).toBe(6500);
  });

  test('✅ E2E: Usuario elimina producto del carrito', () => {
    const { result } = renderHook(() => useCartStore());

    // PASO 1: Agregar 3 productos
    act(() => {
      result.current.addItem(mockProducts[0], 2);
      result.current.addItem(mockProducts[1], 3);
      result.current.addItem(mockProducts[2], 1);
    });

    expect(result.current.items).toHaveLength(3);
    expect(result.current.getItemCount()).toBe(6);

    // PASO 2: Eliminar producto del medio
    act(() => {
      result.current.removeItem(mockProducts[1].id);
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.getItemCount()).toBe(3); // 2 + 1
    expect(result.current.getTotal()).toBe((6500 * 2) + (2500 * 1)); // 16,500
  });

  test('✅ E2E: Calcular totales con múltiples items y cantidades', () => {
    const { result } = renderHook(() => useCartStore());

    const prices = {
      product1: 6500,
      product2: 3500,
      product3: 2500,
    };

    const quantities = {
      product1: 2,
      product2: 3,
      product3: 1,
    };

    act(() => {
      result.current.addItem(mockProducts[0], quantities.product1);
      result.current.addItem(mockProducts[1], quantities.product2);
      result.current.addItem(mockProducts[2], quantities.product3);
    });

    const expectedSubtotal =
      (prices.product1 * quantities.product1) +
      (prices.product2 * quantities.product2) +
      (prices.product3 * quantities.product3);

    expect(result.current.getSubtotal()).toBe(expectedSubtotal);
    expect(result.current.getTotals().subtotal).toBe(expectedSubtotal);
  });

  test('✅ E2E: Limpiar carrito', () => {
    const { result } = renderHook(() => useCartStore());

    // Agregar varios items
    act(() => {
      result.current.addItem(mockProducts[0], 2);
      result.current.addItem(mockProducts[1], 3);
      result.current.addItem(mockProducts[2], 1);
    });

    expect(result.current.getItemCount()).toBe(6);
    expect(result.current.items).toHaveLength(3);

    // Limpiar carrito
    act(() => {
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.getItemCount()).toBe(0);
    expect(result.current.getTotal()).toBe(0);
  });

  test('✅ E2E: Validar cantidad nunca es menor a 1', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockProducts[0], 5);
    });

    // Intentar poner 0
    act(() => {
      result.current.updateQuantity(mockProducts[0].id, 0);
    });

    // Debe remover el item en lugar de poner cantidad 0
    expect(result.current.items).toHaveLength(0);
  });
});
