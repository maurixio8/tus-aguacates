-- ============================================================================
-- POBLAR DATOS INICIALES B2B
-- Ejecutar DESPUÉS de la migración principal
-- ============================================================================

-- ============================================================================
-- 1. CREAR CATEGORÍAS B2B INICIALES
-- ============================================================================

INSERT INTO b2b_categories (id, name, slug, description, sort_order, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Frutas Frescas', 'frutas-frescas',
   'Amplia variedad de frutas frescas para tu negocio', 1, true),
  ('22222222-2222-2222-2222-222222222222', 'Verduras y Hortalizas', 'verduras-hortalizas',
   'Verduras y hortalizas de la mejor calidad', 2, true),
  ('33333333-3333-3333-3333-333333333333', 'Frutas Tropicales', 'frutas-tropicales',
   'Frutas tropicales colombianas para exportación', 3, true),
  ('44444444-4444-4444-4444-444444444444', 'Aguacates', 'aguacates',
   'Aguacates de diferentes variedades y calibres', 4, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. IMPORTAR PRODUCTOS B2B DESDE B2C (Top 50 productos)
-- ============================================================================

-- Insertar productos B2B basados en los productos B2C existentes
-- Con precios B2B más bajos (aprox 15-20% descuento base)

INSERT INTO b2b_products (
  id, sku, name, description, category_id,
  base_price, stock_quantity, minimum_order_quantity,
  unit, is_active, is_featured, main_image_url, images,
  b2c_product_id
)
SELECT
  gen_random_uuid() as id,
  'B2B-' || COALESCE(p.sku, 'PROD-' || p.id) as sku,
  p.name,
  p.description,
  (CASE
    WHEN c.name = 'Frutas Tropicales' THEN '33333333-3333-3333-3333-333333333333'::uuid
    WHEN c.name = 'Aguacates' THEN '44444444-4444-4444-4444-444444444444'::uuid
    ELSE '11111111-1111-1111-1111-111111111111'::uuid
  END) as category_id,
  -- Precio B2B: 80% del precio B2C (20% descuento base)
  ROUND((p.price * 0.80)::numeric, 2) as base_price,
  COALESCE(p.stock, 100) as stock_quantity,
  5 as minimum_order_quantity, -- Mínimo 5 unidades para B2B
  p.unit,
  true as is_active,
  COALESCE(p.is_featured, false) as is_featured,
  p.main_image_url,
  COALESCE(p.images, '[]'::jsonb) as images,
  p.id as b2c_product_id
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true
  AND p.price IS NOT NULL
  AND p.price > 0
ORDER BY p.created_at DESC
LIMIT 50
ON CONFLICT (sku) DO NOTHING;

-- ============================================================================
-- 3. CREAR PRICING TIERS PARA PRODUCTOS B2B
-- ============================================================================

-- Crear pricing tiers para cada producto B2B
-- Tier 1: 10-25 unidades = 10% descuento adicional
-- Tier 2: 26-50 unidades = 20% descuento adicional
-- Tier 3: 51+ unidades = 30% descuento adicional

INSERT INTO b2b_pricing_tiers (product_id, min_quantity, max_quantity, tier_name, price_per_unit, discount_percentage, priority)
SELECT
  bp.id as product_id,
  10 as min_quantity,
  25 as max_quantity,
  '10% dto por volumen (10-25)' as tier_name,
  ROUND((bp.base_price * 0.90)::numeric, 2) as price_per_unit,
  10.0 as discount_percentage,
  1 as priority
FROM b2b_products bp
WHERE bp.is_active = true

UNION ALL

SELECT
  bp.id as product_id,
  26 as min_quantity,
  50 as max_quantity,
  '20% dto por volumen (26-50)' as tier_name,
  ROUND((bp.base_price * 0.80)::numeric, 2) as price_per_unit,
  20.0 as discount_percentage,
  2 as priority
FROM b2b_products bp
WHERE bp.is_active = true

UNION ALL

SELECT
  bp.id as product_id,
  51 as min_quantity,
  NULL as max_quantity,
  '30% dto por volumen (51+)' as tier_name,
  ROUND((bp.base_price * 0.70)::numeric, 2) as price_per_unit,
  30.0 as discount_percentage,
  3 as priority
FROM b2b_products bp
WHERE bp.is_active = true;

-- ============================================================================
-- 4. VERIFICACIÓN
-- ============================================================================

-- Mostrar resumen
SELECT 'B2B Categories:' as info, COUNT(*) as count FROM b2b_categories
UNION ALL
SELECT 'B2B Products:', COUNT(*) FROM b2b_products
UNION ALL
SELECT 'B2B Pricing Tiers:', COUNT(*) FROM b2b_pricing_tiers;

-- ============================================================================
-- 5. EMPRESA DE PRUEBA
-- ============================================================================

-- Nota: Para crear una empresa de prueba, usa el dashboard o registra una empresa nueva
-- desde /empresas/registro cuando esté implementado
