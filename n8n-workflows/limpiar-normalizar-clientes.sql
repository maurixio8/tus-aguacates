-- =====================================================
-- 🧹 LIMPIEZA Y NORMALIZACIÓN DE DATOS - CLIENTES
-- =====================================================
-- Ejecutar paso a paso, verificando cada resultado
-- =====================================================

-- =====================================================
-- 📊 ESTADO ACTUAL (ejecutar primero)
-- =====================================================
SELECT 
    'ANTES DE LIMPIEZA' as estado,
    COUNT(*) as total,
    COUNT(CASE WHEN telefono LIKE '+%' THEN 1 END) as con_prefijo_mas,
    COUNT(CASE WHEN LENGTH(telefono) = 12 AND telefono LIKE '57%' THEN 1 END) as formato_ideal,
    COUNT(CASE WHEN LENGTH(telefono) < 10 THEN 1 END) as muy_cortos,
    COUNT(CASE WHEN LENGTH(telefono) > 15 THEN 1 END) as muy_largos
FROM clientes;

-- =====================================================
-- PASO 1: Normalizar teléfonos - Quitar el +
-- =====================================================
BEGIN;

UPDATE clientes 
SET telefono = REPLACE(telefono, '+', '')
WHERE telefono LIKE '+%';

-- Verificar
SELECT 'Paso 1: + removido', COUNT(*) as afectados 
FROM clientes WHERE telefono NOT LIKE '+%';

-- =====================================================
-- PASO 2: Quitar espacios en teléfonos
-- =====================================================
UPDATE clientes 
SET telefono = REGEXP_REPLACE(telefono, '\s+', '', 'g')
WHERE telefono ~ '\s';

-- =====================================================
-- PASO 3: Agregar 57 a números de 10 dígitos
-- =====================================================
UPDATE clientes 
SET telefono = '57' || telefono
WHERE LENGTH(telefono) = 10 
  AND telefono ~ '^3[0-9]{9}$';

-- =====================================================
-- PASO 4: Limpiar nombres - Quitar espacios extra
-- =====================================================
UPDATE clientes 
SET nombre = TRIM(REGEXP_REPLACE(nombre, '\s+', ' ', 'g'))
WHERE nombre ~ '\s{2,}' OR nombre LIKE ' %' OR nombre LIKE '% ';

-- =====================================================
-- PASO 5: Capitalizar nombres (primera letra mayúscula)
-- =====================================================
UPDATE clientes 
SET nombre = INITCAP(nombre)
WHERE nombre IS NOT NULL 
  AND nombre = LOWER(nombre);

-- =====================================================
-- PASO 6: Limpiar direcciones - Quitar espacios extra
-- =====================================================
UPDATE clientes 
SET direccion = TRIM(REGEXP_REPLACE(direccion, '\s+', ' ', 'g'))
WHERE direccion ~ '\s{2,}' OR direccion LIKE ' %' OR direccion LIKE '% ';

-- =====================================================
-- PASO 7: Limpiar emails - Convertir a minúsculas
-- =====================================================
UPDATE clientes 
SET email = LOWER(TRIM(email))
WHERE email IS NOT NULL 
  AND email != LOWER(TRIM(email));

-- =====================================================
-- 📊 ESTADO DESPUÉS (verificar)
-- =====================================================
SELECT 
    'DESPUÉS DE LIMPIEZA' as estado,
    COUNT(*) as total,
    COUNT(CASE WHEN telefono LIKE '+%' THEN 1 END) as con_prefijo_mas,
    COUNT(CASE WHEN LENGTH(telefono) = 12 AND telefono LIKE '57%' THEN 1 END) as formato_ideal,
    COUNT(CASE WHEN LENGTH(telefono) < 10 THEN 1 END) as muy_cortos,
    COUNT(CASE WHEN LENGTH(telefono) > 15 THEN 1 END) as muy_largos
FROM clientes;

-- =====================================================
-- Si todo está bien, confirmar
-- =====================================================
COMMIT;

-- Si hay problemas:
-- ROLLBACK;

-- =====================================================
-- 🔍 VERIFICACIÓN FINAL COMPLETA
-- =====================================================
SELECT 
    COUNT(*) as total_clientes,
    COUNT(CASE WHEN LENGTH(telefono) = 12 AND telefono ~ '^57[0-9]{10}$' THEN 1 END) as telefono_perfecto,
    COUNT(CASE WHEN nombre IS NOT NULL AND LENGTH(TRIM(nombre)) >= 2 THEN 1 END) as nombre_ok,
    COUNT(CASE WHEN direccion IS NOT NULL AND LENGTH(TRIM(direccion)) >= 5 THEN 1 END) as direccion_ok,
    COUNT(CASE WHEN email IS NOT NULL AND email LIKE '%@%.%' THEN 1 END) as email_ok,
    COUNT(CASE WHEN activo = true THEN 1 END) as activos
FROM clientes;

-- =====================================================
-- 📋 PROBLEMAS PENDIENTES (si los hay)
-- =====================================================

-- Teléfonos con formato raro
SELECT id, nombre, telefono, LENGTH(telefono) as len
FROM clientes 
WHERE LENGTH(telefono) NOT BETWEEN 10 AND 13
   OR telefono !~ '^[0-9+]+$'
ORDER BY LENGTH(telefono)
LIMIT 20;

-- Nombres vacíos o muy cortos
SELECT id, nombre, telefono
FROM clientes
WHERE nombre IS NULL OR LENGTH(TRIM(nombre)) < 2
LIMIT 20;
