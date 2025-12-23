-- =====================================================
-- POLÍTICAS RLS PARA LA TABLA WISHLIST (VERSIÓN FINAL OPTIMIZADA)
-- =====================================================
-- Ejecutar este script directamente en la consola SQL de Supabase
-- https://supabase.com/dashboard/project/gxqkmaaqoehydulksudj/sql

-- CAMBIOS REALIZADOS EN ESTA VERSIÓN:
-- ====================================
-- 1. Simplificada la política INSERT para cooperar con la restricción UNIQUE
-- 2. Eliminada la verificación de duplicados en la política RLS (era redundante)
-- 3. La restricción UNIQUE (user_id, product_id) maneja la prevención de duplicados
-- 4. Mejorado el manejo de errores y ejemplos de uso en el frontend
-- 5. Actualizadas las pruebas recomendadas para reflejar los cambios

-- ESTRUCTURA DE LA TABLA WISHLIST:
-- - id: uuid (NOT NULL, PRIMARY KEY, DEFAULT gen_random_uuid())
-- - user_id: uuid (NOT NULL, REFERENCES auth.users(id))
-- - product_id: uuid (NOT NULL, REFERENCES products(id))
-- - created_at: timestamptz (NULLABLE, DEFAULT NOW())
-- - UNIQUE(user_id, product_id) - RESTRICCIÓN COMPUESTA CRÍTICA

-- RESTRICCIONES CONFIRMADAS:
-- - wishlist_pkey: PRIMARY KEY (id)
-- - wishlist_user_id_fkey: FOREIGN KEY (user_id)
-- - wishlist_product_id_fkey: FOREIGN KEY (product_id)
-- - wishlist_user_id_product_id_key: UNIQUE (user_id, product_id)

-- 1. Habilitar RLS en la tabla wishlist (si no está habilitado)
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can insert own wishlist items" ON wishlist;
DROP POLICY IF EXISTS "Users can update own wishlist items" ON wishlist;
DROP POLICY IF EXISTS "Users can delete own wishlist items" ON wishlist;
DROP POLICY IF EXISTS "Users can add to own wishlist" ON wishlist; -- Política de la migración original

-- 3. Crear políticas RLS para la tabla wishlist con manejo de restricción UNIQUE

-- Política para SELECT - Los usuarios pueden ver sus propios favoritos
CREATE POLICY "Users can view own wishlist" ON wishlist
  FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT - Los usuarios pueden agregar productos a sus favoritos
-- VERIFICACIONES CRÍTICAS:
-- 1. auth.uid() = user_id (solo el usuario autenticado puede insertar)
-- 2. product_id IS NOT NULL (el producto debe existir)
-- NOTA: La verificación de duplicados se maneja a nivel de base de datos con la restricción UNIQUE
-- La política RLS solo debe verificar la autenticación y validez de los datos
CREATE POLICY "Users can insert own wishlist items" ON wishlist
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    product_id IS NOT NULL
  );

-- Política para UPDATE - Los usuarios pueden actualizar sus propios favoritos
-- Nota: created_at puede ser NULL, pero user_id y product_id son NOT NULL
CREATE POLICY "Users can update own wishlist items" ON wishlist
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para DELETE - Los usuarios pueden eliminar sus propios favoritos
CREATE POLICY "Users can delete own wishlist items" ON wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Crear función para manejar errores de violación UNIQUE (opcional pero recomendado)
CREATE OR REPLACE FUNCTION handle_wishlist_unique_violation()
RETURNS TRIGGER AS $$
BEGIN
    -- Esta función puede ser usada por el frontend para manejar errores específicos
    -- de violación de restricción UNIQUE de manera más elegante
    RAISE EXCEPTION 'El producto ya está en la lista de favoritos del usuario';
END;
$$ LANGUAGE plpgsql;

-- 5. Crear trigger para capturar violaciones de restricción UNIQUE (opcional)
-- DROP TRIGGER IF EXISTS wishlist_unique_violation_trigger ON wishlist;
-- CREATE TRIGGER wishlist_unique_violation_trigger
--   BEFORE INSERT ON wishlist
--   FOR EACH ROW
--   EXECUTE FUNCTION handle_wishlist_unique_violation();

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
WHERE tablename = 'wishlist'
ORDER BY policyname;

