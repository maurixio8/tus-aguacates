/**
 * Fixtures de cupones para tests E2E
 * Cupones válidos e inválidos
 */

export const TEST_COUPONS = {
  // Cupones válidos
  VALID: {
    BIENVENIDO15: {
      code: 'BIENVENIDO15',
      description: '15% de descuento para nuevos clientes',
      discount: 15,
      type: 'percentage'
    },
    ENVIOGRATIS: {
      code: 'ENVIOGRATIS',
      description: 'Envío gratis',
      discount: 0,
      type: 'free_shipping'
    },
    BIENVENIDA10: {
      code: 'BIENVENIDA10',
      description: '10% de descuento',
      discount: 10,
      type: 'percentage'
    },
  },

  // Cupones inválidos
  INVALID: {
    NOT_FOUND: {
      code: 'CUPONNOEXISTE',
      description: 'Cupón que no existe en el sistema',
      expectedError: 'Cupón no encontrado o inválido'
    },
    EXPIRED: {
      code: 'EXPIRADO',
      description: 'Cupón expirado',
      expectedError: 'Cupón expirado'
    },
    WRONG_FORMAT: {
      code: 'CODIGO_ERRADO',
      description: 'Formato incorrecto',
      expectedError: 'Formato de cupón inválido'
    },
    EMPTY: {
      code: '',
      description: 'Código vacío',
      expectedError: 'Ingresa un código de cupón'
    },
  },

  // Mensajes esperados
  MESSAGES: {
    SUCCESS: 'Cupón aplicado correctamente',
    NOT_FOUND: 'Cupón no encontrado',
    INVALID: 'Cupón inválido',
    EXPIRED: 'Cupón expirado',
    MIN_AMOUNT: 'El monto mínimo para este cupón es',
  },
} as const;

// Shipping
export const SHIPPING = {
  COST_BOGOTA: 7400,
  FREE_SHIPPING_MIN: 68900,
  ESTIMATED_DAYS: 1,
} as const;
