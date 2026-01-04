-- =====================================================
-- 🥑 TUS AGUACATES - Tabla de Productos para PostgreSQL Docker
-- =====================================================
-- Ejecutar en tu PostgreSQL Docker (n8n_db)
-- Esta tabla almacenará los productos para el agente WhatsApp
-- =====================================================

-- Crear tabla de productos (compatible con Supabase structure)
CREATE TABLE IF NOT EXISTS productos_tienda (
    id SERIAL PRIMARY KEY,
    supabase_id UUID,  -- ID original de Supabase para referencia
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    discount_price DECIMAL(12,2),
    category_name VARCHAR(100),
    category_id INTEGER,
    main_image_url TEXT,
    stock INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    synced_from_supabase_at TIMESTAMP
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_productos_name ON productos_tienda(name);
CREATE INDEX IF NOT EXISTS idx_productos_active ON productos_tienda(is_active);
CREATE INDEX IF NOT EXISTS idx_productos_category ON productos_tienda(category_name);

-- Índice de texto completo para búsqueda (PostgreSQL full-text search)
CREATE INDEX IF NOT EXISTS idx_productos_search ON productos_tienda 
USING gin(to_tsvector('spanish', name || ' ' || COALESCE(description, '')));

-- Función para búsqueda de productos (similar a la de Supabase)
CREATE OR REPLACE FUNCTION buscar_productos(termino TEXT)
RETURNS TABLE (
    id INTEGER,
    name VARCHAR(255),
    description TEXT,
    price DECIMAL(12,2),
    discount_price DECIMAL(12,2),
    category_name VARCHAR(100),
    is_active BOOLEAN
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.discount_price,
        p.category_name,
        p.is_active
    FROM productos_tienda p
    WHERE 
        p.is_active = true
        AND (
            p.name ILIKE '%' || termino || '%'
            OR p.description ILIKE '%' || termino || '%'
            OR p.category_name ILIKE '%' || termino || '%'
        )
    ORDER BY 
        CASE 
            WHEN p.name ILIKE termino || '%' THEN 1
            WHEN p.name ILIKE '%' || termino || '%' THEN 2
            ELSE 3
        END,
        p.name
    LIMIT 10;
END;
$$;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_productos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_productos_updated_at ON productos_tienda;
CREATE TRIGGER trigger_productos_updated_at
    BEFORE UPDATE ON productos_tienda
    FOR EACH ROW
    EXECUTE FUNCTION update_productos_updated_at();

-- Comentarios
COMMENT ON TABLE productos_tienda IS 'Productos sincronizados desde Supabase para el agente WhatsApp';
COMMENT ON FUNCTION buscar_productos IS 'Busca productos por nombre, descripción o categoría';

-- =====================================================
-- VERIFICAR
-- =====================================================
-- SELECT * FROM buscar_productos('aguacate');