-- 5. Verificar que RLS esté habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'wishlist';

-- 6. Verificar estructura de la tabla wishlist
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'wishlist'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Verificar restricciones de la tabla
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'wishlist'
  AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 8. COMENTARIOS IMPORTANTES SOBRE MANEJO DE ERRORES UNIQUE
-- =========================================================

-- La política INSERT ha sido simplificada para cooperar con la restricción UNIQUE:
-- - La política RLS solo verifica autenticación y validez de datos
-- - La restricción UNIQUE (user_id, product_id) maneja la prevención de duplicados

-- Esto proporciona una capa única y eficiente de protección contra duplicados:
-- 1. A nivel de base de datos (restricción UNIQUE) - MÁS EFICIENTE Y CONFIABLE

-- MANEJO DE ERRORES EN EL FRONTEND (EJEMPLOS):
-- =============================================

-- Caso 1: Violación de restricción UNIQUE (código PostgreSQL 23505)
-- El frontend debe manejar este error específico:
-- {
--   "error": "duplicate key value violates unique constraint \"wishlist_user_id_product_id_key\"",
--   "code": "23505",
--   "details": "Key (user_id, product_id)=(uuid, uuid) already exists."
-- }

-- Caso 2: Verificación previa en la API (código HTTP 409)
-- La API verifica duplicados antes de intentar insertar:
-- {
--   "error": "El producto ya está en favoritos",
--   "status": 409
-- }

-- EJEMPLO DE MANEJO EN EL FRONTEND:
-- ================================

-- try {
--   const response = await fetch('/api/wishlist', {
--     method: 'POST',
--     headers: {
--       'Authorization': `Bearer ${token}`,
--       'Content-Type': 'application/json'
--     },
--     body: JSON.stringify({ product_id })
--   });
--
--   const data = await response.json();
--
--   if (response.status === 409) {
--     // El producto ya está en favoritos (verificado por la API antes de insertar)
--     showMessage('Este producto ya está en tus favoritos');
--   } else if (response.status === 400 && data.error?.includes('duplicate key')) {
--     // Violación de restricción UNIQUE (manejado por la base de datos)
--     showMessage('Este producto ya está en tus favoritos');
--   } else if (!response.ok) {
--     throw new Error(data.error || 'Error al agregar a favoritos');
--   }
--
--   // Éxito
--   showMessage('Producto agregado a favoritos');
-- } catch (error) {
--   console.error('Error adding to wishlist:', error);
--   showMessage('Error al agregar a favoritos');
-- }

-- 9. PRUEBAS RECOMENDADAS
-- ======================

-- Para probar el funcionamiento correcto de las políticas con la restricción UNIQUE:

-- 1. Insertar un producto en favoritos (debe funcionar):
-- INSERT INTO wishlist (user_id, product_id) VALUES ('user_uuid', 'product_uuid');

-- 2. Intentar insertar el mismo producto nuevamente (debe fallar con error 23505):
-- INSERT INTO wishlist (user_id, product_id) VALUES ('user_uuid', 'product_uuid');
-- ERROR: duplicate key value violates unique constraint "wishlist_user_id_product_id_key"

-- 3. Verificar que solo exista un registro:
-- SELECT * FROM wishlist WHERE user_id = 'user_uuid' AND product_id = 'product_uuid';

-- 4. Probar con diferentes usuarios (debe funcionar):
-- INSERT INTO wishlist (user_id, product_id) VALUES ('other_user_uuid', 'product_uuid');

-- 5. Probar con diferentes productos (debe funcionar):
-- INSERT INTO wishlist (user_id, product_id) VALUES ('user_uuid', 'other_product_uuid');

-- 6. Verificar políticas RLS con contexto de usuario:
-- SET ROLE authenticated;
-- SET request.jwt.claim.sub = 'user_uuid';
-- SELECT * FROM wishlist; -- Solo debe mostrar los favoritos del usuario