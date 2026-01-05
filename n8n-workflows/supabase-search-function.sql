-- =====================================================
-- 🥑 TUS AGUACATES - Función de Búsqueda para Supabase
-- =====================================================
-- Ejecutar en tu proyecto Supabase (SQL Editor)
-- Esta función permite buscar productos por nombre
-- =====================================================

-- Función RPC para búsqueda de productos (llamada desde n8n)
CREATE OR REPLACE FUNCTION search_products(search_term TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    price DECIMAL,
    discount_price DECIMAL,
    category_name TEXT,
    is_active BOOLEAN,
    stock INTEGER
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
        c.name as category_name,
        p.is_active,
        p.stock
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 
        p.is_active = true
        AND (
            p.name ILIKE '%' || search_term || '%'
            OR p.description ILIKE '%' || search_term || '%'
        )
    ORDER BY 
        CASE 
            WHEN p.name ILIKE search_term || '%' THEN 1  -- Comienza con el término
            WHEN p.name ILIKE '%' || search_term || '%' THEN 2  -- Contiene el término
            ELSE 3
        END,
        p.name
    LIMIT 10;
END;
$$;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION search_products(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION search_products(TEXT) TO authenticated;

-- Comentario de documentación
COMMENT ON FUNCTION search_products IS 'Busca productos por nombre o descripción para el agente de WhatsApp';

-- =====================================================
-- Verificar que funciona
-- =====================================================
-- SELECT * FROM search_products('aguacate');
-- SELECT * FROM search_products('fresa');
