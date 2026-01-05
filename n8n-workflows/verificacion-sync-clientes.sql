-- =====================================================
-- VERIFICACIÓN DE SINCRONIZACIÓN DE CLIENTES
-- Ejecutar en n8n con un nodo PostgreSQL temporal
-- =====================================================

-- =====================================================
-- QUERY 1: Resumen general de clientes (PostgreSQL Local)
-- =====================================================
SELECT 
  'PostgreSQL Local' as origen,
  COUNT(*) as total_clientes,
  COUNT(CASE WHEN supabase_id IS NOT NULL THEN 1 END) as sincronizados_supabase,
  COUNT(CASE WHEN supabase_id IS NULL THEN 1 END) as solo_local,
  COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as con_email,
  COUNT(CASE WHEN telefono IS NOT NULL AND telefono != '' THEN 1 END) as con_telefono,
  COUNT(CASE WHEN activo = true THEN 1 END) as activos
FROM clientes;

-- =====================================================
-- QUERY 2: Clientes listos para campaña (con teléfono válido)
-- =====================================================
SELECT 
  COUNT(*) as clientes_disponibles,
  COUNT(CASE WHEN nombre IS NOT NULL AND nombre != '' THEN 1 END) as con_nombre,
  COUNT(CASE WHEN LENGTH(telefono) >= 10 THEN 1 END) as telefono_valido
FROM clientes
WHERE 
  activo = true
  AND telefono IS NOT NULL
  AND telefono != '';

-- =====================================================
-- QUERY 3: Distribución por total de pedidos
-- =====================================================
SELECT 
  CASE 
    WHEN total_pedidos = 0 THEN '0 pedidos'
    WHEN total_pedidos BETWEEN 1 AND 3 THEN '1-3 pedidos'
    WHEN total_pedidos BETWEEN 4 AND 10 THEN '4-10 pedidos'
    ELSE '10+ pedidos'
  END as segmento,
  COUNT(*) as cantidad
FROM clientes
WHERE activo = true
GROUP BY 1
ORDER BY 
  CASE 
    WHEN total_pedidos = 0 THEN 1
    WHEN total_pedidos BETWEEN 1 AND 3 THEN 2
    WHEN total_pedidos BETWEEN 4 AND 10 THEN 3
    ELSE 4
  END;

-- =====================================================
-- QUERY 4: Muestra de clientes para campaña
-- =====================================================
SELECT 
  id,
  nombre,
  telefono,
  total_pedidos,
  CASE WHEN supabase_id IS NOT NULL THEN 'Sí' ELSE 'No' END as en_supabase
FROM clientes
WHERE 
  activo = true
  AND telefono IS NOT NULL
  AND LENGTH(telefono) >= 10
ORDER BY total_pedidos DESC
LIMIT 20;
