# Guía de Testing - Tus Aguacates

## Estado Actual de Tests

### Resumen
- ✅ **119 tests pasando**
- ❌ 19 tests pendientes (principalmente integración)
- 📊 **86% de tests funcionando**

### Comandos de Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:ui

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar solo tests unitarios
npm run test:run

# Ejecutar tests e2e con Playwright
npm run test:e2e

# Ver UI de Playwright
npm run test:e2e:ui
```

## Configuración de Testing

### Vitest (Tests Unitarios e Integración)
- **Configuración**: `vitest.config.ts`
- **Setup**: `tests/setup/test-setup.ts`
- **Environment**: jsdom (para tests de React)

### MSW (Mock Service Worker)
- **Configuración**: `tests/setup/mocks/server.ts`
- **Propósito**: Interceptar y mockear llamadas HTTP/API
- **APIs mockeadas**:
  - Supabase REST API
  - Shipping API (`/api/shipping/calculate`)
  - Auth endpoints

### Playwright (Tests E2E)
- **Configuración**: `playwright.config.ts`
- **Browsers**: Chrome, Firefox, Safari, Mobile
- **Base URL**: http://localhost:3000

## Estructura de Tests

```
tests/
├── setup/
│   ├── test-setup.ts          # Configuración global
│   └── mocks/
│       └── server.ts           # Mocks de MSW
├── unit/                       # Tests unitarios
│   ├── shipping-calculation.test.ts  ✅ 15/15
│   ├── categorias-simple.test.ts     ✅ 9/9
│   └── categorias-unified.test.ts    ✅ 15/15
├── components/                 # Tests de componentes
│   ├── ProductQuickViewModal.test.tsx
│   └── ImageUploadModal.test.tsx
├── integration/                # Tests de integración
│   ├── purchase-flow.test.tsx
│   ├── cart-store.test.ts
│   └── payment-methods.test.tsx
└── e2e/                        # Tests end-to-end (Playwright)
```

## Arreglos Recientes

### 1. Mock de Supabase Mejorado
**Problema**: El mock original no soportaba múltiples `.eq()` encadenados.

**Solución**: Implementado un sistema chainable completo:
```typescript
const createChainableMock = () => {
  const chainable: any = {
    select: vi.fn(() => chainable),
    eq: vi.fn(() => chainable),
    order: vi.fn(() => chainable),
    // ... más métodos
    then: vi.fn((resolve) => resolve({ data: [], error: null })),
  };
  return chainable;
};
```

### 2. API de Shipping con MSW
**Problema**: La estructura de respuesta no coincidía con lo que esperaba `cart-store`.

**Solución**: Actualizado para retornar:
```json
{
  "success": true,
  "shipping": {
    "cost": 7400,
    "freeShipping": false,
    "freeShippingMin": 68900,
    "amountForFreeShipping": 38900,
    "estimatedDays": 1,
    "message": "Envío: $7.400"
  }
}
```

### 3. Tests de Shipping
**Cambio**: Migrados de `mockFetch` a MSW usando `server.use()` para casos específicos.

**Ejemplo**:
```typescript
it('debe manejar error HTTP', async () => {
  server.use(
    http.post('/api/shipping/calculate', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  await useCartStore.getState().calculateShipping();

  expect(store.shipping.cost).toBe(7400); // fallback
});
```

## Mejores Prácticas

### 1. Usar MSW para Mocks de API
```typescript
// ❌ No hacer
const mockFetch = vi.fn();
global.fetch = mockFetch;

// ✅ Hacer
import { server } from '../setup/mocks/server';
import { http, HttpResponse } from 'msw';

server.use(
  http.post('/api/endpoint', () => {
    return HttpResponse.json({ data: 'test' });
  })
);
```

### 2. Limpiar Estado entre Tests
```typescript
beforeEach(() => {
  useCartStore.getState().clearCart();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

### 3. Tests de Componentes React
- Usar archivos `.tsx` para tests con JSX
- Importar React explícitamente si es necesario
- Usar `@testing-library/react` para renderizar

## Próximos Pasos

### Tests Pendientes de Arreglar
1. **Tests de Integración** (purchase-flow, payment-methods)
   - Configurar mocks más completos de componentes
   - Revisar navegación y routing

2. **Tests E2E con Playwright**
   - Configurar servidor de desarrollo
   - Crear tests end-to-end completos

### Mejoras Sugeridas
1. Aumentar cobertura de tests unitarios
2. Agregar tests de hooks personalizados
3. Tests de accesibilidad con `@testing-library/jest-dom`
4. CI/CD para ejecutar tests automáticamente

## Recursos

- [Vitest Docs](https://vitest.dev/)
- [MSW Docs](https://mswjs.io/)
- [Testing Library](https://testing-library.com/)
- [Playwright Docs](https://playwright.dev/)

## Troubleshooting

### Error: "Expected '>' but found '/'"
**Causa**: JSX en archivo `.ts`
**Solución**: Renombrar a `.tsx` o mover JSX a archivo separado

### Error: "mockFetch is not defined"
**Causa**: Intentar usar `mockFetch` cuando MSW está activo
**Solución**: Usar `server.use()` para sobrescribir handlers de MSW

### Tests de Supabase fallan
**Causa**: Mock no soporta método encadenado
**Solución**: Verificar que el mock chainable incluye el método

### Error de timeout en tests
**Causa**: Operación asíncrona sin resolver
**Solución**: Verificar que todas las promesas están siendo esperadas con `await`

---

**Última actualización**: 2025-11-19
**Tests funcionando**: 119/138 (86%)
