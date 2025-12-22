-- ====================================================
-- MIGRACIÓN: Sincronizar categorías unificadas con Supabase
-- ====================================================
-- Fecha: 2024-12-17
-- Propósito: Sincronizar las 9 categorías del componente UnifiedCategories
--            con la base de datos de Supabase
-- ====================================================

-- Limpiar categorías existentes (usar con cuidado en producción)
TRUNCATE TABLE categories RESTART IDENTITY CASCADE;

-- Insertar las 9 categorías unificadas
INSERT INTO categories (id, name, slug, description, image_url, is_active, sort_order, created_at, updated_at)
VALUES
  -- 1. Aguacates
  (
    gen_random_uuid(),
    'Aguacates',
    'aguacates',
    'Aguacates frescos de la mejor calidad',
    NULL, -- Se subirá la imagen desde el panel de admin
    true,
    1,
    NOW(),
    NOW()
  ),

  -- 2. Ofertas y Combos
  (
    gen_random_uuid(),
    'Ofertas y Combos',
    'ofertas-combos',
    'Combos especiales y ofertas del día',
    NULL,
    true,
    2,
    NOW(),
    NOW()
  ),

  -- 3. Frutas Tropicales
  (
    gen_random_uuid(),
    'Frutas Tropicales',
    'frutas-tropicales',
    'Frutas exóticas y tropicales',
    NULL,
    true,
    3,
    NOW(),
    NOW()
  ),

  -- 4. Frutos Rojos
  (
    gen_random_uuid(),
    'Frutos Rojos',
    'frutos-rojos',
    'Deliciosas frutas rojas y bayas',
    NULL,
    true,
    4,
    NOW(),
    NOW()
  ),

  -- 5. Aromáticas
  (
    gen_random_uuid(),
    'Aromáticas',
    'aromaticas',
    'Hierbas aromáticas frescas',
    NULL,
    true,
    5,
    NOW(),
    NOW()
  ),

  -- 6. Saludables
  (
    gen_random_uuid(),
    'Saludables',
    'saludables',
    'Productos naturales y saludables',
    NULL,
    true,
    6,
    NOW(),
    NOW()
  ),

  -- 7. Especias
  (
    gen_random_uuid(),
    'Especias',
    'especias',
    'Especias y condimentos naturales',
    NULL,
    true,
    7,
    NOW(),
    NOW()
  ),

  -- 8. Desgranados
  (
    gen_random_uuid(),
    'Desgranados',
    'desgranados',
    'Productos desgranados frescos',
    NULL,
    true,
    8,
    NOW(),
    NOW()
  ),

  -- 9. Gourmet
  (
    gen_random_uuid(),
    'Gourmet',
    'gourmet',
    'Productos gourmet premium',
    NULL,
    true,
    9,
    NOW(),
    NOW()
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Comentario
COMMENT ON TABLE categories IS 'Tabla de categorías de productos sincronizada con UnifiedCategories.tsx';
