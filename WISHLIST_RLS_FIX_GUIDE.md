# 🔧 Guía para Arreglar el Error de Wishlist (RLS Policy Violation)

## 📋 Problema Identificado

**Error:** `code: '42501', message: 'new row violates row-level security policy for table "wishlist"'`

**Causa:** La tabla `wishlist` en Supabase no tiene las políticas RLS (Row Level Security) configuradas correctamente, lo que impide que los usuarios autenticados puedan agregar productos a sus favoritos.

## ✅ Solución

La solución consiste en aplicar una migración SQL que crea las políticas RLS necesarias para permitir que los usuarios autenticados gestionen su propia wishlist.

### Archivo de Migración Creado

📁 `supabase/migrations/20251212_fix_wishlist_rls_policies.sql`

Este archivo contiene las políticas RLS que permiten:
- ✅ Ver sus propios productos favoritos (SELECT)
- ✅ Agregar productos a favoritos (INSERT)
- ✅ Eliminar productos de favoritos (DELETE)
- ✅ Actualizar items de wishlist (UPDATE, para futuras funcionalidades)

## 🚀 Cómo Aplicar la Migración

### Opción 1: Usar el SQL Editor de Supabase (Recomendado)

1. **Abre Supabase Dashboard:**
   - Ve a https://app.supabase.com
   - Selecciona el proyecto **tus-aguacates**

2. **Abre el SQL Editor:**
   - En el menú lateral, haz clic en **SQL Editor**
   - Haz clic en **+ New query**

3. **Copia y pega el SQL:**
   - Abre el archivo `supabase/migrations/20251212_fix_wishlist_rls_policies.sql`
   - Copia TODO el contenido
   - Pégalo en el editor SQL

4. **Ejecuta la migración:**
   - Haz clic en el botón **Run** (o presiona `Ctrl/Cmd + Enter`)
   - Verifica que se ejecute sin errores

5. **Verifica que las políticas se crearon:**
   - Al final de la ejecución, deberías ver una tabla con las políticas creadas
   - Deberían aparecer 5 políticas para la tabla `wishlist`

### Opción 2: Usar Supabase CLI (Si tienes configurada la CLI localmente)

```bash
# Desde la raíz del proyecto
supabase db push

# O aplicar solo esta migración específica
supabase migration up
```

## 🔍 Verificar que Funciona

Después de aplicar la migración:

### 1. Verificar en el Dashboard de Supabase

1. Ve a **Database** → **Tables** → **wishlist**
2. Haz clic en la pestaña **Policies**
3. Deberías ver las siguientes políticas:
   - ✅ `Users can view their own wishlist`
   - ✅ `Users can insert their own wishlist items`
   - ✅ `Users can delete their own wishlist items`
   - ✅ `Users can update their own wishlist items`
   - ✅ `Service role has full access to wishlist`

### 2. Probar la Funcionalidad

1. **Cierra sesión y vuelve a iniciar sesión** en la aplicación (importante para refrescar permisos)
2. **Ve a cualquier página de categoría:**
   - https://tus-aguacates-57vp.vercel.app/tienda/aguacates
   - https://tus-aguacates-57vp.vercel.app/tienda/frutas-tropicales
3. **Haz clic en el ícono de corazón (❤️)** de cualquier producto
4. **Verifica en la consola del navegador:**
   - Deberías ver: `✅ [WISHLIST-API] Product added to wishlist successfully`
   - NO deberías ver: `❌ [WISHLIST-API] Error adding to wishlist`

5. **Ve a tu página de favoritos:**
   - https://tus-aguacates-57vp.vercel.app/perfil/favoritos
   - El producto debería aparecer en la lista

### 3. Verificar en los Logs de Vercel

Si todo funciona correctamente, los logs de Vercel deberían mostrar:

```
✅ [WISHLIST-API] User authenticated in POST: 219488db-1bda-4ac6-a961-8affe601bcb6
📝 [WISHLIST-API] Request body: { product_id: '111137d1-a3aa-4c92-9e27-38283a4c06e4' }
✅ [WISHLIST-API] Product exists, checking if already in wishlist
📝 [WISHLIST-API] Adding product to wishlist: 111137d1-a3aa-4c92-9e27-38283a4c06e4
✅ [WISHLIST-API] Product added to wishlist successfully
```

**SIN** el error anterior de RLS:
```
❌ [WISHLIST-API] Error adding to wishlist: {
  code: '42501',
  message: 'new row violates row-level security policy for table "wishlist"'
}
```

## 🐛 Solución de Problemas

### Error: "relation 'wishlist' does not exist"

**Causa:** La tabla `wishlist` no existe en la base de datos.

**Solución:**
1. Primero necesitas crear la tabla `wishlist`. Ejecuta este SQL en Supabase:

```sql
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON public.wishlist(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_created_at ON public.wishlist(created_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_wishlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wishlist_updated_at
  BEFORE UPDATE ON public.wishlist
  FOR EACH ROW
  EXECUTE FUNCTION update_wishlist_updated_at();
```

2. Luego ejecuta el archivo de migración RLS (`20251212_fix_wishlist_rls_policies.sql`)

### Error: "policy already exists"

**Causa:** Las políticas ya fueron creadas anteriormente.

**Solución:** Esto es normal. El script usa `DROP POLICY IF EXISTS` antes de crear cada política, así que no debería haber conflictos. Si aún así hay errores, puedes eliminar manualmente las políticas existentes en el dashboard de Supabase y volver a ejecutar la migración.

### Los favoritos no se guardan después de aplicar la migración

**Posibles causas:**
1. El usuario no cerró sesión después de aplicar la migración
2. El token de autenticación está expirado
3. Hay un problema con el UUID del producto

**Solución:**
1. Cierra sesión completamente en la aplicación
2. Vuelve a iniciar sesión
3. Abre las herramientas de desarrollador (F12)
4. Ve a la pestaña Console
5. Intenta agregar un producto a favoritos
6. Revisa los mensajes de log detallados

## 📊 Impacto de los Cambios

### Antes de la Migración
- ❌ Error 500 al intentar agregar productos a favoritos
- ❌ Violación de política RLS (código 42501)
- ❌ Usuarios no pueden usar la funcionalidad de wishlist

### Después de la Migración
- ✅ Usuarios pueden agregar productos a favoritos desde cualquier página
- ✅ Los favoritos se guardan correctamente en Supabase
- ✅ Cada usuario solo puede ver y modificar su propia wishlist
- ✅ Seguridad mejorada con políticas RLS apropiadas

## 🔐 Seguridad

Las políticas RLS creadas garantizan que:
- ✅ Cada usuario solo puede acceder a su propia wishlist
- ✅ No es posible ver los favoritos de otros usuarios
- ✅ No es posible agregar/eliminar productos de la wishlist de otros usuarios
- ✅ El service_role (admin) tiene acceso completo para gestión

## 📝 Próximos Pasos

1. ✅ Aplicar la migración SQL en Supabase
2. ✅ Verificar las políticas en el dashboard
3. ✅ Probar la funcionalidad en producción
4. ✅ Monitorear los logs de Vercel para confirmar que no hay más errores RLS
5. 📋 Considerar agregar tests automatizados para la funcionalidad de wishlist

---

**Creado:** 2025-12-12
**Versión de Migración:** 20251212_fix_wishlist_rls_policies.sql
**Issue:** Fix RLS policy violation (code 42501) when adding products to favorites
