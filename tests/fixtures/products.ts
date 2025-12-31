/**
 * Fixtures de productos para tests E2E
 * Productos reales disponibles en /tienda
 */

export const TEST_PRODUCTS = {
  // Productos básicos para tests
  PRODUCT_1: {
    id: 'product-1',
    name: 'Caja de 24 unidades hass mediano',
    price: 16600,
    category: 'aguacates'
  },
  PRODUCT_2: {
    id: 'product-2',
    name: 'Caja de 12 unidades Premium',
    price: 24700,
    category: 'aguacates'
  },
  PRODUCT_3: {
    id: 'product-3',
    name: 'Caja de 7 unidades injerto',
    price: 24000,
    category: 'aguacates'
  },
  PRODUCT_4: {
    id: 'product-4',
    name: 'Caja promoción del día',
    price: 14900,
    category: 'ofertas'
  },
  PRODUCT_5: {
    id: 'product-5',
    name: 'Caja de 35 unidades hass baby',
    price: 15900,
    category: 'aguacates'
  },
} as const;

// Productos por nombre para búsqueda
export const PRODUCTS_BY_NAME = {
  hass: TEST_PRODUCTS.PRODUCT_1,
  premium: TEST_PRODUCTS.PRODUCT_2,
  injerto: TEST_PRODUCTS.PRODUCT_3,
  promocion: TEST_PRODUCTS.PRODUCT_4,
  baby: TEST_PRODUCTS.PRODUCT_5,
} as const;

// Productos para pruebas de cupones (sobre $68.900 para envío gratis)
export const PRODUCTS_FOR_FREE_SHIPPING = [
  TEST_PRODUCTS.PRODUCT_2, // $24,700
  TEST_PRODUCTS.PRODUCT_3, // $24,000
  TEST_PRODUCTS.PRODUCT_5, // $15,900
  // Total: $64,600 (casi, falta poco)
  TEST_PRODUCTS.PRODUCT_1, // $16,600
  // Total: $81,200 (supera $68.900)
];

// URLs
export const URLS = {
  HOME: '/',
  SHOP: '/tienda',
  CHECKOUT: '/checkout',
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  B2B: '/empresas',
} as const;
