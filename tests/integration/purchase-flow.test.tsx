/**
 * Tests de Integración - Flujo Completo de Compra
 * ProductCard → CartStore → CartDrawer → Checkout → Confirmación
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextRouter } from 'next/router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ComponentProps } from 'react';
import { vi } from 'vitest';

// Mocks
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: mockReplace,
  }),
  usePathname: () => '/productos',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link to prevent navigation errors
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => {
    return React.createElement('a', { ...props, href }, children);
  },
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: [],
            })),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'order-123' },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: {},
          error: null,
        })),
      })),
    })),
    functions: {
      invoke: vi.fn(() => ({
        data: { whatsappUrl: 'https://wa.me/123' },
        error: null,
      })),
    },
    auth: {
      signUp: vi.fn(() => ({
        data: { user: { id: 'user-123' } },
        error: null,
      })),
    },
  },
}));

// Componentes bajo prueba
import { ProductCard } from '@/components/product/ProductCard';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { GuestCheckoutForm } from '@/components/checkout/GuestCheckoutForm';
import CheckoutPage from '@/app/checkout/page';
import { useCartStore } from '@/lib/cart-store';

// Datos de prueba
const mockProduct = {
  id: 'prod-1',
  name: 'Aguacate Hass Premium',
  description: 'Aguacates de la mejor calidad',
  price: 5000,
  discount_price: 4500,
  unit: 'unidad',
  stock: 100,
  main_image_url: 'https://example.com/image.jpg',
  rating: 4.5,
  review_count: 128,
  slug: 'aguacate-hass-premium',
  category_id: 'cat-1',
  is_active: true,
  is_featured: false,
  reserved_stock: 0,
  min_quantity: 1,
  weight: 200,
  benefits: ['Alto en grasas saludables', 'Fuente de vitaminas'],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockProductWithVariants = {
  ...mockProduct,
  id: 'prod-2',
  name: 'Aguacate Hass en Caja',
};

const mockVariants = [
  {
    id: 'var-1',
    product_id: 'prod-2',
    variant_name: 'Presentación',
    variant_value: 'Caja de 12 unidades',
    price_adjustment: 45000,
    price: 50000,
    is_active: true,
    stock_quantity: 50,
    sku: 'CAJA-12',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'var-2',
    product_id: 'prod-2',
    variant_name: 'Presentación',
    variant_value: 'Caja de 24 unidades',
    price_adjustment: 85000,
    price: 90000,
    is_active: true,
    stock_quantity: 30,
    sku: 'CAJA-24',
    created_at: '2024-01-01T00:00:00Z',
  },
];

// Wrapper para testing
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('🛒 Flujo Completo de Compra - Integration Tests', () => {
  beforeEach(() => {
    // Resetear el store antes de cada test
    useCartStore.setState({
      items: [],
      isOpen: false,
    });

    // Mockear fetch para Supabase
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockVariants }),
      })
    ) as vi.Mock;
  });

  describe('1. ProductCard → Cart Integration', () => {
    test('✅ Debe agregar producto sin variantes al carrito', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      // Verificar que el producto se muestra correctamente
      expect(screen.getByText('Aguacate Hass Premium')).toBeInTheDocument();
      expect(screen.getByText('$4.500')).toBeInTheDocument();
      expect(screen.getByText('Por unidad')).toBeInTheDocument();

      // Hacer clic en "Agregar al Carrito"
      const addToCartButton = screen.getByRole('button', { name: /agregar al carrito/i });
      await user.click(addToCartButton);

      // Verificar que se agregó al store
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].product.name).toBe('Aguacate Hass Premium');
      expect(items[0].price).toBe(4500); // Precio con descuento
      expect(items[0].quantity).toBe(1);
    });

    test('✅ Debe agregar producto con variantes al carrito', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ProductCard product={mockProductWithVariants} />
        </TestWrapper>
      );

      // Esperar a que carguen las variantes
      await waitFor(() => {
        expect(screen.getByDisplayValue('Caja de 12 unidades - $50.000')).toBeInTheDocument();
      });

      // Cambiar a la variante más grande
      const variantSelect = screen.getByDisplayValue('Caja de 12 unidades - $50.000');
      await user.selectOptions(variantSelect, 'Caja de 24 unidades - $90.000');

      // Verificar que el precio se actualiza
      expect(screen.getByText('$90.000')).toBeInTheDocument();

      // Agregar al carrito
      const addToCartButton = screen.getByRole('button', { name: /agregar al carrito/i });
      await user.click(addToCartButton);

      // Verificar que se agregó con la variante correcta
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].product.name).toBe('Aguacate Hass en Caja');
      expect(items[0].variant?.variant_value).toBe('Caja de 24 unidades');
      expect(items[0].price).toBe(90000);
    });

    test('❌ No debe agregar productos agotados', () => {
      const agotadoProduct = { ...mockProduct, stock: 0 };

      render(
        <TestWrapper>
          <ProductCard product={agotadoProduct} />
        </TestWrapper>
      );

      expect(screen.getByText('Agotado')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /agotado/i })).toBeDisabled();
    });
  });

  describe('2. CartDrawer - Gestión del Carrito', () => {
    test('✅ Debe mostrar productos agregados en el carrito', async () => {
      const user = userEvent.setup();

      // Pre-agregar items al carrito
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().addItem(mockProductWithVariants, 2);

      render(
        <TestWrapper>
          <CartDrawer />
        </TestWrapper>
      );

      // Abrir el carrito (simulando que está abierto)
      useCartStore.setState({ isOpen: true });

      // Verificar que muestra los items
      await waitFor(() => {
        expect(screen.getByText('Mi Carrito (3)')).toBeInTheDocument();
        expect(screen.getByText('Aguacate Hass Premium')).toBeInTheDocument();
        expect(screen.getByText('Aguacate Hass en Caja')).toBeInTheDocument();
      });

      // Verificar el total
      expect(screen.getByText(/\$94\.500/)).toBeInTheDocument(); // 4500 + 2*45000
    });

    test('✅ Debe permitir modificar cantidades', async () => {
      const user = userEvent.setup();

      useCartStore.getState().addItem(mockProduct, 2);

      render(
        <TestWrapper>
          <CartDrawer />
        </TestWrapper>
      );

      useCartStore.setState({ isOpen: true });

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });

      // Incrementar cantidad
      const plusButton = screen.getByRole('button', { name: '' });
      await user.click(plusButton);

      // Verificar que se actualizó
      expect(screen.getByText('3')).toBeInTheDocument();

      // Verificar total actualizado
      const { items, getTotal } = useCartStore.getState();
      expect(items[0].quantity).toBe(3);
      expect(getTotal()).toBe(13500); // 3 * 4500
    });

    test('✅ Debe permitir eliminar items', async () => {
      const user = userEvent.setup();

      useCartStore.getState().addItem(mockProduct);

      render(
        <TestWrapper>
          <CartDrawer />
        </TestWrapper>
      );

      useCartStore.setState({ isOpen: true });

      await waitFor(() => {
        expect(screen.getByText('Aguacate Hass Premium')).toBeInTheDocument();
      });

      // Eliminar item
      const deleteButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(deleteButton);

      // Verificar que el carrito queda vacío
      expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
    });

    test('✅ Debe navegar al checkout', async () => {
      const user = userEvent.setup();
      const mockPush = vi.fn();
      const mockRouter = {
        push: mockPush,
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn()
      };

      vi.doMock('next/navigation', () => ({
        useRouter: () => mockRouter,
        usePathname: () => '/productos',
        useSearchParams: () => new URLSearchParams(),
      }));

      useCartStore.getState().addItem(mockProduct);

      render(
        <TestWrapper>
          <CartDrawer />
        </TestWrapper>
      );

      useCartStore.setState({ isOpen: true });

      const checkoutButton = await screen.findByRole('link', { name: /ir al checkout/i });
      await user.click(checkoutButton);

      expect(mockPush).toHaveBeenCalledWith('/checkout');
    });
  });

  describe('3. Checkout - Proceso de Pedido', () => {
    test('✅ Debe mostrar formulario de checkout con items', async () => {
      useCartStore.getState().addItem(mockProduct, 2);

      render(
        <TestWrapper>
          <CheckoutPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Finalizar Pedido')).toBeInTheDocument();
        expect(screen.getByText('Resumen del Pedido')).toBeInTheDocument();
        expect(screen.getByText('Aguacate Hass Premium')).toBeInTheDocument();
        expect(screen.getByText('Cantidad: 2')).toBeInTheDocument();
        expect(screen.getByText(/\$9\.000/)).toBeInTheDocument(); // 2 * 4500
      });
    });

    test('✅ Debe completar formulario de información', async () => {
      const user = userEvent.setup();

      useCartStore.getState().addItem(mockProduct);

      render(
        <TestWrapper>
          <GuestCheckoutForm onSuccess={vi.fn()} />
        </TestWrapper>
      );

      // Completar formulario
      await user.type(screen.getByLabelText(/nombre completo/i), 'Juan Pérez');
      await user.type(screen.getByLabelText(/email/i), 'juan@example.com');
      await user.type(screen.getByLabelText(/teléfono/i), '3001234567');
      await user.type(screen.getByLabelText(/dirección de entrega/i), 'Calle 123 #45-67');
      await user.type(screen.getByLabelText(/fecha de entrega/i), '2024-12-25');

      // Verificar que los datos se ingresaron
      expect(screen.getByDisplayValue('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByDisplayValue('juan@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('3001234567')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Calle 123 #45-67')).toBeInTheDocument();
    });

    test('✅ Debe permitir crear cuenta opcional', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <GuestCheckoutForm onSuccess={vi.fn()} />
        </TestWrapper>
      );

      // Marcar checkbox para crear cuenta
      const createAccountCheckbox = screen.getByRole('checkbox', { name: /crear cuenta/i });
      await user.click(createAccountCheckbox);

      // Debe mostrar campo de contraseña
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();

      await user.type(screen.getByLabelText(/contraseña/i), 'password123');
      expect(screen.getByDisplayValue('password123')).toBeInTheDocument();
    });

    test('✅ Debe procesar pedido contra entrega', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = vi.fn();

      useCartStore.getState().addItem(mockProduct);

      render(
        <TestWrapper>
          <GuestCheckoutForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );

      // Completar formulario mínimo
      await user.type(screen.getByLabelText(/nombre completo/i), 'Juan Pérez');
      await user.type(screen.getByLabelText(/email/i), 'juan@example.com');
      await user.type(screen.getByLabelText(/teléfono/i), '3001234567');
      await user.type(screen.getByLabelText(/dirección de entrega/i), 'Calle 123 #45-67');

      // Click en "Pagar Contra Entrega"
      const payOnDeliveryButton = screen.getByRole('button', {
        name: /pagar contra entrega/i
      });
      await user.click(payOnDeliveryButton);

      await waitFor(() => {
        // Verificar que se llamó onSuccess
        expect(mockOnSuccess).toHaveBeenCalledWith('order-123');
      });
    });
  });

  describe('4. Flujo Completo End-to-End', () => {
    test('✅ Flujo completo: Producto → Carrito → Checkout → Confirmación', async () => {
      const user = userEvent.setup();
      const mockPush = vi.fn();
      const mockRouter = { push: mockPush, prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn() };

      vi.doMock('next/navigation', () => ({
        useRouter: () => mockRouter,
        usePathname: () => '/productos',
        useSearchParams: () => new URLSearchParams(),
      }));

      // 1. Agregar producto al carrito desde ProductCard
      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      const addToCartButton = screen.getByRole('button', { name: /agregar al carrito/i });
      await user.click(addToCartButton);

      // Verificar que está en el carrito
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].product.name).toBe('Aguacate Hass Premium');

      // 2. Navegar al checkout
      render(
        <TestWrapper>
          <CheckoutPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Resumen del Pedido')).toBeInTheDocument();
      });

      // 3. Completar información
      await user.type(screen.getByLabelText(/nombre completo/i), 'Cliente de Prueba');
      await user.type(screen.getByLabelText(/email/i), 'cliente@prueba.com');
      await user.type(screen.getByLabelText(/teléfono/i), '3009876543');
      await user.type(screen.getByLabelText(/dirección de entrega/i), 'Av Siempre Viva 742');

      // 4. Confirmar pedido contra entrega
      const payOnDeliveryButton = screen.getByRole('button', {
        name: /pagar contra entrega/i
      });
      await user.click(payOnDeliveryButton);

      // 5. Verificar redirección a confirmación
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/checkout/confirmacion?order=order-123');
      });

      // 6. Verificar que el carrito quedó vacío
      const { items: finalItems } = useCartStore.getState();
      expect(finalItems).toHaveLength(0);
    });

    test('✅ Debe manejar múltiples productos con variantes', async () => {
      const user = userEvent.setup();

      // Agregar productos diferentes
      useCartStore.getState().addItem(mockProduct, 2); // 2x $4500 = $9000

      // Agregar producto con variante
      const productWithVariant = { ...mockProductWithVariants, variant: mockVariants[0] };
      useCartStore.getState().addItem(productWithVariant, 1); // 1x $50000 = $50000

      render(
        <TestWrapper>
          <CheckoutPage />
        </TestWrapper>
      );

      await waitFor(() => {
        // Verificar que muestra ambos productos
        expect(screen.getByText('Aguacate Hass Premium')).toBeInTheDocument();
        expect(screen.getByText('Cantidad: 2')).toBeInTheDocument();
        expect(screen.getByText('Aguacate Hass en Caja')).toBeInTheDocument();
        expect(screen.getByText('Caja de 12 unidades')).toBeInTheDocument();

        // Verificar total
        expect(screen.getByText(/\$59\.000/)).toBeInTheDocument(); // $9000 + $50000
      });
    });
  });

  describe('5. Manejo de Errores', () => {
    test('❌ Debe mostrar error si el carrito está vacío', () => {
      const mockPush = vi.fn();
      const mockRouter = { push: mockPush, prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn() };

      vi.doMock('next/navigation', () => ({
        useRouter: () => mockRouter,
        usePathname: () => '/productos',
        useSearchParams: () => new URLSearchParams(),
      }));

      render(
        <TestWrapper>
          <CheckoutPage />
        </TestWrapper>
      );

      // Debe redirigir a productos
      expect(mockPush).toHaveBeenCalledWith('/productos');
    });

    test('❌ Debe validar campos requeridos en formulario', async () => {
      const user = userEvent.setup();

      useCartStore.getState().addItem(mockProduct);

      render(
        <TestWrapper>
          <GuestCheckoutForm onSuccess={vi.fn()} />
        </TestWrapper>
      );

      // Intentar enviar formulario vacío
      const submitButton = screen.getByRole('button', { name: /continuar al pago/i });
      await user.click(submitButton);

      // Debe mostrar validaciones HTML5
      expect(screen.getByLabelText(/nombre completo/i)).toBeInvalid();
      expect(screen.getByLabelText(/email/i)).toBeInvalid();
      expect(screen.getByLabelText(/teléfono/i)).toBeInvalid();
      expect(screen.getByLabelText(/dirección de entrega/i)).toBeInvalid();
    });
  });
});

/**
 * 📋 Checklist de Cobertura
 *
 * ✅ ProductCard → Agregar productos (con/sin variantes)
 * ✅ CartDrawer → Visualización y gestión de items
 * ✅ CartStore → Persistencia y estado del carrito
 * ✅ Checkout → Formulario de información
 * ✅ Pedido → Creación y confirmación
 * ✅ Navegación → Redirecciones correctas
 * ✅ Errores → Validaciones y manejo de errores
 * ✅ Variants → Productos con diferentes presentaciones
 * ✅ Descuentos → Precios con descuento aplicados
 * ✅ Cantidades → Modificación y actualización de totales
 */