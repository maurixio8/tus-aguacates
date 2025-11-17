# 🔒 Configuración de Políticas RLS en Supabase

Este documento describe las políticas de Row Level Security (RLS) necesarias para que la subida de imágenes funcione correctamente en Supabase.

## 📋 Resumen de Cambios

Se han añadido políticas RLS para:
1. **Tabla `products`**: Control de acceso para lectura y actualización
2. **Storage `product-images`**: Control de acceso para subida y descarga de imágenes

## 🚀 Cómo Aplicar Cambios en Supabase

### Opción 1: Usar la CLI de Supabase (Recomendado)

```bash
# Si tienes supabase CLI instalado
supabase db push
```

### Opción 2: SQL Editor en Dashboard de Supabase

1. Abre https://app.supabase.com
2. Selecciona el proyecto **tus-aguacates** (URL: gxqkmaaqoehydulksudj)
3. Ve a **SQL Editor** > **New query**
4. Copia el contenido de `supabase/migrations/20240101_add_products_rls_policies.sql`
5. Ejecuta el query

## 📝 Detalle de Políticas Creadas

### Products Table RLS

```sql
-- Política 1: Público puede ver productos activos
-- Permite que cualquiera vea productos con is_active = true

-- Política 2: Autenticados ven todos los productos
-- Administradores pueden ver todos los productos (activos e inactivos)

-- Política 3: Autenticados pueden insertar productos
-- Requiere auth.role() = 'authenticated'

-- Política 4: Autenticados pueden actualizar productos
-- Incluye actualización de main_image_url cuando se sube imagen

-- Política 5: Autenticados pueden eliminar productos
-- Solo usuarios autenticados pueden eliminar
```

### Storage Bucket Policies

```sql
-- Política 1: Público puede ver imágenes
-- Permite descargar imágenes del bucket product-images

-- Política 2: Autenticados pueden subir imágenes
-- Los administradores pueden hacer upload a product-images/

-- Política 3: Autenticados pueden actualizar imágenes
-- Permite reemplazar imágenes existentes

-- Política 4: Autenticados pueden eliminar imágenes
-- Limpia imágenes antiguas
```

## ✅ Cómo Verificar que Funciona

Después de aplicar las políticas:

1. **Verifica en el dashboard de Supabase:**
   - Ve a **Authentication** > **Roles** > Asegúrate de que tienes un usuario con rol `authenticated`
   - Ve a **Storage** > **product-images** > **Policies** y verifica que existan las 4 nuevas políticas
   - Ve a **Database** > **Tables** > **products** > **Policies** y verifica que existan las 5 nuevas políticas

2. **Prueba el flujo completo en http://localhost:3000/admin/productos:**
   - Inicia sesión en el panel admin
   - Selecciona un producto
   - Haz clic en "🖼️ Imagen"
   - Selecciona una imagen
   - Haz clic en "Guardar Imagen"
   - Debe subir correctamente a Supabase Storage Y actualizar el registro en la tabla products

3. **Verifica en la consola del navegador:**
   ```
   ✅ Imagen validada
   ✅ Imagen comprimida: 2.5MB → 0.8MB
   📤 Subiendo a Supabase Storage...
   ✅ Archivo subido: products/product-1/1234567890-abc123.jpg
   ✅ URL pública generada: https://gxqkmaaqoehydulksudj.supabase.co/storage/v1/object/public/product-images/products/product-1/1234567890-abc123.jpg
   🔄 Sincronizando imagen con Supabase para producto: product-1
   ✅ Imagen sincronizada exitosamente con Supabase
   ```

## 🔐 Seguridad

- **Public URLs**: Las imágenes son públicamente accesibles (necesario para mostrarlas en la tienda)
- **Admin-only upload**: Solo usuarios autenticados pueden subir/actualizar/eliminar imágenes
- **Products table protection**: Solo autenticados pueden modificar la tabla de productos

## 🐛 Solución de Problemas

### Error: "new row violates row-level security policy"

**Causa:** Las políticas RLS no están configuradas correctamente.

**Solución:**
1. Verifica que RLS esté habilitado en la tabla `products`
2. Asegúrate de que exista una política que permita UPDATE para `auth.role() = 'authenticated'`
3. Ejecuta nuevamente la migración SQL

### Error: "Failed to upload image to storage"

**Causa:** Las políticas del bucket `product-images` no están configuradas.

**Solución:**
1. Verifica que el bucket `product-images` exista
2. Verifica que RLS esté habilitado en `storage.objects`
3. Asegúrate de que exista una política INSERT para `auth.role() = 'authenticated'`

### Las imágenes se suben pero no se guardan en la tabla

**Causa:** El endpoint `/api/admin/products/[id]` no está siendo llamado o hay un error de autenticación.

**Solución:**
1. Abre el navegador DevTools (F12) > Console
2. Verifica si ves el mensaje "🔄 Sincronizando imagen con Supabase..."
3. Si hay un error, copia el mensaje y verifica el endpoint

## 📚 Referencias

- Docs Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Docs Supabase Storage: https://supabase.com/docs/guides/storage/security/access-control

## 🎯 Pasos Siguientes

1. ✅ Aplicar migración SQL en Supabase
2. ✅ Verificar políticas en el dashboard
3. ✅ Probar en local (http://localhost:3000/admin/productos)
4. ✅ Probar en producción (https://tus-aguacates-57vp.vercel.app/admin/productos/)

---

**Última actualización:** 17 de Noviembre, 2024
