-- =====================================================
-- 🔍 QUERY SQL v4.1 - BÚSQUEDA CORREGIDA
-- =====================================================
-- Error anterior: "for SELECT DISTINCT, ORDER BY expressions 
--                  must appear in select list"
-- 
-- Solución: Usar subconsulta con ORDER BY antes de DISTINCT
-- =====================================================

SELECT DISTINCT ON (id)
    id,
    name,
    COALESCE(discount_price, price) as price,
    description,
    category_name
FROM productos_tienda
WHERE 
    is_active = true
    AND (
        -- Buscar PRIMER término normalizado
        name ILIKE '%' || COALESCE(NULLIF('{{ $('1. Pre-procesamiento YCloud').first().json.terminosNormalizados[0] }}', 'undefined'), '{{ $('1. Pre-procesamiento YCloud').first().json.terminoNormalizado }}') || '%'
        OR description ILIKE '%' || COALESCE(NULLIF('{{ $('1. Pre-procesamiento YCloud').first().json.terminosNormalizados[0] }}', 'undefined'), '{{ $('1. Pre-procesamiento YCloud').first().json.terminoNormalizado }}') || '%'
        OR category_name ILIKE '%' || COALESCE(NULLIF('{{ $('1. Pre-procesamiento YCloud').first().json.terminosNormalizados[0] }}', 'undefined'), '{{ $('1. Pre-procesamiento YCloud').first().json.terminoNormalizado }}') || '%'
        
        -- Buscar SEGUNDO término (si existe)
        OR (
            '{{ $('1. Pre-procesamiento YCloud').first().json.terminosNormalizados[1] || "" }}' != '' 
            AND (
                name ILIKE '%' || '{{ $('1. Pre-procesamiento YCloud').first().json.terminosNormalizados[1] || "" }}' || '%'
                OR description ILIKE '%' || '{{ $('1. Pre-procesamiento YCloud').first().json.terminosNormalizados[1] || "" }}' || '%'
            )
        )
        
        -- Buscar TERCER término (si existe)
        OR (
            '{{ $('1. Pre-procesamiento YCloud').first().json.terminosNormalizados[2] || "" }}' != ''
            AND name ILIKE '%' || '{{ $('1. Pre-procesamiento YCloud').first().json.terminosNormalizados[2] || "" }}' || '%'
        )
    )
ORDER BY 
    id,
    price ASC
LIMIT 8;

-- =====================================================
-- ALTERNATIVA MÁS SIMPLE (si sigue fallando):
-- =====================================================
-- SELECT 
--     id,
--     name,
--     COALESCE(discount_price, price) as price,
--     description,
--     category_name
-- FROM productos_tienda
-- WHERE 
--     is_active = true
--     AND (
--         name ILIKE '%' || '{{ $('1. Pre-procesamiento YCloud').first().json.terminoNormalizado }}' || '%'
--         OR description ILIKE '%' || '{{ $('1. Pre-procesamiento YCloud').first().json.terminoNormalizado }}' || '%'
--     )
-- ORDER BY price ASC
-- LIMIT 8;
-- =====================================================
