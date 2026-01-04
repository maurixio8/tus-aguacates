-- ===========================================================
-- TOOL_BuscarProductos - PARA SUPABASE
-- ===========================================================
-- 
-- Herramienta de FALLBACK para cuando la búsqueda automática no
-- encuentra el producto correcto.
--
-- CONFIGURACIÓN EN N8N:
-- 1. Tipo de nodo: Postgres Tool
-- 2. Nombre: TOOL_BuscarProductos
-- 3. Credencial: [Tu credencial de Supabase]
-- 4. Tool Description:
--    "Herramienta de FALLBACK para buscar productos. 
--    Úsala SOLO cuando los productos encontrados automáticamente 
--    NO coinciden con lo que pidió el cliente."
-- 5. Options > Query Parameters:
--    ={{ $fromAI('termino_busqueda','Producto a buscar','string','aguacate') }}
-- ===========================================================

SELECT 
    id,
    name,
    COALESCE(discount_price, price) as precio,
    description,
    category_id,
    main_image_url
FROM products
WHERE 
    is_active = true
    AND stock > 0
    AND (
        lower(name) ILIKE '%' || lower($1) || '%'
        OR lower(description) ILIKE '%' || lower($1) || '%'
    )
ORDER BY 
    CASE WHEN is_featured = true THEN 0 ELSE 1 END,
    name
LIMIT 5;
