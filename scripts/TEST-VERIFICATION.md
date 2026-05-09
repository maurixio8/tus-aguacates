# Plan de Pruebas — Tus Aguacates
**Fecha:** 2026-05-09  
**Preparado por:** Luz

---

## 1. Precios y Variantes (✅ Fix deployado)

### Problema reportado
Mao cambiaba precio de producto en admin/productos pero no se veía en admin/crear-pedido.

### Fix
Se agregó listener de `window.addEventListener('focus')` para recargar catálogo al volver a la pestaña.

### Prueba
1. Ir a `/admin/productos`
2. Editar precio de "Caja 24 unidades" → cambiar a $17,600
3. Ir a `/admin/crear-pedido` (cambiar de pestaña)
4. Buscar "Caja 24" → verificar precio nuevo

**Esperado:** Precio actualizado inmediatamente al cambiar de pestaña.

---

## 2. Direcciones de Clientes

### Problema reportado
Dirección de cliente se actualizaba en admin pero no se veía en checkout. Cliente vía WhatsApp no podía cambiar dirección.

### Causa raíz
3 bases de datos desconectadas:
- `n8n Postgres → clientes.direccion` (bot WhatsApp)
- `Supabase → customers.address` (admin)
- `Supabase → addresses` (checkout)

### Fix aplicado
`/api/admin/customers/route.ts` ahora sincroniza `customers` → `addresses` al guardar.

### Prueba admin → checkout
1. Ir a `/admin/clientes`
2. Buscar cliente existente
3. Cambiar dirección → guardar
4. Hacer pedido como cliente (login con ese teléfono)
5. Ir a checkout → verificar dirección actualizada

**Esperado:** Dirección guardada en admin aparece en checkout.

### Prueba WhatsApp → sistema
1. Cliente dice por WhatsApp "cambia mi dirección a..."
2. Bot guarda en `clientes.direccion`
3. **PROBLEMA:** Bot no sincroniza con Supabase `addresses`
4. Verificar si el fix del admin resuelve el problema

**Nota:** El bot de WhatsApp (n8n) actualiza su propia tabla pero NO Supabase. Se necesita sync adicional.

---

## 3. QR y Link de Pago

### Problema reportado
QR y link de pago no funcionan.

### Causa raíz
`BOLD_API_KEY` NO está configurada. El código está en modo mock:

```javascript
// lib/bold-pay.ts línea 116
// TODO: Implementar llamada real cuando tengamos credenciales
// Respuesta mock...
payment_link_id: `mock-${orderId}`,
payment_link_url: `https://checkout.bold.co/mock/${orderId}`,
```

### Prueba
1. Hacer pedido en checkout
2. Seleccionar método de pago "Link de pago Bold"
3. Generar link
4. **Verificado:** Link generado es mock (fake)

**Acción requerida:** Configurar credenciales Bold en Vercel Environment Variables.

---

## 4. Lista de Compras B2B

### Problema reportado
"A veces no queda bien" — Mao necesita especificar qué falla.

### Áreas a probar
1. **Catálogo B2B** — `/b2b` o `/business`
   - ¿Se muestran productos con precios por volumen?
   - ¿Los filtros funcionan?

2. **Agregar a lista** — crear orden/pedido B2B
   - ¿Se guarda correctamente?
   - ¿Los precios por volumen se aplican?

3. **Checkout B2B** — `/api/b2b/checkout`
   - ¿Orden se crea en base de datos?

### Prueba rápida
1. Ir a sección B2B de la tienda
2. Buscar producto con precios por volumen
3. Agregar al carrito con cantidad
4. Completar checkout
5. Verificar en `/admin/b2b/orders`

**Nota:** Si "no queda bien", Mao necesita especificar el error exacto.

---

## 5. Dashboard Admin — Otras áreas

### Áreas a verificar
| Área | Qué probar |
|------|------------|
| `/admin/productos` | Crear, editar, eliminar producto |
| `/admin/crear-pedido` | Crear pedido manual completo |
| `/admin/pedidos` | Ver pedidos, cambiar estado |
| `/admin/clientes` | Buscar, crear, editar cliente |
| `/admin/b2b/companies` | CRUD de empresas B2B |

---

## Resumen de Issues Encontrados

| # | Issue | Prioridad | Status |
|---|-------|----------|--------|
| 1 | Precio no actualiza (cache) | Alta | ✅ Fix deployado |
| 2 | Direcciones no sincronizan | Alta | ✅ Fix deployado |
| 3 | Bold sin credenciales (mock) | Alta | 🔴 Sin fix — requiere credenciales |
| 4 | Bot WhatsApp → Supabase sync | Alta | 🟡 Gap — requiere desarrollo adicional |
| 5 | B2B lista de compras | Media | 🟡 Por investigar |

---

## Comandos útiles para debug

```bash
# Ver logs de la tienda en Vercel
# Ir a Vercel Dashboard → tus-aguacates → Logs

# Verificar estado del deploy
curl -sI https://tus-aguacates.vercel.app/api/products | grep -i vercel-cache

# Probar API admin customers
# (necesita cookie de sesión admin)
```

---

## Siguientes Pasos
1. [ ] Mao prueba fix de precios y direcciones
2. [ ] Especificar error en B2B lista de compras
3. [ ] Configurar credenciales Bold
4. [ ] Evaluar sync WhatsApp → Supabase
