-- Script para arreglar RLS en la tabla orders
-- Ejecutar en Supabase SQL Editor

-- Opción 1: Deshabilitar RLS temporalmente (para probar)
-- ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Opción 2: Crear política permisiva para inserción
-- Primero ver las políticas existentes
SELECT
    policyname,
    tablename,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'orders';

-- Crear política que permite insertar pedidos (para cualquier usuario autenticado o service role)
DROP POLICY IF EXISTS "Allow insert orders" ON orders;
CREATE POLICY "Allow insert orders"
ON orders
FOR INSERT
TO authenticated, anon, service_role
WITH CHECK (true);

-- Crear política que permite leer pedidos
DROP POLICY IF EXISTS "Allow read orders" ON orders;
CREATE POLICY "Allow read orders"
ON orders
FOR SELECT
TO authenticated, anon, service_role
USING (true);

-- Crear política que permite actualizar pedidos
DROP POLICY IF EXISTS "Allow update orders" ON orders;
CREATE POLICY "Allow update orders"
ON orders
FOR UPDATE
TO authenticated, anon, service_role
USING (true)
WITH CHECK (true);

-- También arreglar order_items
DROP POLICY IF EXISTS "Allow insert order_items" ON order_items;
CREATE POLICY "Allow insert order_items"
ON order_items
FOR INSERT
TO authenticated, anon, service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read order_items" ON order_items;
CREATE POLICY "Allow read order_items"
ON order_items
FOR SELECT
TO authenticated, anon, service_role
USING (true);

-- Verificar que RLS está habilitado pero con las políticas correctas
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Verificar las nuevas políticas
SELECT
    policyname,
    tablename,
    cmd
FROM pg_policies
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, cmd;
