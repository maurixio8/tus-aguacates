-- =====================================================
-- 🔍 QUERY SQL v4 - BÚSQUEDA POR PALABRAS INDIVIDUALES
-- =====================================================
-- Busca CADA palabra del término por separado
-- "pero manzana" → solo busca "manzana"
-- "apio y cebolla" → busca "apio" OR "cebolla"
-- =====================================================

SELECT DISTINCT
    id,
    name,
    price,
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
                OR category_name ILIKE '%' || '{{ $('1. Pre-procesamiento YCloud').first().json.terminosNormalizados[1] || "" }}' || '%'
            )
        )
        
        -- Buscar TERCER término (si existe)
        OR (
            '{{ $('1. Pre-procesamiento YCloud').first().json.terminosNormalizados[2] || "" }}' != ''
            AND name ILIKE '%' || '{{ $('1. Pre-procesamiento YCloud').first().json.terminosNormalizados[2] || "" }}' || '%'
        )
    )
ORDER BY 
    CASE 
        WHEN category_name ILIKE '%' || COALESCE(NULLIF('{{ $('1. Pre-procesamiento YCloud').first().json.terminosNormalizados[0] }}', 'undefined'), '{{ $('1. Pre-procesamiento YCloud').first().json.terminoNormalizado }}') || '%' THEN 1
        WHEN name ILIKE COALESCE(NULLIF('{{ $('1. Pre-procesamiento YCloud').first().json.terminosNormalizados[0] }}', 'undefined'), '{{ $('1. Pre-procesamiento YCloud').first().json.terminoNormalizado }}') || '%' THEN 2
        ELSE 3
    END,
    price ASC
LIMIT 8;

-- =====================================================
-- CONFIGURACIÓN OBLIGATORIA:
-- Settings > "Always Output Data" = ✅ ACTIVADO
-- =====================================================
