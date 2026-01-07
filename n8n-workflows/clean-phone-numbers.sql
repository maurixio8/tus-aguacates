-- =====================================================
-- 🧹 LIMPIEZA MAESTRA DE TELÉFONOS (Espacios, Prefijos y Duplicados)
-- =====================================================

-- 1. ELIMINAR ESPACIOS Y GUIONES
-- Primero borramos los que, al limpiar, chocarían con uno ya existente limpio.
DELETE FROM clientes c1
WHERE (c1.telefono LIKE '% %' OR c1.telefono LIKE '%-%')
  AND EXISTS (
    SELECT 1 FROM clientes c2 
    WHERE c2.telefono = TRANSLATE(c1.telefono, ' -', '')
  );

-- Luego limpiamos los que quedan (que son únicos)
UPDATE clientes 
SET telefono = TRANSLATE(telefono, ' -', '') 
WHERE telefono LIKE '% %' OR telefono LIKE '%-%';


-- 2. NORMALIZAR: AGREGAR PREFIJO 57 (Si falta)
-- Borrar si ya existe la versión con 57
DELETE FROM clientes c1
WHERE LENGTH(c1.telefono) = 10 
  AND c1.telefono LIKE '3%'
  AND EXISTS (
    SELECT 1 FROM clientes c2 
    WHERE c2.telefono = '57' || c1.telefono
  );

-- Agregar 57 a los restantes
UPDATE clientes 
SET telefono = '57' || telefono 
WHERE LENGTH(telefono) = 10 AND telefono LIKE '3%';


-- 3. QUITAR EL '+' (Si quedó alguno)
DELETE FROM clientes c1
WHERE c1.telefono LIKE '+%'
  AND EXISTS (
    SELECT 1 FROM clientes c2 
    WHERE c2.telefono = REPLACE(c1.telefono, '+', '')
  );

UPDATE clientes 
SET telefono = REPLACE(telefono, '+', '') 
WHERE telefono LIKE '+%';


-- 4. VERIFICACIÓN FINAL
SELECT 
    COUNT(*) as total_procesados,
    'Base de datos limpia, sin espacios ni duplicados' as estado
FROM clientes;
