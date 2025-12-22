-- ============================================================================
-- TABLA: promotions (Slides/Banners de la página principal)
-- ============================================================================
-- IMPORTANTE: Este script elimina la tabla existente y la crea de nuevo.
-- Si tienes datos importantes, haz backup primero.
-- ============================================================================

-- Paso 1: Eliminar políticas RLS existentes
DROP POLICY IF EXISTS "Public can view active promotions" ON public.promotions;
DROP POLICY IF EXISTS "Authenticated can view all promotions" ON public.promotions;
DROP POLICY IF EXISTS "Authenticated can insert promotions" ON public.promotions;
DROP POLICY IF EXISTS "Authenticated can update promotions" ON public.promotions;
DROP POLICY IF EXISTS "Authenticated can delete promotions" ON public.promotions;

-- Paso 2: Eliminar tabla existente
DROP TABLE IF EXISTS public.promotions CASCADE;

-- Paso 3: Crear tabla nueva con estructura correcta
CREATE TABLE public.promotions (
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

-- Paso 4: Crear índice
CREATE INDEX idx_promotions_active ON public.promotions (is_active, sort_order);

-- Paso 5: Habilitar RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Paso 6: Crear políticas RLS

-- Público puede ver promociones activas
CREATE POLICY "Public can view active promotions"
    ON public.promotions FOR SELECT
    USING (is_active = true);

-- Usuarios autenticados ven todas las promociones
CREATE POLICY "Authenticated can view all promotions"
    ON public.promotions FOR SELECT
    USING (auth.role() = 'authenticated');

-- Usuarios autenticados pueden insertar
CREATE POLICY "Authenticated can insert promotions"
    ON public.promotions FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Usuarios autenticados pueden actualizar
CREATE POLICY "Authenticated can update promotions"
    ON public.promotions FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Usuarios autenticados pueden eliminar
CREATE POLICY "Authenticated can delete promotions"
    ON public.promotions FOR DELETE
    USING (auth.role() = 'authenticated');

-- ============================================================================
-- DATOS DE EJEMPLO (slides iniciales)
-- ============================================================================

INSERT INTO public.promotions (title, description, image_url, link, sort_order, is_active) VALUES
('Aguacates Frescos', 'Directamente del campo a tu mesa', 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=1200&h=400&fit=crop', '/tienda/aguacates', 1, true),
('Frutas Tropicales', 'El sabor exótico que buscas', 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=1200&h=400&fit=crop', '/tienda/frutas-tropicales', 2, true),
('Envío Gratis', 'En pedidos mayores a $68.900', 'https://images.unsplash.com/photo-1604386494523-d60f124d0a65?w=1200&h=400&fit=crop', '/tienda', 3, true);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Mostrar estructura de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'promotions'
ORDER BY ordinal_position;

-- Mostrar registros insertados
SELECT id, title, is_active, sort_order FROM public.promotions ORDER BY sort_order;
