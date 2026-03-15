# 🚀 Guía de Implementación: Integración Supabase Dashboard

## Resumen Ejecutivo

Se ha completado una **refactorización mayor** para consolidar el dashboard en **Supabase como única fuente de verdad**. Esto incluye:

✅ Dashboard migrado a Supabase API
✅ Errores de hidratación (#418) corregidos
✅ Página 404 global para App Router
✅ Políticas RLS creadas (lista para ejecutar)

**Estado:** 🟡 **90% Completo** - Falta ejecutar migración SQL en Supabase

---

## 1. Qué Se Hizo

### A. Dashboard (`/admin/productos`)

#### Antes (Legacy):
```
Productos → localStorage (saveProducts)
         → JSON file (/productos tus_aguacates.json)
         → React State
         → UI (modificaciones locales)
         → Supabase (solo imágenes)
```

#### Ahora (Modern):
```
Productos → Supabase Database
         → API endpoint (/api/admin/products)
         → React State
         → UI
         ↔ API PUT/DELETE (todas operaciones)
```

**Cambios Clave:**
- ❌ `getProductsSync()` - Eliminado
- ❌ `saveProducts()` - No se usa
- ❌ localStorage - No se toca
- ✅ `GET /api/admin/products` - Carga inicial
- ✅ `PUT /api/admin/products/[id]` - Editar/imagen
- ✅ `DELETE /api/admin/products/[id]` - Eliminar

### B. Corrección de Hidratación

#### Problema #418: Hydration Mismatch

**Ubicación:** `/app/admin/layout.tsx:175`

```typescript
// ❌ ANTES - Causa mismatch
<p>{new Date().toLocaleString('es-CO')}</p>
// Servidor: "18/11/2024, 15:30:45"
// Cliente (ms después): "18/11/2024, 15:30:46"
// React: "Mismatch! Hydration failed"
```

**Solución:** Mover a `useEffect`

```typescript
// ✅ DESPUÉS
const [currentTime, setCurrentTime] = useState('Cargando...');
useEffect(() => {
  setCurrentTime(new Date().toLocaleString('es-CO'));
}, []);
<p>{currentTime}</p>
// Servidor: "Cargando..."
// Cliente: "Cargando..." → actualiza a timestamp real
// React: "Match! Hydration success"
```

### C. Página 404 Global

**Archivo Nuevo:** `/app/not-found.tsx`

Cubre:
- Rutas inexistentes → página amigable
- _rsc 404s → mejor experiencia
- Enlace de vuelta a tienda/admin

---

## 2. Próximos Pasos: Migración RLS en Supabase

**Este paso es CRÍTICO y debe hacerse AHORA**

### Opción A: CLI (Recomendado)

```bash
cd /home/user/tus-aguacates
supabase db push
```

Esta comando ejecuta:
- `supabase/migrations/20240101_add_products_rls_policies.sql`
- Habilita RLS en tabla `products`
- Crea 5 políticas SELECT/INSERT/UPDATE/DELETE
- Configura Storage bucket `product-images` con 4 políticas

### Opción B: Dashboard Supabase (Manual)

1. Abre https://app.supabase.com
2. Selecciona proyecto **gxqkmaaqoehydulksudj** (tus-aguacates)
3. **SQL Editor** → **New query**
4. Copia contenido de `supabase/migrations/20240101_add_products_rls_policies.sql`
5. Ejecuta el query
6. Verifica que aparezca: `Query succeeded`

### Opción C: Si No Tienes Supabase CLI

Contacta al equipo de DevOps para que ejecute:

```sql
-- Archivo: supabase/migrations/20240101_add_products_rls_policies.sql
-- Ejecutar en SQL Editor del proyecto gxqkmaaqoehydulksudj
```

---

## 3. Verificación de Cambios

### Pre-Verificación: API Endpoints

```bash
# En local (después de 'npm run dev'):
curl -H "Cookie: admin-token=..." http://localhost:3000/api/admin/products
# Debe retornar: {"data": [...], "meta": {...}}
```

### Test 1: Cargar Dashboard en Local

```
1. npm run dev
2. Abre http://localhost:3000/admin/productos
3. Espera que cargue (debe decir "Cargando productos...")
4. Verifica en console (F12):
   - ✅ "📥 Cargando productos de Supabase..."
   - ✅ "✅ N productos cargados de Supabase"
   - ❌ Ningún error sobre localStorage
   - ❌ Ningún error de hidratación
```

### Test 2: Sincronizar Productos

```
1. En http://localhost:3000/admin/productos
2. Haz clic en botón "🔄 Sincronizar"
3. Debe mostrar:
   - "Sincronizando..." mientras carga
   - Alert: "✅ Sincronización completada\nN productos..."
4. Verifica en console:
   - ✅ "🔄 Sincronizando productos..."
   - ✅ "✅ Sincronización completada: N productos"
```

### Test 3: Toggle Estado Producto

```
1. En tabla de productos, haz clic en botón "✅ Activo" o "❌ Inactivo"
2. Debe cambiar estado inmediatamente
3. Verifica en console:
   - ✅ "✅ Estado del producto actualizado"
4. Recarga página → debe mantener el estado (confirma sync)
```

### Test 4: Cargar Imagen

```
1. Haz clic en "🖼️ Imagen" en producto
2. Sube una imagen desde tu computadora
3. Debe mostrar:
   - "Validando imagen..."
   - "Comprimiendo..."
   - "Subiendo a Supabase..."
   - "✅ Completado"
4. Verifica en console:
   - ✅ "🔄 Sincronizando imagen con Supabase..."
   - ✅ "✅ Imagen sincronizada exitosamente con Supabase"
5. Recarga página → imagen debe persistir
```

### Test 5: Eliminar Producto

```
1. Haz clic en "🗑️ Eliminar" en producto
2. Confirma eliminación
3. Producto debe desaparecer de la tabla
4. Recarga página → producto no debe aparecer
5. Verifica en Supabase Dashboard:
   - Abre tabla 'products'
   - Filtra por ese ID → NO debe existir
```

### Test 6: Hidratación Corregida

```
1. Abre http://localhost:3000/admin
2. Abre DevTools (F12) → Console
3. Busca mensajes de error que contengan:
   - "Hydration mismatch"
   - "Expected..."
   - "but got..."
4. ✅ NO debe haber ninguno
5. La página debe renderizar sin warnings
```

### Test 7: 404 Global

```
1. Abre http://localhost:3000/admin/pedidos (ruta inexistente)
2. Debe mostrar página con:
   - Emoji 🥑 grande
   - Texto "404 - Página no encontrada"
   - Botones "Volver a la tienda" y "Ir al panel admin"
3. Haz clic en "Volver a la tienda" → debe ir a /
```

---

## 4. Flujo de Operaciones (Ahora Implementado)

### Crear Producto

**Antes:** Guardaba en localStorage
**Ahora:** Llamaría a POST `/api/admin/products` (API endpoint existe)

```typescript
const response = await fetch('/api/admin/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newProduct)
});
```

### Editar Producto

```typescript
// ✅ Implementado en dashboard
const response = await fetch(`/api/admin/products/${productId}`, {
  method: 'PUT',
  body: JSON.stringify({ name, price, stock, is_active, ... })
});
```

### Eliminar Producto

```typescript
// ✅ Implementado en dashboard
const response = await fetch(`/api/admin/products/${productId}`, {
  method: 'DELETE'
});
```

### Subir Imagen

```typescript
// ✅ Implementado en dashboard
// 1. ImageUploadModal sube a Storage
// 2. Obtiene URL pública
// 3. PUT /api/admin/products/{id} actualiza main_image_url
```

---

## 5. Checklist de Verificación Completa

### En Desarrollo (Local)

- [ ] Dashboard carga sin errores
- [ ] Consola muestra "Cargando productos de Supabase..."
- [ ] Botón "Sincronizar" funciona
- [ ] Toggle estado/activo funciona
- [ ] Subir imagen funciona y sincroniza
- [ ] Eliminar producto funciona
- [ ] NO hay errores de hidratación (#418)
- [ ] Página 404 es amigable

### En Producción (Vercel)

- [ ] https://tus-aguacates-57vp.vercel.app/admin/productos carga
- [ ] Mismas funcionalidades que en local
- [ ] NO hay 404 con "_rsc" en DevTools
- [ ] Imágenes se sincronizan a Supabase

### En Supabase

- [ ] Tabla `products` tiene RLS habilitada
- [ ] Existen 5 políticas en tabla `products`
- [ ] Bucket `product-images` existe
- [ ] Existen 4 políticas en storage.objects para `product-images`
- [ ] SELECT/INSERT/UPDATE/DELETE funcionan para `auth.role() = 'authenticated'`

---

## 6. Archivos Modificados

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| `app/admin/productos/page.tsx` | Completa reescritura para usar Supabase | +470 |
| `app/admin/layout.tsx` | Corregir hidratación (Date.now) | +19 |
| `app/not-found.tsx` | Nuevo - 404 global | +38 |
| `supabase/migrations/20240101_add_products_rls_policies.sql` | Políticas RLS | +140 |
| `SUPABASE_RLS_SETUP.md` | Documentación RLS | +200 |

---

## 7. Commits Realizados

```
2b31138 🔄 Refactor: Migrar dashboard a Supabase y corregir hidratación
6161505 🔒 Fix: Implementar sincronización de imágenes con Supabase y políticas RLS
0572b86 ✅ Agregar suite completa de tests: integración, componentes y E2E
```

---

## 8. Errores Conocidos & Soluciones

### Error: "No autenticado" en `/api/admin/products`

**Causa:** Cookie `admin-token` no establecida

**Solución:**
```
1. Abre http://localhost:3000/admin/login
2. Inicia sesión con una cuenta administrativa autorizada
3. Intenta de nuevo
```

### Error: "new row violates row-level security policy"

**Causa:** RLS no está configurada correctamente

**Solución:**
```
1. Ejecuta migración: supabase db push
2. Verifica en Supabase Dashboard:
   - Database > Tables > products > Policies
   - Debe haber 5 políticas
3. Recarga dashboard
```

### Error: "Cannot read property 'toLocaleString' of undefined"

**Causa:** Estado `currentTime` no inicializado en SSR

**Solución:** Ya corregido en layout.tsx - está usando `useEffect`

### 404 en `/admin/pedidos` ruta inexistente

**Comportamiento Correcto:**
- ✅ Debe mostrar página amigable
- ✅ Con botón "Volver a la tienda"
- ❌ No debe mostrar error genérico

---

## 9. Próximos Pasos Después de Migración RLS

1. **Crear endpoints para operaciones faltantes:**
   - POST `/api/admin/products` para crear (existe, pero no se llama desde UI)
   - PATCH `/api/admin/products/[id]` para actualizaciones parciales (opcional)

2. **Implementar secciones del admin:**
   - `/admin/pedidos` (órdenes)
   - `/admin/categorias` (categorías)
   - `/admin/cupones` (promociones)
   - `/admin/clientes` (usuarios)

3. **Optimizaciones:**
   - Caché de productos en cliente (SWR/React Query)
   - Paginación en tablas
   - Búsqueda server-side con filtros

---

## 10. Soporte & Referencias

### Documentación:
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Next.js App Router: https://nextjs.org/docs/app
- Next.js Hydration: https://nextjs.org/docs/messages/react-hydration-error

### Archivos de Referencia:
- `SUPABASE_RLS_SETUP.md` - Detalles sobre políticas RLS
- `supabase/migrations/20240101_add_products_rls_policies.sql` - SQL a ejecutar
- `/app/admin/productos/page.tsx` - Dashboard actualizado

---

## 11. Resumen de Comandos Útiles

```bash
# Ejecutar migración RLS
supabase db push

# Verificar estado de migraciones
supabase migration list

# Ver logs de Supabase
supabase log

# Ejecutar en local
npm run dev

# Build para producción
npm run build
npm start

# Conectar a Supabase en local
supabase start
supabase stop
```

---

**Estado Actual:** 🟡 Esperando ejecución de migración RLS
**ETA:** Inmediato después de ejecutar `supabase db push`
**Bloqueador:** Ninguno (todo el código está listo)

---

**Última actualización:** 17 de Noviembre, 2024
**Autor:** Claude Code AI
**Versión:** 1.0 - Dashboard Integration Complete
