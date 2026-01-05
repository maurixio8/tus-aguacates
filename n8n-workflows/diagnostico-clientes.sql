-- =====================================================
-- DIAGNÓSTICO: Verificar integridad de datos de clientes
-- =====================================================

-- QUERY 1: Ver los 5 clientes que se seleccionaron para la prueba
SELECT 
  id,
  nombre,
  telefono,
  total_pedidos,
  total_gastado
FROM clientes
WHERE 
  activo = true
  AND telefono IS NOT NULL
  AND telefono != ''
  AND LENGTH(telefono) >= 10
  AND nombre IS NOT NULL
  AND nombre != ''
ORDER BY total_pedidos DESC, total_gastado DESC
LIMIT 5;

-- QUERY 2: Buscar a Ernesto Ahumada específicamente
SELECT 
  id,
  nombre,
  telefono,
  email
FROM clientes
WHERE nombre ILIKE '%ernesto%' OR nombre ILIKE '%ahumada%';

-- QUERY 3: Buscar quién tiene el teléfono que termina en 2716
SELECT 
  id,
  nombre,
  telefono
FROM clientes
WHERE telefono LIKE '%2716';

-- QUERY 4: Buscar el teléfono 3008662273 (el que se envió)
SELECT 
  id,
  nombre,
  telefono
FROM clientes
WHERE telefono LIKE '%3008662273%';

-- QUERY 5: Ver si hay teléfonos duplicados
SELECT 
  telefono,
  COUNT(*) as cantidad,
  STRING_AGG(nombre, ', ') as nombres
FROM clientes
WHERE telefono IS NOT NULL AND telefono != ''
GROUP BY telefono
HAVING COUNT(*) > 1
LIMIT 20;
