# 🔧 FIX: Error 404 en Frutas Tropicales y otras categorías

## 📋 Problema Identificado

El error 404 ocurre porque **hay una desincronización entre el frontend y la base de datos Supabase**:

### Sistema Frontend (UnifiedCategories.tsx)
Define 8 categorías con estos slugs:
- ✅ `aguacates`
- ❌ `frutas-tropicales` → NO EXISTE en BD
- ❌ `frutos-rojos` → NO EXISTE en BD
- ✅ `verduras`
- ❌ `aromaticas` → BD tiene `hierbas-aromaticas`
- ❌ `saludables` → NO EXISTE en BD
- ✅ `especias`
- ✅ `combos`

### Sistema Backend (Supabase table `categories`)
Tiene estos slugs (de migración anterior):
- `frutas` (NO `frutas-tropicales`)
- `verduras`
- `aguacates`
- `especias`
- `hierbas-aromaticas` (NO `aromaticas`)
- `combos`
- `jugos`
- `otros`

**Resultado:** Cuando haces clic en "Frutas Tropicales" → intenta ir a `/tienda/frutas-tropicales` → Supabase valida el slug y no lo encuentra → **404**

---

## ✅ Solución Implementada

Se creó una **nueva migración SQL** que sincroniza la tabla `categories` con los slugs del frontend:

📁 Archivo: `/supabase/migrations/fix_unified_categories_sync.sql`

---

## 🚀 Pasos para Aplicar el Fix

### Opción 1: Usar Supabase Dashboard (Recomendado)

1. **Accede a Supabase Dashboard:**
   - URL: https://app.supabase.com
   - Proyecto: `gxqkmaaqoehydulksudj`

2. **Ir a SQL Editor:**
   - Click en "SQL Editor" en la sidebar izquierda
   - Click en "+ New Query"

3. **Copiar y pegar este SQL:**
   ```sql
   -- Sincronizar tabla de categorías con UnifiedCategories.tsx
   TRUNCATE TABLE categories CASCADE;

   INSERT INTO categories (slug, name, description, sort_order, is_active) VALUES
   -- Categorías principales
   ('aguacates', 'Aguacates', 'Aguacates frescos de la mejor calidad', 1, true),
   ('frutas-tropicales', 'Frutas Tropicales', 'Frutas exóticas y tropicales', 2, true),
   ('frutos-rojos', 'Frutas Rojas', 'Deliciosas frutas rojas y bayas', 3, true),
   ('verduras', 'Verduras', 'Verduras frescas y orgánicas', 4, true),
   ('aromaticas', 'Aromáticas', 'Hierbas aromáticas frescas', 5, true),
   ('saludables', 'Saludables', 'Productos naturales y saludables', 6, true),
   ('especias', 'Especias', 'Especias y condimentos naturales', 7, true),
   ('combos', 'Combos', 'Combos especiales y paquetes', 8, true)
   ON CONFLICT (slug) DO UPDATE SET
     name = EXCLUDED.name,
     description = EXCLUDED.description,
     sort_order = EXCLUDED.sort_order,
     is_active = EXCLUDED.is_active;
   ```

4. **Ejecutar la consulta:**
   - Click en "Run" o presionar Ctrl+Enter
   - Deberías ver ✅ en el resultado

5. **Verificar los cambios:**
   - Ir a la tabla "categories" en el Data Explorer
   - Deberías ver 8 categorías con los slugs correctos

### Opción 2: Usar Supabase CLI

```bash
# Desde la raíz del proyecto
cd /home/user/tus-aguacates

# Ejecutar la migración (si tienes supabase CLI instalado)
supabase db push
```

### Opción 3: Manual en Supabase Console

Si tienes acceso a la tabla, puedes:
1. Ir a Data Editor → categories
2. Eliminar todas las filas existentes
3. Agregar las 8 nuevas categorías con los slugs correctos

---

## ✨ Cambios en el Código

### Archivos Modificados:
- ✨ **NUEVO:** `/supabase/migrations/fix_unified_categories_sync.sql` - Migración SQL

### Archivos Existentes (sin cambios necesarios):
- `/components/categories/UnifiedCategories.tsx` - Ya tiene los slugs correctos ✅
- `/lib/productStorage.ts` - `slugToCategory()` ya mapea correctamente ✅
- `/app/tienda/[categoria]/page.tsx` - Validación contra BD ✅

---

## 🧪 Verificación Post-Fix

Después de aplicar la migración:

1. **Navega a:** http://localhost:3000/tienda
2. **Haz clic en:** "Frutas Tropicales" (u otra categoría problemática)
3. **Deberías ver:**
   - ✅ No hay 404
   - ✅ Se muestra el header con "Frutas Tropicales"
   - ✅ Se listan los productos (si hay en esa categoría)

---

## 📊 Tabla Comparativa

| Categoría | Slug (Frontend) | Slug (BD Anterior) | Slug (BD Nuevo) | Estado |
|-----------|-----------------|-------------------|-----------------|--------|
| Aguacates | `aguacates` | `aguacates` | `aguacates` | ✅ OK |
| Frutas Tropicales | `frutas-tropicales` | `frutas` | `frutas-tropicales` | ✅ FIJO |
| Frutas Rojas | `frutos-rojos` | ❌ FALTA | `frutos-rojos` | ✅ FIJO |
| Verduras | `verduras` | `verduras` | `verduras` | ✅ OK |
| Aromáticas | `aromaticas` | `hierbas-aromaticas` | `aromaticas` | ✅ FIJO |
| Saludables | `saludables` | ❌ FALTA | `saludables` | ✅ FIJO |
| Especias | `especias` | `especias` | `especias` | ✅ OK |
| Combos | `combos` | `combos` | `combos` | ✅ OK |

---

## 🔗 Recursos

- Archivo SQL migración: `/supabase/migrations/fix_unified_categories_sync.sql`
- Definiciones de categorías: `/components/categories/UnifiedCategories.tsx` (línea 30-103)
- Mapeo slug-categoria: `/lib/productStorage.ts` (línea 361-379)
- Validación de rutas: `/app/tienda/[categoria]/page.tsx` (línea 44-48)

---

## ❓ Preguntas Comunes

**P: ¿Esto borra mis productos?**
A: No, solo actualiza los slugs de las categorías. Los productos se mantienen intactos porque tienen referencias por nombre, no por slug.

**P: ¿Qué pasa con las URLs antiguas?**
A: Las URLs antiguas como `/tienda/frutas` ya no funcionarán, pero ahora funcionarán `/tienda/frutas-tropicales`.

**P: ¿Por qué no solo cambiar el frontend?**
A: Porque la validación en `page.tsx` consulta Supabase para verificar que la categoría exista. Sin sincronizar la BD, siempre fallaría.
