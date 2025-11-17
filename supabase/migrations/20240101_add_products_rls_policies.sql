-- ============================================================================
-- RLS Policies for Products Table and Storage Bucket
-- Purpose: Secure image uploads and product updates in Supabase
-- ============================================================================

-- Enable RLS on products table if not already enabled
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Products Table RLS Policies
-- ============================================================================

-- 1. SELECT: Public can view all active products
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

-- 2. SELECT: Authenticated (admin) can view all products
DROP POLICY IF EXISTS "Authenticated can view all products" ON public.products;
CREATE POLICY "Authenticated can view all products"
  ON public.products FOR SELECT
  USING (auth.role() = 'authenticated');

-- 3. INSERT: Authenticated users can insert products
DROP POLICY IF EXISTS "Authenticated can insert products" ON public.products;
CREATE POLICY "Authenticated can insert products"
  ON public.products FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 4. UPDATE: Authenticated users can update products
DROP POLICY IF EXISTS "Authenticated can update products" ON public.products;
CREATE POLICY "Authenticated can update products"
  ON public.products FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 5. DELETE: Authenticated users can delete products
DROP POLICY IF EXISTS "Authenticated can delete products" ON public.products;
CREATE POLICY "Authenticated can delete products"
  ON public.products FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- Storage Bucket Policies for product-images
-- ============================================================================

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Public can view product images
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- 2. INSERT: Authenticated users can upload product images
DROP POLICY IF EXISTS "Authenticated can upload product images" ON storage.objects;
CREATE POLICY "Authenticated can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- 3. UPDATE: Authenticated users can update product images
DROP POLICY IF EXISTS "Authenticated can update product images" ON storage.objects;
CREATE POLICY "Authenticated can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- 4. DELETE: Authenticated users can delete product images
DROP POLICY IF EXISTS "Authenticated can delete product images" ON storage.objects;
CREATE POLICY "Authenticated can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- ============================================================================
-- Ensure product-images bucket exists and is public
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  false,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- Add comment for documentation
COMMENT ON POLICY "Public can view product images" ON storage.objects IS 'Anyone can download images from the product-images bucket';
COMMENT ON POLICY "Authenticated can upload product images" ON storage.objects IS 'Authenticated users (admin staff) can upload product images';
COMMENT ON POLICY "Authenticated can update product images" ON storage.objects IS 'Authenticated users (admin staff) can update product images';
COMMENT ON POLICY "Authenticated can delete product images" ON storage.objects IS 'Authenticated users (admin staff) can delete product images';
