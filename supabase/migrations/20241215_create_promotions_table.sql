-- ============================================================================
-- TABLA: promotions (Slides/Banners de la página principal)
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

-- Crear índice para consultas de promociones activas
CREATE INDEX IF NOT EXISTS idx_promotions_active 
ON public.promotions (is_active, sort_order);

-- Habilitar RLS
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
-- STORAGE BUCKET: promotion-images
-- ============================================================================

-- Crear bucket para imágenes de promociones (usamos el mismo product-images)
-- Si prefieres un bucket separado, descomenta esto:
/*
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'promotion-images',
    'promotion-images',
    true,
    5242880, -- 5MB máximo para banners
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880;
*/

-- ============================================================================
-- DATOS DE EJEMPLO (Opcionales - Descomenta si quieres datos iniciales)
-- ============================================================================

/*
INSERT INTO public.promotions (title, description, image_url, link, sort_order, is_active) VALUES
('Aguacates Frescos', 'Directamente del campo a tu mesa', 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=1200&h=400&fit=crop', '/tienda/aguacates', 1, true),
('Frutas Tropicales', 'El sabor exótico que buscas', 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=1200&h=400&fit=crop', '/tienda/frutas-tropicales', 2, true),
('Envío Gratis', 'En pedidos mayores a $68.900', 'https://images.unsplash.com/photo-1604386494523-d60f124d0a65?w=1200&h=400&fit=crop', '/tienda', 3, true);
*/

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
