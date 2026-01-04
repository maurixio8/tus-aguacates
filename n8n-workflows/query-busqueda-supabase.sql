-- ===========================================================
-- 🔍 BÚSQUEDA AUTOMÁTICA - PARA SUPABASE
-- ===========================================================
-- 
-- Este query se usa en el nodo "3. Búsqueda Automática Productos"
-- Consulta directamente la tabla "products" de Supabase
-- (la misma que usa la tienda online)
--
-- CONFIGURACIÓN EN N8N:
-- 1. Crear credencial "Postgres" con datos de Supabase:
--    - Host: db.[tu-proyecto].supabase.co
--    - Port: 5432 (o 6543 para pooler)
--    - Database: postgres
--    - User: postgres
--    - Password: [tu password de Supabase]
-- 2. Seleccionar esta credencial en el nodo
-- 3. Copiar este query
-- ===========================================================

SELECT 
    id,
    name,
    COALESCE(discount_price, price) as price,
    description,
    category_id
FROM products
WHERE 
    is_active = true
    AND stock > 0
    AND (
        -- Búsqueda por nombre (con manejo de acentos si unaccent está disponible)
        lower(name) ILIKE '%' || lower('{{ $('1. Pre-procesamiento YCloud').first().json.terminoNormalizado }}') || '%'
        OR lower(description) ILIKE '%' || lower('{{ $('1. Pre-procesamiento YCloud').first().json.terminoNormalizado }}') || '%'
    )
ORDER BY 
    CASE WHEN is_featured = true THEN 0 ELSE 1 END,
    price ASC
LIMIT 8;

-- ===========================================================
-- NOTA: Si Supabase tiene la extensión 'unaccent', usar esta versión:
-- ===========================================================
-- SELECT 
--     id, name,
--     COALESCE(discount_price, price) as price,
--     description, category_id
-- FROM products
-- WHERE is_active = true AND stock > 0
--     AND (
--         unaccent(lower(name)) ILIKE '%' || unaccent(lower('{{ terminoNormalizado }}')) || '%'
--         OR unaccent(lower(description)) ILIKE '%' || unaccent(lower('{{ terminoNormalizado }}')) || '%'
--     )
-- ORDER BY CASE WHEN is_featured THEN 0 ELSE 1 END, price ASC
-- LIMIT 8;
