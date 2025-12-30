# Gestión de Productos B2B - Tus Aguacates

Esta guía explica cómo gestionar los productos del canal empresarial (B2B) desde Supabase.

## Dónde Administrar Productos B2B

Los productos B2B se gestionan desde **Supabase** en la tabla `product_b2b_config`.

### Acceso:
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. En el menú izquierdo, selecciona **Table Editor**
3. Busca la tabla `product_b2b_config`

---

## Estructura de la Tabla `product_b2b_config`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid | ID único (auto-generado) |
| `product_slug` | text | Identificador único del producto (ej: `hass-verde-b2b`) |
| `b2b_enabled` | boolean | Si está activo para B2B |
| `display_name` | text | Nombre visible del producto |
| `description` | text | Descripción del producto |
| `image_url` | text | URL de la imagen del producto |
| `unit` | text | Unidad de venta (kg, unidad, etc.) |
| `min_quantity` | int | Cantidad mínima de pedido |
| `max_quantity` | int | Cantidad máxima de pedido |
| `base_price` | decimal | Precio base por unidad |
| `tier1_min/max/price` | - | Rango y precio Tier 1 (5-20 kg) |
| `tier2_min/max/price` | - | Rango y precio Tier 2 (20-100 kg) |
| `tier3_min/max/price` | - | Rango y precio Tier 3 (100-300 kg) |
| `avocado_variety` | text | Variedad de aguacate (hass, papelillo, etc.) |
| `ripeness_state` | text | Estado de maduración (verde, pinton, maduro) |
| `b2b_category` | text | Categoría (aguacates, frutas-tropicales, etc.) |
| `display_order` | int | Orden de visualización |

---

## Operaciones Comunes

### 1. Actualizar Precios Semanales

```sql
-- Actualizar precio de Aguacate Hass Verde en todos los tiers
UPDATE product_b2b_config
SET
  tier1_price = 9500,  -- Nuevo precio Tier 1
  tier2_price = 8500,  -- Nuevo precio Tier 2
  tier3_price = 7500,  -- Nuevo precio Tier 3
  updated_at = NOW()
WHERE product_slug = 'hass-verde-b2b';
```

### 2. Habilitar/Deshabilitar un Producto

```sql
-- Deshabilitar un producto
UPDATE product_b2b_config
SET b2b_enabled = false
WHERE product_slug = 'hass-maduro-b2b';

-- Habilitar un producto
UPDATE product_b2b_config
SET b2b_enabled = true
WHERE product_slug = 'hass-maduro-b2b';
```

### 3. Agregar Imágenes a Productos

#### Opción A: Usar imágenes del Storage de Supabase

1. Ve a **Storage** en el menú de Supabase
2. Crea un bucket llamado `products` (público)
3. Sube las imágenes de productos
4. Copia la URL pública de cada imagen
5. Actualiza en la tabla:

```sql
-- Actualizar imagen de un producto específico
UPDATE product_b2b_config
SET image_url = 'https://tu-proyecto.supabase.co/storage/v1/object/public/products/aguacate-hass.jpg'
WHERE product_slug = 'hass-verde-b2b';
```

#### Opción B: Usar imágenes locales del sitio

```sql
-- Usar imágenes de categorías existentes
UPDATE product_b2b_config
SET image_url = '/categories/aguacates.jpg'
WHERE b2b_category = 'aguacates';

UPDATE product_b2b_config
SET image_url = '/categories/tropicales.jpg'
WHERE b2b_category = 'frutas-tropicales';

UPDATE product_b2b_config
SET image_url = '/categories/frutos-rojos.jpg'
WHERE b2b_category = 'frutos-rojos';

UPDATE product_b2b_config
SET image_url = '/categories/gourmet.jpg'
WHERE b2b_category = 'gourmet';

UPDATE product_b2b_config
SET image_url = '/categories/aromaticas.jpg'
WHERE b2b_category = 'aromaticas';

UPDATE product_b2b_config
SET image_url = '/categories/saludables.jpg'
WHERE b2b_category = 'saludables';

UPDATE product_b2b_config
SET image_url = '/categories/desgranados.jpg'
WHERE b2b_category = 'desgranados';
```

### 4. Agregar un Nuevo Producto B2B

```sql
INSERT INTO product_b2b_config (
  product_slug,
  b2b_enabled,
  display_name,
  description,
  image_url,
  unit,
  min_quantity,
  max_quantity,
  base_price,
  tier1_min, tier1_max, tier1_price,
  tier2_min, tier2_max, tier2_price,
  tier3_min, tier3_max, tier3_price,
  b2b_category,
  display_order
) VALUES (
  'nuevo-producto-b2b',
  true,
  'Nombre del Producto',
  'Descripción del producto para empresas',
  'https://url-de-imagen.com/producto.jpg',
  'kg',
  5, 300,
  10000,
  5, 20, 10000,
  20, 100, 9000,
  100, 300, 8000,
  'frutas-tropicales',
  10
);
```

### 5. Ver Todos los Productos B2B Activos

```sql
SELECT
  product_slug,
  display_name,
  b2b_category,
  tier1_price,
  tier2_price,
  tier3_price,
  image_url
FROM product_b2b_config
WHERE b2b_enabled = true
ORDER BY b2b_category, display_order;
```

---

## Categorías B2B Disponibles

| Slug | Nombre | Icono |
|------|--------|-------|
| `aguacates` | Aguacates | 🥑 |
| `frutas-tropicales` | Frutas Tropicales | 🍊 |
| `frutos-rojos` | Frutos Rojos | 🍓 |
| `gourmet` | Gourmet | 🍅 |
| `aromaticas` | Aromáticas | 🌿 |
| `saludables` | Saludables | 🥗 |
| `desgranados` | Desgranados | 🌽 |

---

## Aguacates: Variedades y Estados de Maduración

### Variedades (`avocado_variety`)
- `hass` - Hass
- `papelillo` - Papelillo (Lorena)
- `semil` - Semil
- `choquette` - Choquette

### Estados de Maduración (`ripeness_state`)
- `verde` - Verde (madura en 4-7 días)
- `pinton` - Pintón (listo en 1-3 días)
- `maduro` - Maduro (consumo inmediato)

---

## Flujo de Checkout B2B

1. El cliente agrega productos al carrito B2B
2. Al finalizar, completa el formulario con datos de empresa
3. El pedido se envía por **WhatsApp** o **Email**
4. El equipo confirma disponibilidad y coordina entrega
5. Pago contra entrega o transferencia

**URL del checkout:** `/empresas/checkout`

---

## Notas Importantes

- Los precios en Supabase se actualizan **automáticamente** en el frontend
- El cache del frontend dura 5 minutos, después se refresca de Supabase
- Si Supabase no está disponible, se muestran datos locales de respaldo
- El envío es **GRATIS** para pedidos mayores a **$100,000 COP**

---

## Soporte

Para consultas técnicas sobre la integración B2B:
- Email: empresas@tusaguacates.com
- WhatsApp: +57 304 258 2777
