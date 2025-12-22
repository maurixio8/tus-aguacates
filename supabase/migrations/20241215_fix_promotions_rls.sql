-- ============================================================================
-- ARREGLAR POLÍTICAS RLS PARA TABLA PROMOTIONS
-- ============================================================================
-- El admin panel usa autenticación personalizada, no Supabase Auth.
-- Por eso auth.role() no funciona. Usamos políticas más permisivas.
-- ============================================================================

-- Paso 1: Eliminar políticas actuales
DROP POLICY IF EXISTS "Public can view active promotions" ON public.promotions;
DROP POLICY IF EXISTS "Authenticated can view all promotions" ON public.promotions;
DROP POLICY IF EXISTS "Authenticated can insert promotions" ON public.promotions;
DROP POLICY IF EXISTS "Authenticated can update promotions" ON public.promotions;
DROP POLICY IF EXISTS "Authenticated can delete promotions" ON public.promotions;
DROP POLICY IF EXISTS "Allow all operations" ON public.promotions;
DROP POLICY IF EXISTS "Allow public select" ON public.promotions;
DROP POLICY IF EXISTS "Allow all insert" ON public.promotions;
DROP POLICY IF EXISTS "Allow all update" ON public.promotions;
DROP POLICY IF EXISTS "Allow all delete" ON public.promotions;

-- Paso 2: Crear nuevas políticas permisivas

-- SELECT: Cualquiera puede leer (necesario para el frontend)
CREATE POLICY "Allow public select"
    ON public.promotions FOR SELECT
    USING (true);

-- INSERT: Permitir inserciones (el admin panel valida acceso por su cuenta)
CREATE POLICY "Allow all insert"
    ON public.promotions FOR INSERT
    WITH CHECK (true);

-- UPDATE: Permitir actualizaciones
CREATE POLICY "Allow all update"
    ON public.promotions FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- DELETE: Permitir eliminaciones
CREATE POLICY "Allow all delete"
    ON public.promotions FOR DELETE
    USING (true);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'promotions';
