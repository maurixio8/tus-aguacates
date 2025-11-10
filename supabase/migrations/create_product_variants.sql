-- ====================================================
-- MIGRACIÓN: Crear tabla de variantes de productos
-- ====================================================
-- Fecha: 2025-11-08
-- Propósito: Preparar el sistema para manejar variantes de productos
-- (tamaños, presentaciones, cajas, mallas, etc.)
-- ====================================================

-- Crear tabla de variantes de productos
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  variant_name VARCHAR(100) NOT NULL,
  variant_value VARCHAR(255) NOT NULL,
  price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
  stock_quantity INTEGER DEFAULT 0,
  sku VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_active ON product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);

-- Habilitar RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Política de lectura: todos pueden leer variantes activas
CREATE POLICY "Todos pueden ver variantes activas"
  ON product_variants
  FOR SELECT
  USING (is_active = true);

-- Política de inserción: solo usuarios autenticados pueden crear variantes
CREATE POLICY "Solo usuarios autenticados pueden crear variantes"
  ON product_variants
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política de actualización: solo usuarios autenticados pueden actualizar variantes
CREATE POLICY "Solo usuarios autenticados pueden actualizar variantes"
  ON product_variants
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Política de eliminación: solo usuarios autenticados pueden eliminar variantes
CREATE POLICY "Solo usuarios autenticados pueden eliminar variantes"
  ON product_variants
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Comentarios para documentación
COMMENT ON TABLE product_variants IS 'Almacena las variantes de productos (tamaños, presentaciones, etc.)';
COMMENT ON COLUMN product_variants.product_id IS 'ID del producto padre (relacionado con tabla products)';
COMMENT ON COLUMN product_variants.variant_name IS 'Nombre del tipo de variante (ej: "Tamaño", "Presentación")';
COMMENT ON COLUMN product_variants.variant_value IS 'Valor de la variante (ej: "Grande", "Caja de 12")';
COMMENT ON COLUMN product_variants.price_adjustment IS 'Ajuste de precio sobre el precio base del producto (puede ser positivo o negativo)';
COMMENT ON COLUMN product_variants.stock_quantity IS 'Cantidad en stock de esta variante específica';
COMMENT ON COLUMN product_variants.sku IS 'SKU único de la variante (opcional)';
COMMENT ON COLUMN product_variants.is_active IS 'Indica si la variante está activa y disponible para compra';

-- ====================================================
-- EJEMPLOS DE USO
-- ====================================================

-- Ejemplo 1: Insertar variantes de tamaño para aguacates
-- INSERT INTO product_variants (product_id, variant_name, variant_value, price_adjustment, stock_quantity)
-- VALUES 
--   ('uuid-del-producto-aguacate', 'Tamaño', 'Pequeño', -500.00, 100),
--   ('uuid-del-producto-aguacate', 'Tamaño', 'Mediano', 0.00, 150),
--   ('uuid-del-producto-aguacate', 'Tamaño', 'Grande', 800.00, 80);

-- Ejemplo 2: Insertar variantes de presentación para tomates
-- INSERT INTO product_variants (product_id, variant_name, variant_value, price_adjustment, stock_quantity)
-- VALUES 
--   ('uuid-del-producto-tomate', 'Presentación', 'Individual', 0.00, 200),
--   ('uuid-del-producto-tomate', 'Presentación', 'Caja de 6', 1000.00, 50),
--   ('uuid-del-producto-tomate', 'Presentación', 'Caja de 12', 1800.00, 30);

-- ====================================================
-- CONSULTAS ÚTILES
-- ====================================================

-- Obtener todas las variantes de un producto específico
-- SELECT * FROM product_variants 
-- WHERE product_id = 'uuid-del-producto' 
-- AND is_active = true
-- ORDER BY variant_name, price_adjustment;

-- Obtener productos con sus variantes (JOIN manual)
-- SELECT p.*, pv.* 
-- FROM products p
-- LEFT JOIN product_variants pv ON p.id = pv.product_id
-- WHERE p.is_active = true
-- AND (pv.is_active = true OR pv.id IS NULL)
-- ORDER BY p.name, pv.variant_name, pv.price_adjustment;
