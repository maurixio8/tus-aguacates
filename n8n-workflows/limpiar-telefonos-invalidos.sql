-- =====================================================
-- LIMPIEZA DE TELÉFONOS INVÁLIDOS
-- =====================================================

-- QUERY 1: Encontrar teléfonos con formato incorrecto
-- (deben tener exactamente 10 dígitos después del 57, o 12 en total)
SELECT 
  id,
  nombre,
  telefono,
  LENGTH(REGEXP_REPLACE(telefono, '[^0-9]', '', 'g')) as digitos,
  CASE 
    WHEN telefono LIKE '%575%' THEN 'Tiene 575 (doble 5)'
    WHEN LENGTH(REGEXP_REPLACE(telefono, '[^0-9]', '', 'g')) < 10 THEN 'Muy corto'
    WHEN LENGTH(REGEXP_REPLACE(telefono, '[^0-9]', '', 'g')) > 12 THEN 'Muy largo'
    WHEN telefono NOT LIKE '%3%' THEN 'No empieza con 3'
    ELSE 'Revisar manualmente'
  END as problema
FROM clientes
WHERE activo = true
  AND telefono IS NOT NULL
  AND (
    -- Teléfonos con 575 (error común)
    telefono LIKE '%575%'
    -- O teléfonos muy cortos o muy largos
    OR LENGTH(REGEXP_REPLACE(telefono, '[^0-9]', '', 'g')) NOT BETWEEN 10 AND 12
  )
ORDER BY problema, nombre
LIMIT 50;

-- QUERY 2: Teléfonos con 575 (doble 5 después del código de país)
SELECT 
  id,
  nombre,
  telefono,
  'Arreglar: quitar el 5 extra' as accion
FROM clientes
WHERE activo = true
  AND telefono LIKE '%575%';

-- QUERY 3: Contar cuántos teléfonos tienen cada problema
SELECT 
  CASE 
    WHEN telefono LIKE '%575%' THEN 'Tiene 575 (doble 5)'
    WHEN LENGTH(REGEXP_REPLACE(telefono, '[^0-9]', '', 'g')) < 10 THEN 'Muy corto (<10 dígitos)'
    WHEN LENGTH(REGEXP_REPLACE(telefono, '[^0-9]', '', 'g')) > 12 THEN 'Muy largo (>12 dígitos)'
    ELSE 'OK'
  END as tipo_problema,
  COUNT(*) as cantidad
FROM clientes
WHERE activo = true AND telefono IS NOT NULL
GROUP BY 1
ORDER BY cantidad DESC;

-- =====================================================
-- CORRECCIONES AUTOMÁTICAS (ejecutar con cuidado)
-- =====================================================

-- FIX 1: Corregir teléfonos que tienen 575 (quitar el 5 extra)
-- EJEMPLO: 575731020522 → 57731020522 (aún está mal)
-- En realidad: 575731020522 probablemente debería ser 573XXXXXXXX
-- UPDATE clientes
-- SET telefono = REPLACE(telefono, '575', '573')
-- WHERE telefono LIKE '%5753%' AND activo = true;

-- FIX 2: Desactivar clientes con teléfonos inválidos
-- UPDATE clientes
-- SET activo = false
-- WHERE LENGTH(REGEXP_REPLACE(telefono, '[^0-9]', '', 'g')) NOT BETWEEN 10 AND 12
--   AND activo = true;
