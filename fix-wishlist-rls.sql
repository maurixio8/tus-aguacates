-- Fix para políticas RLS de la tabla wishlist
-- Este script crea las políticas necesarias para que el sistema de favoritos funcione correctamente

-- 1. Asegurarse de que RLS esté habilitado en la tabla wishlist
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes si las hay (para evitar conflictos)
DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can insert own wishlist items" ON wishlist;
DROP POLICY IF EXISTS "Users can update own wishlist items" ON wishlist;
DROP POLICY IF EXISTS "Users can delete own wishlist items" ON wishlist;

-- 3. Crear políticas RLS para la tabla wishlist

-- Política para SELECT (leer propios favoritos)
CREATE POLICY "Users can view own wishlist" ON wishlist
  FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT (agregar productos a favoritos)
CREATE POLICY "Users can insert own wishlist items" ON wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE (actualizar propios favoritos - si es necesario)
CREATE POLICY "Users can update own wishlist items" ON wishlist
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para DELETE (eliminar propios favoritos)
CREATE POLICY "Users can delete own wishlist items" ON wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Verificar que las políticas se crearon correctamente
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
WHERE tablename = 'wishlist';

-- 5. Verificar que RLS esté habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'wishlist';