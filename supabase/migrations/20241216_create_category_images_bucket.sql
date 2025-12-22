-- Crear bucket para imágenes de categorías
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'category-images',
  'category-images',
  true,  -- Público para que las imágenes sean accesibles
  5242880,  -- 5MB límite
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para el bucket category-images
-- Permitir lectura pública
CREATE POLICY "Category images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'category-images');

-- Permitir subida para usuarios autenticados
CREATE POLICY "Authenticated users can upload category images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'category-images'
  AND auth.role() = 'authenticated'
);

-- Permitir actualización para usuarios autenticados
CREATE POLICY "Authenticated users can update category images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'category-images'
  AND auth.role() = 'authenticated'
);

-- Permitir eliminación para usuarios autenticados
CREATE POLICY "Authenticated users can delete category images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'category-images'
  AND auth.role() = 'authenticated'
);

-- Comentarios
COMMENT ON POLICY "Category images are publicly accessible" ON storage.objects IS
'Permite que las imágenes de categorías sean accesibles públicamente';

COMMENT ON POLICY "Authenticated users can upload category images" ON storage.objects IS
'Permite que usuarios autenticados suban imágenes de categorías';
