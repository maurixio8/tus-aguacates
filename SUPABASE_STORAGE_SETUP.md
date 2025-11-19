# 📸 Guía de Configuración de Supabase Storage

Esta guía te ayudará a configurar correctamente el almacenamiento de imágenes en Supabase para subir fotos de productos.

## 🎯 Objetivo

Configurar el bucket `product-images` en Supabase Storage para almacenar las imágenes de los productos de forma segura y eficiente.

---

## 📋 Pasos de Configuración

### 1. Verificar Estado Actual

Primero, ejecuta el script de verificación para identificar qué falta configurar:

```bash
npx tsx scripts/verify-supabase-storage.ts
```

Este script te dirá:
- ✅ Si la conexión a Supabase funciona
- ✅ Si el bucket existe
- ✅ Si las políticas RLS están configuradas
- ✅ Si puedes subir imágenes

---

### 2. Crear el Bucket de Imágenes

Si el bucket no existe, sigue estos pasos:

#### Opción A: Desde el Dashboard de Supabase (Recomendado)

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. En el menú lateral, selecciona **Storage**
3. Haz clic en **"New bucket"**
4. Configura el bucket:
   - **Name**: `product-images`
   - **Public bucket**: ✅ **SÍ** (marca esta opción)
   - **File size limit**: `10485760` (10MB)
   - **Allowed MIME types**:
     - `image/jpeg`
     - `image/png`
     - `image/webp`
     - `image/gif`
5. Haz clic en **"Create bucket"**

#### Opción B: Desde SQL Editor

1. Ve a **SQL Editor** en tu dashboard de Supabase
2. Ejecuta el siguiente SQL:

```sql
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;
```

---

### 3. Configurar Políticas RLS (Row Level Security)

Las políticas RLS son **cruciales** para que puedas subir imágenes. Ejecuta la migración completa:

1. Ve a **SQL Editor** en Supabase: https://supabase.com/dashboard/project/_/sql/new
2. Abre el archivo: `supabase/migrations/20240101_add_products_rls_policies.sql`
3. Copia todo su contenido
4. Pégalo en el SQL Editor
5. Haz clic en **"Run"**

Esta migración configurará:
- ✅ Políticas para la tabla `products`
- ✅ Políticas para el bucket `product-images`
- ✅ Permisos públicos para **VER** imágenes
- ✅ Permisos autenticados para **SUBIR/EDITAR/ELIMINAR** imágenes

---

### 4. Verificar Configuración

Después de aplicar los cambios, vuelve a ejecutar el script de verificación:

```bash
npx tsx scripts/verify-supabase-storage.ts
```

Deberías ver:
```
✅ Conexión a Supabase exitosa
✅ Bucket "product-images" existe y es accesible
✅ Subida de prueba exitosa
🎉 Supabase Storage está configurado correctamente!
```

---

## 🔍 Solución de Problemas Comunes

### Problema 1: "Bucket not found"

**Causa**: El bucket no existe.

**Solución**: Sigue el paso 2 para crear el bucket.

---

### Problema 2: "new row violates row-level security policy"

**Causa**: Las políticas RLS no están configuradas o son muy restrictivas.

**Solución**:
1. Ejecuta la migración del paso 3
2. Verifica que estés autenticado en el admin (debes hacer login)

---

### Problema 3: "Only authenticated users can upload"

**Causa**: No hay una sesión de autenticación activa.

**Solución**:
1. Ve a `/admin/login` en tu aplicación
2. Inicia sesión con las credenciales de admin
3. Luego intenta subir imágenes

---

### Problema 4: Variables de entorno no configuradas

**Causa**: Faltan las variables de Supabase en `.env.local`.

**Solución**: Crea/edita `.env.local` con:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-key
```

Puedes obtener estas credenciales en:
https://supabase.com/dashboard/project/_/settings/api

---

## 📊 Arquitectura del Sistema de Imágenes

```
┌─────────────────┐
│   Admin Panel   │
│  /admin/productos│
└────────┬────────┘
         │
         │ 1. Usuario selecciona imagen
         ↓
┌─────────────────────────────┐
│  ImageUploadModal.tsx       │
│  - Valida formato y tamaño  │
│  - Comprime imagen          │
└────────┬────────────────────┘
         │
         │ 2. Llama a uploadProductImage()
         ↓
┌─────────────────────────────┐
│ image-upload-service.ts     │
│ - Comprime a 1200x1200      │
│ - Sube a Supabase Storage   │
│ - Genera URL pública        │
└────────┬────────────────────┘
         │
         │ 3. Upload a bucket
         ↓
┌─────────────────────────────┐
│  Supabase Storage           │
│  product-images/            │
│  ├── products/              │
│  │   ├── product-1/         │
│  │   │   └── image.jpg      │
│  │   └── product-2/         │
│  │       └── image.jpg      │
└─────────────────────────────┘
```

---

## ✅ Checklist de Verificación

Antes de intentar subir imágenes, verifica:

- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Bucket `product-images` creado en Supabase
- [ ] Bucket configurado como **público**
- [ ] Migración SQL de políticas RLS ejecutada
- [ ] Sesión de admin activa (login realizado)
- [ ] Script de verificación pasa todas las pruebas

---

## 🎓 Recursos Adicionales

- [Documentación oficial de Supabase Storage](https://supabase.com/docs/guides/storage)
- [Guía de políticas RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [API de Storage en JavaScript](https://supabase.com/docs/reference/javascript/storage-from-upload)

---

## 🆘 ¿Necesitas Ayuda?

Si después de seguir esta guía aún tienes problemas:

1. Ejecuta el script de verificación y guarda el output:
   ```bash
   npx tsx scripts/verify-supabase-storage.ts > storage-debug.txt
   ```

2. Verifica los logs del navegador (F12 → Console) cuando intentas subir una imagen

3. Revisa que tu proyecto de Supabase esté activo y sin límites excedidos

---

**Última actualización**: 2025-11-19
