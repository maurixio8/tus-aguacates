-- Script para crear la tabla product_variants en Supabase
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Crear la tabla product_variants
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name VARCHAR(255) NOT NULL,
  variant_value VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_adjustment DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 100,
  sku VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_active ON product_variants(is_active);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de seguridad
-- Permitir lectura pública (para la tienda)
CREATE POLICY "Allow public read access" ON product_variants
  FOR SELECT USING (true);

-- Permitir todas las operaciones con service_role (para el admin)
CREATE POLICY "Allow service role full access" ON product_variants
  FOR ALL USING (true);

-- 5. Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Agregar comentarios para documentación
COMMENT ON TABLE product_variants IS 'Variantes de productos (ej: diferentes pesos, tamaños)';
COMMENT ON COLUMN product_variants.variant_name IS 'Nombre del tipo de variante (ej: Peso, Tamaño, Unidades)';
COMMENT ON COLUMN product_variants.variant_value IS 'Valor de la variante (ej: 500g, Grande, 12 unidades)';
COMMENT ON COLUMN product_variants.price IS 'Precio absoluto de esta variante';
COMMENT ON COLUMN product_variants.price_adjustment IS 'Ajuste de precio respecto al precio base del producto';
