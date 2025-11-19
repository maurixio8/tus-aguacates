/**
 * TESTS DE FUNCIONALIDAD: ProductQuickViewModal
 *
 * Verifica que el selector de cantidad funciona correctamente
 * y que la cantidad se envía al carrito
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ProductQuickViewModal } from '@/components/product/ProductQuickViewModal';
import { useCartStore } from '@/lib/cart-store';
import type { Product } from '@/lib/productStorage';

// Mock del cart store (Supabase already mocked in test-setup.ts)
vi.mock('@/lib/cart-store', () => ({
  useCartStore: vi.fn(),
}));

const mockProduct: Product = {
  id: '1',
  name: 'Aguacate Hass',
  description: 'Premium avocado from Colombia',
  price: 6500,
  category: 'Aguacates',
  stock: 100,
  is_active: true,
};

describe('🛒 ProductQuickViewModal - Funcionalidad de Cantidad', () => {
  let mockAddItem: ReturnType<typeof vi.fn>;
  let mockOnClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockAddItem = vi.fn();
    mockOnClose = vi.fn();

    (useCartStore as any).mockReturnValue({
      addItem: mockAddItem,
    });
  });

  test('✅ Debe mostrar el modal cuando isOpen=true', () => {
    render(
      <ProductQuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('✨ Vista Rápida')).toBeInTheDocument();
    expect(screen.getByText('Aguacate Hass')).toBeInTheDocument();
  });

  test('✅ Debe ocultar el modal cuando isOpen=false', () => {
    const { container } = render(
      <ProductQuickViewModal
        product={mockProduct}
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    // When isOpen=false, component returns null so container should be empty
    expect(container.innerHTML).toBe('');
  });

  test('✅ Debe inicializar cantidad en 1', () => {
    render(
      <ProductQuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const quantityInput = screen.getByDisplayValue('1') as HTMLInputElement;
    expect(quantityInput.value).toBe('1');
  });

  test('✅ Debe incrementar cantidad con botón +', async () => {
    render(
      <ProductQuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const plusButton = screen.getByRole('button', { name: '+' });

    fireEvent.click(plusButton);
    await waitFor(() => {
      const quantityInput = screen.getByDisplayValue('2') as HTMLInputElement;
      expect(quantityInput.value).toBe('2');
    });
  });

  test('✅ Debe decrementar cantidad con botón -', async () => {
    render(
      <ProductQuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const plusButton = screen.getByRole('button', { name: '+' });
    fireEvent.click(plusButton);
    fireEvent.click(plusButton);

    const minusButton = screen.getByRole('button', { name: '−' });
    fireEvent.click(minusButton);

    await waitFor(() => {
      const quantityInput = screen.getByDisplayValue('2') as HTMLInputElement;
      expect(quantityInput.value).toBe('2');
    });
  });

  test('✅ No debe permitir cantidad menor a 1', async () => {
    render(
      <ProductQuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const minusButton = screen.getByRole('button', { name: '−' });
    fireEvent.click(minusButton);

    await waitFor(() => {
      const quantityInput = screen.getByDisplayValue('1') as HTMLInputElement;
      expect(quantityInput.value).toBe('1');
    });
  });

  test('✅ Debe permitir editar cantidad directamente en input', async () => {
    render(
      <ProductQuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const quantityInput = screen.getByDisplayValue('1') as HTMLInputElement;

    // Clear and type new value
    fireEvent.change(quantityInput, { target: { value: '5' } });

    expect(quantityInput.value).toBe('5');
  });

  test('✅ Debe calcular el total correcto (precio × cantidad)', async () => {
    render(
      <ProductQuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const plusButton = screen.getByRole('button', { name: '+' });
    fireEvent.click(plusButton);
    fireEvent.click(plusButton);

    // Con cantidad=3, el total debería ser 6500 × 3 = 19,500
    await waitFor(() => {
      expect(screen.getByText(/19\.500|19,500/)).toBeInTheDocument();
    });
  });

  test('✅ Debe pasar cantidad correcta a addItem cuando se agrega al carrito', async () => {
    render(
      <ProductQuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Aumentar cantidad a 3
    const plusButton = screen.getByRole('button', { name: '+' });
    fireEvent.click(plusButton);
    fireEvent.click(plusButton);

    // Esperar a que cantidad sea 3
    await waitFor(() => {
      expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    });

    // Click en "Agregar al Carrito"
    const addButton = screen.getByText('🛒 Agregar al Carrito');
    fireEvent.click(addButton);

    // Verificar que addItem fue llamado con quantity=3
    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockProduct,
          variant: expect.any(Object),
        }),
        3 // quantity como segundo parámetro
      );
    });
  });

  test('✅ Debe cerrar modal después de agregar al carrito', async () => {
    render(
      <ProductQuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const addButton = screen.getByText('🛒 Agregar al Carrito');
    fireEvent.click(addButton);

    await waitFor(
      () => {
        expect(mockOnClose).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );
  });

  test('✅ Debe mostrar toast con cantidad correcta', async () => {
    render(
      <ProductQuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const plusButton = screen.getByRole('button', { name: '+' });
    fireEvent.click(plusButton);

    const addButton = screen.getByText('🛒 Agregar al Carrito');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/2 × Aguacate Hass/)).toBeInTheDocument();
    });
  });

  test('✅ Debe resetear cantidad cuando modal se abre nuevamente', async () => {
    const { rerender } = render(
      <ProductQuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const plusButton = screen.getByRole('button', { name: '+' });
    fireEvent.click(plusButton);
    fireEvent.click(plusButton);

    // Cerrar modal
    rerender(
      <ProductQuickViewModal
        product={mockProduct}
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    // Abrir modal nuevamente
    rerender(
      <ProductQuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Cantidad debería ser 1 nuevamente
    await waitFor(() => {
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    });
  });
});
