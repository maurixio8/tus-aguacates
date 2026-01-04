-- =====================================================
-- 🧹 LIMPIAR MEMORIA CONTAMINADA
-- Ejecutar en PostgreSQL para eliminar historial viejo
-- =====================================================

-- Ver tabla de memoria del chat
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%chat%' OR table_name LIKE '%memory%' OR table_name LIKE '%n8n%';

-- Limpiar historial de chat de más de 1 día
DELETE FROM n8n_chat_histories 
WHERE created_at < NOW() - INTERVAL '1 day';

-- Alternativamente, limpiar TODO el historial
-- DELETE FROM n8n_chat_histories;

-- Verificar que se limpió
SELECT COUNT(*) as registros_restantes FROM n8n_chat_histories;

-- =====================================================
-- 📊 VERIFICAR PRODUCTOS EN TIENDA
-- =====================================================

-- Total de productos activos
SELECT COUNT(*) as total_productos FROM productos_tienda WHERE is_active = true;

-- Productos por categoría
SELECT category_name, COUNT(*) as cantidad 
FROM productos_tienda 
WHERE is_active = true 
GROUP BY category_name 
ORDER BY cantidad DESC;

-- Buscar "miel" (para probar)
SELECT id, name, price, category_name 
FROM productos_tienda 
WHERE name ILIKE '%miel%' OR description ILIKE '%miel%'
LIMIT 5;

-- Buscar "café" (no debería existir)
SELECT id, name, price, category_name 
FROM productos_tienda 
WHERE name ILIKE '%café%' OR name ILIKE '%cafe%'
LIMIT 5;
