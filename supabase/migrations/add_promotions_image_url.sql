-- Add image_url fields to promotions table
-- Migration: 2024-11-11-add-promotions-image-url

-- Check if promotions table exists and add image_url fields
DO $$
BEGIN
    -- Add image_url field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'promotions'
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE promotions ADD COLUMN image_url TEXT;
    END IF;

    -- Add mobile_image_url field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'promotions'
        AND column_name = 'mobile_image_url'
    ) THEN
        ALTER TABLE promotions ADD COLUMN mobile_image_url TEXT;
    END IF;

    -- Add sort_order field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'promotions'
        AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE promotions ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;

    -- Create index on sort_order for better performance
    CREATE INDEX IF NOT EXISTS idx_promotions_sort_order ON promotions(sort_order);

    -- Create index on is_active for better performance
    CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON promotions(is_active);
END $$;

-- Insert sample promotions if table is empty
INSERT INTO promotions (
    title,
    description,
    image_url,
    mobile_image_url,
    link,
    sort_order,
    is_active
) VALUES
(
    'Aguacates Frescos',
    'Directamente del campo a tu mesa con la mejor calidad',
    'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=1200&h=400&fit=crop',
    'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&h=300&fit=crop',
    '/productos?categoria=aguacates',
    1,
    true
),
(
    'Frutas Tropicales',
    'El sabor exótico que buscas, recién cosechadas',
    'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=1200&h=400&fit=crop',
    'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=800&h=300&fit=crop',
    '/productos?categoria=frutas-tropicales',
    2,
    true
),
(
    'Envío Gratis',
    'En pedidos mayores a $68.900 te llevamos tu pedido a domicilio sin costo',
    'https://images.unsplash.com/photo-1604386494523-d60f124d0a65?w=1200&h=400&fit=crop',
    'https://images.unsplash.com/photo-1604386494523-d60f124d0a65?w=800&h=300&fit=crop',
    '/productos',
    3,
    true
),
(
    'Ofertas Semanales',
    'Descuentos especiales en productos seleccionados esta semana',
    'https://images.unsplash.com/photo-1609080665824-f14e0655d2f3?w=1200&h=400&fit=crop',
    'https://images.unsplash.com/photo-1609080665824-f14e0655d2f3?w=800&h=300&fit=crop',
    '/ofertas',
    4,
    true
)
ON CONFLICT DO NOTHING;