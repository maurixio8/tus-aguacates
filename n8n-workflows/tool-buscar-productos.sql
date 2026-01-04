-- ===========================================================
-- TOOL_BuscarProductos - QUERY CORREGIDA
-- ===========================================================
--
-- ERROR ANTERIOR: "there is no parameter $1"
--
-- PROBLEMA: En n8n, la opción correcta es "queryReplacement"
-- pero estaba configurada como "replaceEmptyStrings"
--
-- CONFIGURACIÓN CORRECTA EN N8N:
-- ================================
-- 1. En el nodo TOOL_BuscarProductos
-- 2. Ir a "Options"
-- 3. Agregar: "Query Replacement" (NO "Replace Empty Strings")
-- 4. Valor: ={{ $fromAI('termino_busqueda','Producto a buscar','string','aguacate') }}
--
-- ===========================================================

SELECT 
    id,
    name,
    COALESCE(discount_price, price) as precio,
    description,
    category_name
FROM productos_tienda
WHERE 
    is_active = true
    AND (
        name ILIKE '%' || $1 || '%'
        OR description ILIKE '%' || $1 || '%'
        OR category_name ILIKE '%' || $1 || '%'
    )
ORDER BY 
    CASE 
        WHEN is_featured = true THEN 0 
        ELSE 1 
    END,
    name
LIMIT 5;
