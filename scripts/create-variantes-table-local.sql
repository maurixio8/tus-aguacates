-- ====================================================
-- CREAR TABLA variantes_productos EN POSTGRESQL LOCAL
-- ====================================================
-- Ejecutar en el PostgreSQL Docker local (Mi PostgreSQL Docker)
-- Esta tabla sincroniza las variantes desde Supabase
-- ====================================================

-- Eliminar tabla existente si existe (para reconstruir limpiamente)
DROP TABLE IF EXISTS variantes_productos CASCADE;

-- Crear tabla de variantes de productos
CREATE TABLE variantes_productos (
  id SERIAL PRIMARY KEY,
  supabase_id UUID,
  product_id INTEGER REFERENCES productos_tienda(id) ON DELETE CASCADE,
  product_supabase_id UUID,
  variant_name VARCHAR(100) NOT NULL,
  variant_value VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) DEFAULT 0.00,
  price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
  stock_quantity INTEGER DEFAULT 100,
  sku VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  synced_from_supabase_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para rendimiento
CREATE INDEX idx_variantes_product_id ON variantes_productos(product_id);
CREATE INDEX idx_variantes_product_supabase_id ON variantes_productos(product_supabase_id);
CREATE INDEX idx_variantes_is_active ON variantes_productos(is_active);
CREATE INDEX idx_variantes_supabase_id ON variantes_productos(supabase_id);

-- Comentarios para documentación
COMMENT ON TABLE variantes_productos IS 'Variantes de productos sincronizadas desde Supabase';
COMMENT ON COLUMN variantes_productos.product_supabase_id IS 'UUID del producto en Supabase (para vincular en sync)';
COMMENT ON COLUMN variantes_productos.variant_name IS 'Tipo de variante (ej: Peso, Tamaño, Presentación)';
COMMENT ON COLUMN variantes_productos.variant_value IS 'Valor de la variante (ej: 500g, Grande, Caja x12)';
COMMENT ON COLUMN variantes_productos.price IS 'Precio absoluto de esta variante';
COMMENT ON COLUMN variantes_productos.price_adjustment IS 'Ajuste de precio respecto al producto base';

-- ====================================================
-- VERIFICAR CREACIÓN
-- ====================================================
-- SELECT * FROM variantes_productos LIMIT 5;
-- SELECT COUNT(*) FROM variantes_productos;

-- ====================================================
-- CONSULTA ÚTIL: Productos con sus variantes
-- ====================================================
-- SELECT 
--   p.name as producto,
--   p.price as precio_base,
--   v.variant_name as tipo_variante,
--   v.variant_value as valor,
--   v.price as precio_variante,
--   v.stock_quantity as stock
-- FROM productos_tienda p
-- LEFT JOIN variantes_productos v ON p.supabase_id = v.product_supabase_id
-- WHERE p.is_active = true
-- ORDER BY p.name, v.variant_name, v.sort_order;
