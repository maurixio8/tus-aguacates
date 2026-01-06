-- =====================================================
-- 🔍 DIAGNÓSTICO DE CALIDAD DE DATOS - CLIENTES
-- =====================================================
-- Ejecutar cada sección por separado para analizar
-- =====================================================

-- =====================================================
-- 1️⃣ TELÉFONOS DUPLICADOS
-- =====================================================
SELECT 
    telefono,
    COUNT(*) as veces_repetido,
    STRING_AGG(nombre, ' | ') as nombres_asociados
FROM clientes
GROUP BY telefono
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC
LIMIT 20;

-- =====================================================
-- 2️⃣ FORMATO DE TELÉFONOS - Análisis por longitud
-- =====================================================
SELECT 
    LENGTH(telefono) as longitud,
    COUNT(*) as cantidad,
    LEFT(telefono, 4) as prefijo_ejemplo
FROM clientes
GROUP BY LENGTH(telefono), LEFT(telefono, 4)
ORDER BY cantidad DESC;

-- =====================================================
-- 3️⃣ TELÉFONOS CON FORMATO INCORRECTO
-- =====================================================
-- Teléfonos muy cortos o muy largos
SELECT id, nombre, telefono, LENGTH(telefono) as longitud
FROM clientes
WHERE LENGTH(telefono) < 10 OR LENGTH(telefono) > 15
ORDER BY LENGTH(telefono)
LIMIT 30;

-- =====================================================
-- 4️⃣ TELÉFONOS SIN FORMATO ESTÁNDAR (no empiezan con 57 o 3)
-- =====================================================
SELECT id, nombre, telefono
FROM clientes
WHERE telefono NOT LIKE '57%' 
  AND telefono NOT LIKE '3%'
  AND telefono NOT LIKE '+57%'
LIMIT 30;

-- =====================================================
-- 5️⃣ NOMBRES CON PROBLEMAS DE ENCODING (tildes rotas)
-- =====================================================
SELECT id, nombre, telefono
FROM clientes
WHERE nombre ~ '[^\x00-\x7F]'  -- Tiene caracteres no ASCII (tildes, ñ)
  AND (
    nombre LIKE '%Ã%' OR
    nombre LIKE '%Â%' OR
    nombre LIKE '%�%' OR
    nombre LIKE '%ï¿½%'
  )
LIMIT 30;

-- =====================================================
-- 6️⃣ NOMBRES MUY CORTOS O SOSPECHOSOS
-- =====================================================
SELECT id, nombre, telefono
FROM clientes
WHERE nombre IS NOT NULL
  AND (
    LENGTH(nombre) < 3 OR
    nombre ~ '^[0-9]+$' OR           -- Solo números
    nombre ~ '^[^a-zA-ZáéíóúÁÉÍÓÚñÑ]' -- No empieza con letra
  )
LIMIT 30;

-- =====================================================
-- 7️⃣ RESUMEN GENERAL DE CALIDAD
-- =====================================================
SELECT 
    COUNT(*) as total_clientes,
    COUNT(CASE WHEN telefono ~ '^57[0-9]{10}$' THEN 1 END) as telefono_formato_correcto,
    COUNT(CASE WHEN LENGTH(telefono) BETWEEN 10 AND 12 THEN 1 END) as telefono_longitud_ok,
    COUNT(CASE WHEN nombre IS NOT NULL AND LENGTH(nombre) >= 3 THEN 1 END) as nombre_valido,
    COUNT(CASE WHEN direccion IS NOT NULL AND LENGTH(direccion) >= 10 THEN 1 END) as direccion_valida
FROM clientes;

-- =====================================================
-- 8️⃣ EJEMPLOS DE TILDES (verificar que se ven bien)
-- =====================================================
SELECT id, nombre
FROM clientes
WHERE nombre LIKE '%á%' 
   OR nombre LIKE '%é%' 
   OR nombre LIKE '%í%' 
   OR nombre LIKE '%ó%' 
   OR nombre LIKE '%ú%'
   OR nombre LIKE '%ñ%'
   OR nombre LIKE '%Ñ%'
LIMIT 20;

-- =====================================================
-- 9️⃣ TOP 20 CLIENTES CON DATOS COMPLETOS
-- =====================================================
SELECT id, nombre, telefono, LEFT(direccion, 50) as direccion_corta, email
FROM clientes
WHERE nombre IS NOT NULL 
  AND direccion IS NOT NULL
  AND LENGTH(nombre) >= 3
ORDER BY id DESC
LIMIT 20;
