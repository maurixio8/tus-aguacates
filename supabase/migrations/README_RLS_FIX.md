# Corrección de Problemas de Seguridad RLS

## Fecha: 2025-12-11

## Resumen
Esta migración soluciona todos los problemas de seguridad críticos relacionados con Row Level Security (RLS) identificados en el dashboard de Supabase.

## Problemas Resueltos

### 1. RLS Deshabilitado en Tablas Públicas
**Tablas afectadas:**
- ✅ `public.coupon_usage`
- ✅ `public.coupons`
- ✅ `public.guest_orders`
- ✅ `public.purchase_items`
- ✅ `public.purchases`
- ✅ `public.shipping_rules`
- ✅ `public.suppliers`
- ✅ `public.wishlist_items`

**Solución:** Se habilitó RLS en todas las tablas y se crearon políticas de seguridad apropiadas.

### 2. Function Search Path Mutable
**Función afectada:** `public.ensure_single_default_address()`

**Problema:** La función no tenía un search_path seguro, lo que podría permitir ataques de inyección.

**Solución:** Se recreó la función con:
```sql
SECURITY DEFINER
SET search_path = public, pg_temp
```

## Políticas de Seguridad Implementadas

### Coupons (Cupones)
- 📖 **Lectura pública:** Usuarios anónimos pueden ver cupones activos y válidos
- 🔒 **Escritura admin:** Solo usuarios autenticados pueden crear/editar/eliminar cupones

### Coupon Usage (Uso de Cupones)
- 📖 **Lectura pública:** Cualquiera puede consultar el uso de cupones (para validación)
- ✍️ **Escritura pública:** Cualquiera puede registrar uso de cupones (al hacer pedidos)
- 🔒 **Modificación admin:** Solo admins pueden actualizar/eliminar registros

### Shipping Rules (Reglas de Envío)
- 📖 **Lectura pública:** Usuarios anónimos pueden ver reglas activas
- 🔒 **Escritura admin:** Solo admins pueden gestionar reglas de envío

### Guest Orders (Pedidos de Invitados)
- ✍️ **Creación pública:** Cualquiera puede crear pedidos (incluso usuarios anónimos)
- 🔒 **Gestión admin:** Solo admins pueden ver/actualizar/eliminar pedidos

### Purchases & Purchase Items (Compras a Proveedores)
- 🔒 **Solo admin:** Acceso completo solo para usuarios autenticados

### Suppliers (Proveedores)
- 🔒 **Solo admin:** Acceso completo solo para usuarios autenticados

### Wishlist Items (Lista de Deseos)
- 👤 **Usuario:** Cada usuario solo puede ver/gestionar sus propios items
- 🔒 **Admin:** Los admins pueden ver todos los items de wishlist

## Tablas Creadas

Si no existían previamente, se crearon las siguientes tablas:
- `purchases` - Órdenes de compra a proveedores
- `purchase_items` - Items de cada orden de compra
- `suppliers` - Directorio de proveedores
- `wishlist_items` - Listas de deseos de usuarios

## Cómo Aplicar Esta Migración

### Opción 1: Supabase Dashboard (Recomendado)
1. Ir al SQL Editor en Supabase Dashboard
2. Abrir el archivo `20251211_fix_all_rls_security_issues.sql`
3. Copiar todo el contenido
4. Ejecutar en el SQL Editor
5. Verificar que no haya errores

### Opción 2: Supabase CLI
```bash
supabase db push
```

## Verificación Post-Migración

Después de aplicar la migración, verifica que:

1. ✅ No haya errores críticos en el dashboard de Supabase
2. ✅ Los usuarios anónimos puedan:
   - Ver productos
   - Ver cupones activos
   - Ver reglas de envío
   - Crear pedidos
3. ✅ Los usuarios autenticados (admins) puedan:
   - Gestionar productos
   - Gestionar cupones
   - Ver y gestionar pedidos
   - Gestionar proveedores y compras

## Pruebas Recomendadas

### Como Usuario Anónimo
```sql
-- Debe funcionar
SELECT * FROM coupons WHERE is_active = true;
SELECT * FROM shipping_rules WHERE is_active = true;

-- Debe fallar (sin acceso)
SELECT * FROM purchases;
SELECT * FROM suppliers;
```

### Como Usuario Autenticado
```sql
-- Debe funcionar todo
SELECT * FROM guest_orders;
SELECT * FROM purchases;
SELECT * FROM suppliers;
```

## Notas Importantes

- 🔐 **Seguridad mejorada:** Todas las tablas ahora tienen protección RLS activa
- 🎯 **Principio de mínimo privilegio:** Los usuarios solo tienen acceso a lo necesario
- ⚡ **Performance:** Se agregaron índices apropiados en todas las tablas nuevas
- 📝 **Documentación:** Se agregaron comentarios en las políticas y tablas

## Soporte

Si encuentras algún problema después de aplicar esta migración:
1. Revisa los logs de Supabase
2. Verifica que las políticas RLS estén activas
3. Confirma que los roles de usuario estén configurados correctamente

---

**Autor:** Claude
**Fecha:** 2025-12-11
**Versión:** 1.0
