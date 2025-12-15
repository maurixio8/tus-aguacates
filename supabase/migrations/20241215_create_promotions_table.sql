-- ============================================================================
-- TABLA: promotions (Slides/Banners de la página principal)
-- Este script maneja tanto tablas nuevas como existentes
-- ============================================================================

-- Crear la tabla promotions si no existe
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    link VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AGREGAR COLUMNAS FALTANTES (si la tabla ya existía sin ellas)
-- ============================================================================

-- Agregar sort_order si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'promotions' 
        AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE public.promotions ADD COLUMN sort_order INTEGER DEFAULT 0;
        RAISE NOTICE 'Columna sort_order agregada';
    END IF;
END $$;

-- Agregar is_active si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'promotions' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.promotions ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Columna is_active agregada';
    END IF;
END $$;

-- Agregar updated_at si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'promotions' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.promotions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Columna updated_at agregada';
    END IF;
END $$;

-- Agregar created_at si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'promotions' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.promotions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Columna created_at agregada';
    END IF;
END $$;

-- ============================================================================
-- ÍNDICE
-- ============================================================================

-- Crear índice para consultas de promociones activas
CREATE INDEX IF NOT EXISTS idx_promotions_active 
ON public.promotions (is_active, sort_order);

-- ============================================================================
-- HABILITAR RLS
-- ============================================================================

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS RLS
-- ============================================================================

-- 1. Público puede ver promociones activas
DROP POLICY IF EXISTS "Public can view active promotions" ON public.promotions;
CREATE POLICY "Public can view active promotions"
    ON public.promotions FOR SELECT
    USING (is_active = true);

-- 2. Usuarios autenticados ven todas las promociones
DROP POLICY IF EXISTS "Authenticated can view all promotions" ON public.promotions;
CREATE POLICY "Authenticated can view all promotions"
    ON public.promotions FOR SELECT
    USING (auth.role() = 'authenticated');

-- 3. Usuarios autenticados pueden insertar
DROP POLICY IF EXISTS "Authenticated can insert promotions" ON public.promotions;
CREATE POLICY "Authenticated can insert promotions"
    ON public.promotions FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- 4. Usuarios autenticados pueden actualizar
DROP POLICY IF EXISTS "Authenticated can update promotions" ON public.promotions;
CREATE POLICY "Authenticated can update promotions"
    ON public.promotions FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 5. Usuarios autenticados pueden eliminar
DROP POLICY IF EXISTS "Authenticated can delete promotions" ON public.promotions;
CREATE POLICY "Authenticated can delete promotions"
    ON public.promotions FOR DELETE
    USING (auth.role() = 'authenticated');

-- ============================================================================
-- ACTUALIZAR REGISTROS EXISTENTES (poner valores por defecto)
-- ============================================================================

-- Si hay registros sin sort_order, asignar orden basado en id
UPDATE public.promotions 
SET sort_order = 0 
WHERE sort_order IS NULL;

-- Si hay registros sin is_active, activarlos
UPDATE public.promotions 
SET is_active = true 
WHERE is_active IS NULL;

-- ============================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE public.promotions IS 'Slides/Banners de la página principal administrables desde el dashboard';
COMMENT ON COLUMN public.promotions.title IS 'Título del banner (máx 255 caracteres)';
COMMENT ON COLUMN public.promotions.description IS 'Descripción opcional del banner';
COMMENT ON COLUMN public.promotions.image_url IS 'URL de la imagen (1200x400px recomendado, formato WebP)';
COMMENT ON COLUMN public.promotions.link IS 'URL a donde redirige el banner al hacer clic';
COMMENT ON COLUMN public.promotions.sort_order IS 'Orden de aparición (menor = primero)';
COMMENT ON COLUMN public.promotions.is_active IS 'Si el banner está visible en la página';
