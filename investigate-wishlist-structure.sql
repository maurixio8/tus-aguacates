-- =====================================================
-- INVESTIGACIÓN COMPLETA DE LA ESTRUCTURA DE LA TABLA WISHLIST
-- =====================================================
-- Ejecutar este script directamente en la consola SQL de Supabase
-- https://supabase.com/dashboard/project/gxqkmaaqoehydulksudj/sql

-- 1. Ver estructura completa de la tabla wishlist
\echo '=== 1. ESTRUCTURA COMPLETA DE LA TABLA WISHLIST ==='
\d wishlist;

-- 2. Ver todas las restricciones de la tabla con sus columnas
\echo ''
\echo '=== 2. RESTRICCIONES DETALLADAS DE LA TABLA WISHLIST ==='
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    kcu.ordinal_position,
    tc.is_deferrable,
    tc.initially_deferred
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'wishlist'
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_name, kcu.ordinal_position;

-- 3. Ver índices de la tabla
\echo ''
\echo '=== 3. ÍNDICES DE LA TABLA WISHLIST ==='
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'wishlist'
    AND schemaname = 'public'
ORDER BY indexname;

-- 4. Ver políticas RLS actuales
\echo ''
\echo '=== 4. POLÍTICAS RLS ACTUALES ==='
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'wishlist'
    AND schemaname = 'public'
ORDER BY policyname;

-- 5. Verificar que RLS esté habilitado
\echo ''
\echo '=== 5. ESTADO DE RLS ==='
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'wishlist'
    AND schemaname = 'public';

-- 6. Verificar columnas de la tabla
\echo ''
\echo '=== 6. COLUMNAS DE LA TABLA WISHLIST ==='
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'wishlist'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. ANÁLISIS CRÍTICO: Verificar específicamente la restricción UNIQUE
\echo ''
\echo '=== 7. ANÁLISIS CRÍTICO DE LA RESTRICCIÓN UNIQUE ==='
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns,
    COUNT(kcu.column_name) as column_count
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'wishlist'
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'UNIQUE'
GROUP BY tc.constraint_name, tc.constraint_type
ORDER BY tc.constraint_name;

-- 8. Verificar si hay datos duplicados (para análisis de impacto)
\echo ''
\echo '=== 8. ANÁLISIS DE DATOS EXISTENTES ==='
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT product_id) as unique_products,
    COUNT(DISTINCT CONCAT(user_id, '|', product_id)) as unique_combinations
FROM wishlist;

-- 9. Verificar duplicados potenciales
\echo ''
\echo '=== 9. VERIFICACIÓN DE DUPLICADOS POTENCIALES ==='
SELECT 
    user_id,
    product_id,
    COUNT(*) as duplicate_count
FROM wishlist
GROUP BY user_id, product_id
HAVING COUNT(*) > 1
LIMIT 10;

-- 10. Recomendaciones basadas en los resultados
\echo ''
\echo '=== 10. RECOMENDACIONES ==='
\echo 'Si la restricción UNIQUE muestra solo una columna en lugar de dos (user_id, product_id):'
\echo '1. Eliminar la restricción incorrecta:'
\echo '   ALTER TABLE wishlist DROP CONSTRAINT wishlist_user_id_product_id_key;'
\echo ''
\echo '2. Crear la restricción compuesta correcta:'
\echo '   ALTER TABLE wishlist ADD CONSTRAINT wishlist_user_id_product_id_key'
\echo '     UNIQUE (user_id, product_id);'
\echo ''
\echo '3. Verificar que las políticas RLS coincidan con esta estructura'
\echo ''
\echo 'Si ya existe una restricción UNIQUE compuesta, el problema puede estar'
\echo 'en cómo se interpretan los resultados en el código del frontend.'