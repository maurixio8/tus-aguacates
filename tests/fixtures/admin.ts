/**
 * Fixtures para pruebas de administración
 * Contiene datos de prueba y constantes centralizadas
 */

function getRequiredE2EEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required E2E environment variable: ${name}`);
  }

  return value;
}

// Credenciales de administrador
export const ADMIN_CREDENTIALS = {
  email: getRequiredE2EEnv('E2E_ADMIN_EMAIL'),
  password: getRequiredE2EEnv('E2E_ADMIN_PASSWORD'),
};

// URLs del Dashboard
export const ADMIN_URLS = {
  LOGIN: '/admin/login',
  DASHBOARD: '/admin',
  PRODUCTS: '/admin/productos',
  CUSTOMERS: '/admin/clientes',
  B2B: '/admin/empresas',
  ORDERS: '/admin/pedidos',
  REPORTS: '/admin/reportes',
};

// Generador de datos únicos para tests
export const generateTestData = {
  // Producto con nombre único
  product: (overrides = {}) => ({
    name: `Producto Test E2E ${Date.now()}-${Math.random().toString(36).substring(7)}`,
    description: 'Producto creado por prueba automatizada E2E',
    price: 15000,
    stock: 100,
    category_id: '', // Se debe llenar con una categoría válida
    is_active: true,
    is_featured: false,
    unit: 'unit',
    ...overrides,
  }),

  // Cliente con datos únicos
  customer: (overrides = {}) => ({
    name: `Cliente Test E2E ${Date.now()}-${Math.random().toString(36).substring(7)}`,
    phone: `57${3000000000 + Math.floor(Math.random() * 999999999)}`,
    email: `test+${Date.now()}@example.com`,
    address: 'Calle 123 #45-67',
    neighborhood: 'Barrio Test',
    city: 'Bogotá',
    notes: 'Cliente de prueba automatizada',
    ...overrides,
  }),
};

// Datos de prueba predefinidos
export const TEST_DATA = {
  // Producto válido completo
  VALID_PRODUCT: {
    name: 'Aguacate Hass Premium',
    description: 'Aguacate de la mejor calidad, seleccionado a mano',
    price: 5500,
    discount_price: 4500,
    stock: 150,
    category_id: '', // Se debe obtener de la BD
    unit: 'unit',
    weight: 200,
    min_quantity: 1,
    is_organic: true,
    is_featured: true,
    is_active: true,
    benefits: ['Alto en grasas saludables', 'Fuente de potasio'],
  },

  // Cliente válido completo
  VALID_CUSTOMER: {
    name: 'Juan Pérez',
    phone: '573001234567',
    email: 'juan.perez@example.com',
    address: 'Calle 100 #15-20, Apto 301',
    neighborhood: 'Chapinero',
    city: 'Bogotá',
    notes: 'Cliente preferencial, pedir confirmación',
  },

  // Datos inválidos para pruebas de validación
  INVALID_PRODUCT: {
    // Precio negativo
    NEGATIVE_PRICE: {
      name: 'Producto Precio Inválido',
      price: -100,
      stock: 50,
      category_id: '',
    },
    // Stock negativo
    NEGATIVE_STOCK: {
      name: 'Producto Stock Inválido',
      price: 10000,
      stock: -10,
      category_id: '',
    },
    // Sin campos requeridos
    MISSING_REQUIRED: {
      name: 'Producto Incompleto',
      // Falta price
      // Falta stock
      // Falta category_id
    },
  },

  INVALID_CUSTOMER: {
    // Sin nombre
    NO_NAME: {
      phone: '573001234567',
      email: 'test@example.com',
    },
    // Sin teléfono
    NO_PHONE: {
      name: 'Cliente sin Teléfono',
      email: 'test@example.com',
    },
    // Email inválido
    INVALID_EMAIL: {
      name: 'Cliente Email Inválido',
      phone: '573001234567',
      email: 'no-es-email',
    },
  },
};

// Selectores CSS comunes para tests de UI
export const SELECTORS = {
  // Login
  LOGIN_EMAIL_INPUT: 'input[type="email"]',
  LOGIN_PASSWORD_INPUT: 'input[type="password"]',
  LOGIN_BUTTON: 'button:has-text("Iniciar Sesión")',

  // Dashboard
  DASHBOARD_HEADING: 'h1:has-text("Dashboard")',
  METRICS_CARDS: '.bg-white.rounded-xl.shadow-sm',

  // Productos
  PRODUCTS_TABLE: 'table',
  PRODUCTS_SEARCH_INPUT: 'input[placeholder*="Buscar"]',
  PRODUCTS_CATEGORY_SELECT: 'select',
  PRODUCTS_EDIT_BUTTON: 'button[title="Editar"]',
  PRODUCTS_DELETE_BUTTON: 'button[title="Eliminar"]',
  PRODUCTS_STATUS_BUTTON: 'button:has-text("Activo"), button:has-text("Inactivo")',

  // Modal de edición
  MODAL_TITLE: 'h2:has-text("Editar"), h3:has-text("Editar")',
  MODAL_SAVE_BUTTON: 'button:has-text("Guardar")',
  MODAL_CANCEL_BUTTON: 'button:has-text("Cancelar")',

  // Clientes
  CUSTOMERS_TABLE: 'table',
  CUSTOMERS_SEARCH_INPUT: 'input[placeholder*="Buscar"]',
  CUSTOMERS_NEW_BUTTON: 'button:has-text("Nuevo Cliente")',
  CUSTOMERS_EDIT_BUTTON: 'button:has-text("Editar")',
  CUSTOMERS_DELETE_BUTTON: 'button:has-text("Eliminar")',

  // Notificaciones/Toast
  SUCCESS_TOAST: '.bg-green-600, .fixed:has-text("✓")',
  ERROR_TOAST: '.bg-red-600, .fixed:has-text("✗")',
};

// Tiempos de espera (ms)
export const TIMEOUTS = {
  SHORT: 500,
  MEDIUM: 1000,
  LONG: 3000,
  EXTRA_LONG: 10000,
};

// Códigos de estado HTTP esperados
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};
