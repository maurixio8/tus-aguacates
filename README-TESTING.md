# 🧪 Guía de Testing - Flujo de Compra Completo

Documentación completa para ejecutar y entender los tests de integración del sistema de e-commerce "Tus Aguacates".

## 📋 Resumen de Tests

Se ha creado una suite completa de tests que verifica el flujo completo de compra:

```
ProductCard → CartStore → CartDrawer → Checkout → Confirmación
```

## 🗂️ Estructura de Tests

```
tests/
├── integration/
│   ├── purchase-flow.test.tsx     # Tests de integración completos
│   └── cart-store.test.ts         # Tests unitarios del store
├── e2e/
│   └── purchase-flow.spec.ts      # Tests E2E con Playwright
├── setup/
│   ├── test-setup.ts              # Configuración global
│   └── mocks/
│       └── server.ts              # Mock server para API
├── vitest.config.ts               # Configuración Vitest
├── playwright.config.ts           # Configuración Playwright
└── README-TESTING.md              # Este archivo
```

## 🎯 Cobertura de Tests

### ✅ **Tests de Integración** (`purchase-flow.test.tsx`)

1. **ProductCard → Cart Integration**
   - ✅ Agregar productos sin variantes
   - ✅ Agregar productos con variantes
   - ✅ Manejo de productos agotados
   - ✅ Actualización de precios con descuentos

2. **CartDrawer - Gestión del Carrito**
   - ✅ Visualización de productos agregados
   - ✅ Modificación de cantidades (+/-)
   - ✅ Eliminación de items individuales
   - ✅ Cálculo correcto de totales
   - ✅ Navegación al checkout

3. **Checkout - Proceso de Pedido**
   - ✅ Validación de formulario completo
   - ✅ Manejo de cuenta opcional
   - ✅ Procesamiento de pedido contra entrega
   - ✅ Redirección a confirmación

4. **Flujo Completo End-to-End**
   - ✅ Producto → Carrito → Checkout → Confirmación
   - ✅ Múltiples productos con variantes
   - ✅ Persistencia del estado
   - ✅ Manejo de errores

### ✅ **Tests Unitarios** (`cart-store.test.ts`)

- ✅ `addItem()` - Agregar productos (con/sin variantes)
- ✅ `updateQuantity()` - Modificar cantidades
- ✅ `removeItem()` - Eliminar items específicos
- ✅ `getTotal()` - Cálculo de totales
- ✅ `getItemCount()` - Conteo de items
- ✅ `toggleCart()` - Visibilidad del carrito
- ✅ `clearCart()` - Vaciar carrito
- ✅ Persistencia en localStorage
- ✅ Edge cases y validaciones

### ✅ **Tests E2E** (`purchase-flow.spec.ts`)

- ✅ Flujo completo como usuario real
- ✅ Múltiples productos y variantes
- ✅ Modificación y eliminación en carrito
- ✅ Validación de formularios
- ✅ Creación de cuenta opcional
- ✅ Redirecciones automáticas
- ✅ Persistencia del carrito
- ✅ Manejo de productos agotados
- ✅ Responsividad en móvil
- ✅ Accesibilidad y navegación por teclado

## 🚀 Instalación y Configuración

### 1. Instalar Dependencias de Testing

```bash
# Actualizar package.json con las dependencias de testing
cat package.json.test-patch >> package.json

# O instalar manualmente
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jsdom msw
npm install -D playwright @playwright/test
```

### 2. Instalar Navegadores para E2E

```bash
npx playwright install
```

### 3. Configurar Variables de Entorno

Crear `.env.test`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-key
```

## 🏃‍♂️ Ejecutar Tests

### **Tests Unitarios y de Integración**

```bash
# Ejecutar todos los tests en modo watch
npm run test

# Ejecutar una sola vez
npm run test:run

# Ver interfaz gráfica
npm run test:ui

# Generar reporte de cobertura
npm run test:coverage
```

### **Tests E2E**

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Ver interfaz gráfica de Playwright
npm run test:e2e:ui

# Debug con browser abierto
npm run test:e2e:debug

# Ejecutar todos los tests (unitarios + E2E)
npm run test:all
```

## 📊 Reportes y Resultados

### **Cobertura de Código**

```bash
npm run test:coverage
```

