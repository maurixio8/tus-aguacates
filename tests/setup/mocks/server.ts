/**
 * Mock Server para Supabase API
 * Simula las respuestas de la base de datos para testing
 */

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Datos mock
const mockProducts = [
  {
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
    benefits: ['Alto en grasas saludables'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }
];

const mockVariants = [
  {
    id: 'var-1',
    product_id: 'prod-2',
    variant_name: 'Presentación',
    variant_value: 'Caja de 12 unidades',
    price_adjustment: 45000,
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
    is_active: true,
    stock_quantity: 30,
    sku: 'CAJA-24',
    created_at: '2024-01-01T00:00:00Z',
  }
];

const mockCategories = [
  {
    id: 'cat-1',
    name: 'Aguacates',
    description: 'Todos nuestros productos de aguacate',
    slug: 'aguacates',
    sort_order: 1,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }
];

export const handlers = [
  // GET products
  http.get('https://gxqkmaaqoehydulksudj.supabase.co/rest/v1/products', () => {
    return HttpResponse.json(mockProducts);
  }),

  // GET product variants
  http.get('https://gxqkmaaqoehydulksudj.supabase.co/rest/v1/product_variants', ({ request }) => {
    const url = new URL(request.url);
    const productId = url.searchParams.get('product_id');

    if (productId === 'prod-2') {
      return HttpResponse.json(mockVariants);
    }

    return HttpResponse.json([]);
  }),

  // GET categories
  http.get('https://gxqkmaaqoehydulksudj.supabase.co/rest/v1/categories', () => {
    return HttpResponse.json(mockCategories);
  }),

  // POST guest_orders
  http.post('https://gxqkmaaqoehydulksudj.supabase.co/rest/v1/guest_orders', () => {
    return HttpResponse.json({
      id: 'order-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
    });
  }),

  // POST auth/signup
  http.post('https://gxqkmaaqoehydulksudj.supabase.co/auth/v1/signup', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      user: {
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        email: body.email,
      },
      session: null,
    });
  }),

  // Edge function - whatsapp-notification
  http.post('https://gxqkmaaqoehydulksudj.supabase.co/functions/v1/whatsapp-notification', () => {
    return HttpResponse.json({
      whatsappUrl: 'https://wa.me/573001234567?text=' + encodeURIComponent('Pedido confirmado'),
      success: true,
    });
  }),

  // GET orders (para dashboard admin)
  http.get('https://gxqkmaaqoehydulksudj.supabase.co/rest/v1/guest_orders', () => {
    return HttpResponse.json([
      {
        id: 'order-123',
        guest_name: 'Juan Pérez',
        guest_email: 'juan@example.com',
        guest_phone: '3001234567',
        guest_address: 'Calle 123 #45-67',
        total_amount: 15000,
        status: 'pendiente',
        payment_status: 'pendiente',
        order_data: {
          items: [
            {
              productName: 'Aguacate Hass Premium',
              quantity: 3,
              price: 5000,
            }
          ],
          total: 15000,
        },
        created_at: '2024-01-01T00:00:00Z',
      }
    ]);
  }),

  // PATCH orders (actualizar estado)
  http.patch('https://gxqkmaaqoehydulksudj.supabase.co/rest/v1/guest_orders', () => {
    return HttpResponse.json({
      id: 'order-123',
      status: 'en_preparacion',
      updated_at: new Date().toISOString(),
    });
  }),

  // POST shipping calculate
  http.post('/api/shipping/calculate', async ({ request }) => {
    const body = await request.json() as any;
    const { subtotal, location } = body;

    // Validar entrada (permitir subtotal = 0 para tests)
    if (typeof subtotal !== 'number' || subtotal < 0 || isNaN(subtotal) || !isFinite(subtotal)) {
      return HttpResponse.json(
        { success: false, error: 'Subtotal inválido' },
        { status: 400 }
      );
    }

    // Lógica de shipping
    let shippingCost = 7400; // Default Bogotá
    let estimatedDays = 1;

    if (location === 'Medellín') {
      shippingCost = 8900;
      estimatedDays = 2;
    } else if (location === 'Cali') {
      shippingCost = 9500;
      estimatedDays = 3;
    }

    const freeShippingMin = 68900;
    const freeShipping = subtotal >= freeShippingMin;
    const finalShippingCost = freeShipping ? 0 : shippingCost;
    const amountForFreeShipping = Math.max(0, freeShippingMin - subtotal);

    // Estructura que espera cart-store
    return HttpResponse.json({
      success: true,
      shipping: {
        cost: finalShippingCost,
        freeShipping,
        freeShippingMin,
        amountForFreeShipping,
        estimatedDays,
        message: freeShipping
          ? '¡Envío GRATIS en tu pedido!'
          : `Envío: $${finalShippingCost.toLocaleString('es-CO')}`
      }
    });
  }),
];

export const server = setupServer(...handlers);