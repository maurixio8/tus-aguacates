# 🔧 FIX: Productos Faltantes en Categorías

## 📊 Problema Identificado

Había **28 productos desaparecidos (56% del catálogo)** porque:

### 1. ❌ Emoji Incorrecto en "Especias" (15 productos perdidos)
- **Código decía:** `'especias': '🌶️ Especias'`
- **JSON tiene:** `'🥗🌱☘️ Especias'`
- **Resultado:** 15 productos de especias no se mostraban en `/tienda/especias`

### 2. ❌ Categorías en UI que NO existen en JSON (13 productos perdidos)
- **Verduras:** En UnifiedCategories pero NO en JSON → 0 productos
- **Combos:** En UnifiedCategories pero NO en JSON → 0 productos

### 3. ✅ Categorías en JSON pero NO en UI (13 productos inaccesibles)
- **Desgranados:** 2 productos en JSON, pero sin ruta en la UI
- **Gourmet:** 11 productos en JSON, pero sin ruta en la UI

---

## 📋 Resumen de Cambios

### Archivos Modificados:

#### 1. `/lib/productStorage.ts` (Líneas 361-386)
✅ **Corregido:**
- Cambié `'especias': '🌶️ Especias'` a `'especias': '🥗🌱☘️ Especias'`
- Agregué `'desgranados'` y `'gourmet'` al mapeo
- Marqué `'verduras'` y `'combos'` como obsoletos (null) con warning

**Antes:**
```typescript
'especias': '🌶️ Especias',  // ❌ EMOJI EQUIVOCADO
'combos': '🎁 Combos',      // ❌ NO EXISTE EN JSON
```

**Después:**
```typescript
'especias': '🥗🌱☘️ Especias',  // ✅ EMOJI CORRECTO
'desgranados': '🌽 Desgranados',  // ✅ AGREGADO
'gourmet': '🍅🌽 Gourmet',       // ✅ AGREGADO
'verduras': null,    // ⚠️ OBSOLETO
'combos': null       // ⚠️ OBSOLETO
```

#### 2. `/components/categories/UnifiedCategories.tsx` (Líneas 30-104)
✅ **Actualizado:** Reemplazadas las 8 categorías para coincidir con JSON
- ✅ Aguacates
- ✅ Frutas Tropicales
- ✅ Frutas Rojas
- ✅ Aromáticas (antes no estaba)
- ✅ Saludables (antes no estaba)
- ✅ Especias (icono actualizado a `🥗🌱☘️`)
- ✅ Desgranados (NEW - antes "Verduras")
- ✅ Gourmet (NEW - antes "Combos")

#### 3. `/supabase/migrations/fix_categories_to_match_json.sql` (NUEVA)
✅ **Migración SQL** que actualiza Supabase con las 8 categorías correctas

---

## 🚀 Cómo Aplicar el Fix

### Paso 1: Actualizar Supabase (IMPORTANTE)

1. Abre [Supabase Dashboard](https://app.supabase.com)
2. Proyecto: `gxqkmaaqoehydulksudj`
3. Ve a **SQL Editor** → **New Query**
4. Copia y ejecuta este SQL:

```sql
-- Sincronizar categorías con las 8 reales del JSON
TRUNCATE TABLE categories CASCADE;

INSERT INTO categories (slug, name, description, sort_order, is_active) VALUES
('aguacates', 'Aguacates', 'Aguacates frescos de la mejor calidad', 1, true),
('frutas-tropicales', 'Frutas Tropicales', 'Frutas exóticas y tropicales', 2, true),
('frutos-rojos', 'Frutas Rojas', 'Deliciosas frutas rojas y bayas', 3, true),
('aromaticas', 'Aromáticas', 'Hierbas aromáticas frescas', 4, true),
('saludables', 'Saludables', 'Productos naturales y saludables', 5, true),
('especias', 'Especias', 'Especias y condimentos naturales', 6, true),
('desgranados', 'Desgranados', 'Productos desgranados frescos', 7, true),
('gourmet', 'Gourmet', 'Productos gourmet premium', 8, true);
```

### Paso 2: Actualizar Código (Ya Hecho ✅)

Los cambios en el código ya están listos en el repositorio.

---

## ✨ Resultados Esperados

### Después del Fix:

| Categoría | Productos | Estado |
|-----------|-----------|--------|
| 🥑 Aguacates | 3 | ✅ Visible |
| 🌿 Aromáticas | 1 | ✅ Visible |
| 🍯 Saludables | 8 | ✅ Visible |
| 🥗 Especias | **15** | ✅ **ARREGLADO** (antes 0) |
| 🍊 Tropicales | 9 | ✅ Visible |
| 🍓 Frutos Rojos | 1 | ✅ Visible |
| 🌽 Desgranados | **2** | ✅ **NUEVO** (antes inaccesible) |
| 🍅 Gourmet | **11** | ✅ **NUEVO** (antes inaccesible) |
| **TOTAL** | **50** | ✅ **TODOS ACCESIBLES** |

---

## 🧪 Verificación Post-Fix

1. **Home Page** → Deberías ver 8 categorías (incluyendo Desgranados y Gourmet)
2. **/tienda/especias** → Deberías ver 15 productos (antes mostraba 0)
3. **/tienda/desgranados** → Deberías ver 2 productos (NUEVA ruta)
4. **/tienda/gourmet** → Deberías ver 11 productos (NUEVA ruta)
5. **/tienda/todos** → Deberías ver 50 productos totales

---

## 📚 Archivos Relacionados

- **Archivo de mapeo:** `/lib/productStorage.ts` (línea 361)
- **Categorías UI:** `/components/categories/UnifiedCategories.tsx` (línea 30)
- **JSON de datos:** `/public/productos-master.json`
- **Migración SQL:** `/supabase/migrations/fix_categories_to_match_json.sql`

---

## ⚙️ Detalles Técnicos

### El Problema Raíz

El sistema tenía **3 fuentes de verdad desincronizadas:**

1. **UnifiedCategories.tsx** - Define qué categorías mostrar en la UI
2. **productStorage.ts** - Mapea slugs a nombres de categoría exactos en JSON
3. **productos-master.json** - Contiene los datos reales con nombres específicos

Cuando los nombres no coincidían exactamente (incluso en emojis), la búsqueda fallaba silenciosamente y mostraba 0 productos.

### La Solución

Se sincronizaron las 3 fuentes:
- ✅ `UnifiedCategories.tsx` ahora tiene exactamente las 8 categorías del JSON
- ✅ `productStorage.ts` mapea con los nombres EXACTOS del JSON (emojis incluidos)
- ✅ `productos-master.json` es la fuente única de verdad

---

## 🔗 Commits Relacionados

- `246ce65` - 🔧 FIX: Sincronizar categorías - Resolver 404 en frutas-tropicales
- `[ESTE]` - 🔧 FIX: Productos faltantes - Sincronizar categorías con JSON real