Genera reporte en `coverage/index.html` con:
- Líneas cubiertas
- Funciones probadas
- Branches cubiertos
- Statements cubiertos

### **Reportes E2E**

```bash
npm run test:e2e -- --reporter=html
```

Genera reporte en `playwright-report/index.html` con:
- Capturas de pantalla
- Videos de ejecución
- Trace de errores
- Tiempos de respuesta

## 🛠️ Arquitectura de Tests

### **Mock Server**

Se utiliza MSW (Mock Service Worker) para simular las respuestas de Supabase:

```typescript
// GET productos
rest.get('/rest/v1/products', (req, res, ctx) => {
  return res(ctx.json(mockProducts));
});

// POST pedidos
rest.post('/rest/v1/guest_orders', (req, res, ctx) => {
  return res(ctx.json({ id: 'order-123' }));
});
```

### **Test Components**

Los componentes se renderizan con `TestWrapper`:

```typescript
const TestWrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);
```

### **Estado del Carrito**

Los tests verifican el estado de Zustand:

```typescript
const { items, getTotal, addItem } = useCartStore.getState();
expect(items).toHaveLength(1);
expect(getTotal()).toBe(4500);
```

## 🔍 Debugging

### **Tests Unitarios**

```bash
# Modo watch con logs detallados
npm run test -- --reporter=verbose

# Debug con breakpoints
debugger; // En el código del test
```

### **Tests E2E**

```bash
# Modo interactivo
npm run test:e2e:debug

# Generar screenshots
npm run test:e2e -- --screenshots=on

# Grabar videos
npm run test:e2e -- --video=on
```

## 📝 Mejores Prácticas

### **1. Organización de Tests**

- Describir el comportamiento esperado
- Agrupar tests por funcionalidad
- Usar nombres descriptivos

```typescript
describe('🛒 ProductCard → Cart Integration', () => {
  test('✅ Debe agregar producto sin variantes al carrito', async () => {
    // Test implementation
  });
});
```

### **2. Datos de Prueba**

- Usar datos consistentes
- Mockear respuestas reales
- Verificar edge cases

```typescript
const mockProduct = {
  id: 'prod-1',
  name: 'Aguacate Hass Premium',
  price: 5000,
  // ... más campos
};
```

### **3. Asincronía**

- Usar `waitFor` para DOM asíncrono
- `await` para acciones del usuario
- Verificar estados intermedios

```typescript
await waitFor(() => {
  expect(screen.getByText('Mi Carrito')).toBeInTheDocument();
});
```

### **4. Limpieza**

- Resetear estado antes de cada test
- Limpiar mocks
- Evitar contaminación entre tests

```typescript
beforeEach(() => {
  useCartStore.getState().clearCart();
});
```

## 🚨 Errores Comunes

### **Problemas con Hydrate**

```typescript
// Solución: Esperar a que el componente monte
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
```

### **Problemas con Fetch**

```typescript
// Solución: Mockear fetch global
global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({ data: mockData })
}));
```

### **Problemas con LocalStorage**

```typescript
// Solución: Mockear localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;
```

## 📈 Métricas de Calidad

### **Cobertura Objetivo**

- ✅ **Statements**: > 90%
- ✅ **Branches**: > 85%
- ✅ **Functions**: > 95%
- ✅ **Lines**: > 90%

### **Tests Creados**

- ✅ **15+ Tests de Integración**
- ✅ **25+ Tests Unitarios**
- ✅ **10+ Tests E2E**
- ✅ **5 Escenarios de Error**

### **Flujos Verificados**

- ✅ **Happy Path**: Compra exitosa completa
- ✅ **Variants**: Productos con múltiples presentaciones
- ✅ **Validation**: Formularios con validación
- ✅ **Error Handling**: Manejo de errores y edge cases
- ✅ **Accessibility**: Navegación y usabilidad

## 🔄 Integración CI/CD

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:e2e
```

---

## 🎯 Conclusión

Esta suite de tests proporciona:

✅ **Cobertura completa** del flujo de compra
✅ **Validación automática** de funcionalidades
✅ **Prevención de regresiones**
✅ **Documentación viva** del sistema
✅ **Confianza** en despliegues

Los tests aseguran que el flujo de compra funcione correctamente en todos los escenarios, proporcionando una base sólida para el desarrollo continuo del sistema e-commerce.