-- =====================================================
-- 🔍 DETECTAR CONFLICTOS DE DUPLICADOS
-- =====================================================
-- Ejecutar PRIMERO para ver qué conflictos hay
-- =====================================================

-- =====================================================
-- 1. Encontrar teléfonos que serían duplicados al normalizar
-- =====================================================
SELECT 
    REPLACE(telefono, '+', '') as telefono_normalizado,
    COUNT(*) as cantidad,
    STRING_AGG(telefono || ' (ID:' || id || ', ' || COALESCE(nombre, 'SIN NOMBRE') || ')', ' | ') as registros
FROM clientes
GROUP BY REPLACE(telefono, '+', '')
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- =====================================================
-- 2. Ver detalles de los duplicados
-- =====================================================
SELECT 
    c1.id as id_con_mas,
    c1.telefono as tel_con_mas,
    c1.nombre as nombre1,
    c2.id as id_sin_mas,
    c2.telefono as tel_sin_mas,
    c2.nombre as nombre2
FROM clientes c1
JOIN clientes c2 ON REPLACE(c1.telefono, '+', '') = c2.telefono
WHERE c1.telefono LIKE '+%' 
  AND c2.telefono NOT LIKE '+%'
ORDER BY c1.id;

-- =====================================================
-- 3. RESOLVER: Eliminar duplicados (mantener el que tiene datos)
-- =====================================================
-- Esta query elimina el registro con MENOS datos

BEGIN;

-- Primero hacer ROLLBACK si hay transacción pendiente
-- ROLLBACK;

-- Eliminar duplicados: mantener el que tiene más datos
DELETE FROM clientes c1
USING clientes c2
WHERE c1.telefono LIKE '+%'
  AND REPLACE(c1.telefono, '+', '') = c2.telefono
  AND c2.telefono NOT LIKE '+%'
  -- Mantener el que tiene nombre, eliminar el que no tiene
  AND (
    (c1.nombre IS NULL AND c2.nombre IS NOT NULL)
    OR 
    (c1.nombre IS NOT NULL AND c2.nombre IS NOT NULL AND c1.id > c2.id)
    OR
    (c1.nombre IS NULL AND c2.nombre IS NULL AND c1.id > c2.id)
  );

-- Ver cuántos quedaron
SELECT 'Duplicados eliminados' as status, 
       COUNT(*) as total_clientes 
FROM clientes;

-- =====================================================
-- 4. AHORA SÍ: Normalizar teléfonos (quitar +)
-- =====================================================
UPDATE clientes 
SET telefono = REPLACE(telefono, '+', '')
WHERE telefono LIKE '+%';

-- Verificar
SELECT 
    'DESPUÉS DE NORMALIZACIÓN' as estado,
    COUNT(*) as total,
    COUNT(CASE WHEN telefono LIKE '+%' THEN 1 END) as con_mas,
    COUNT(CASE WHEN LENGTH(telefono) = 12 AND telefono LIKE '57%' THEN 1 END) as formato_ok
FROM clientes;

COMMIT;
