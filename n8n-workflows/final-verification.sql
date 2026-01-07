-- =====================================================
-- 📊 VERIFICACIÓN FINAL DE ESTADO
-- =====================================================

SELECT 
  COUNT(*) as total_clientes_locales,
  COUNT(CASE WHEN supabase_id IS NOT NULL THEN 1 END) as sincronizados_con_tienda,
  COUNT(CASE WHEN telefono LIKE '57%' AND LENGTH(telefono) = 12 THEN 1 END) as telefonos_correctos_57,
  COUNT(CASE WHEN telefono NOT LIKE '57%' THEN 1 END) as telefonos_formato_incorrecto
FROM clientes;

-- Ver 10 ejemplos de clientes que faltan por sincronizar (si los hay)
SELECT id, nombre, telefono, 'Falta Supabase ID' as estado
FROM clientes 
WHERE supabase_id IS NULL 
LIMIT 10;
