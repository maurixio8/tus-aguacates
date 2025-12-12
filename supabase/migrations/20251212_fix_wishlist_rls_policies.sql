-- ============================================================================
-- RLS Policies for Wishlist Table
-- Purpose: Allow authenticated users to manage their own wishlist items
-- Date: 2025-12-12
-- Issue: Fix RLS policy violation (code 42501) when adding products to favorites
-- ============================================================================

-- Enable RLS on wishlist table if not already enabled
ALTER TABLE IF EXISTS public.wishlist ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Wishlist Table RLS Policies
-- ============================================================================

-- 1. SELECT: Users can view their own wishlist items
DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlist;
CREATE POLICY "Users can view their own wishlist"
  ON public.wishlist FOR SELECT
  USING (auth.uid() = user_id);

-- 2. INSERT: Users can add items to their own wishlist
DROP POLICY IF EXISTS "Users can insert their own wishlist items" ON public.wishlist;
CREATE POLICY "Users can insert their own wishlist items"
  ON public.wishlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. DELETE: Users can remove items from their own wishlist
DROP POLICY IF EXISTS "Users can delete their own wishlist items" ON public.wishlist;
CREATE POLICY "Users can delete their own wishlist items"
  ON public.wishlist FOR DELETE
  USING (auth.uid() = user_id);

-- 4. UPDATE: Users can update their own wishlist items (if needed in the future)
DROP POLICY IF EXISTS "Users can update their own wishlist items" ON public.wishlist;
CREATE POLICY "Users can update their own wishlist items"
  ON public.wishlist FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Admin Access (optional, for admin panel if needed)
-- ============================================================================

-- Allow service_role full access (for admin operations via Supabase Dashboard)
DROP POLICY IF EXISTS "Service role has full access to wishlist" ON public.wishlist;
CREATE POLICY "Service role has full access to wishlist"
  ON public.wishlist FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Verify Policies
-- ============================================================================

-- Query to verify the policies were created successfully
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'wishlist'
ORDER BY cmd, policyname;

-- Add comments for documentation
COMMENT ON TABLE public.wishlist IS 'User wishlist/favorites - stores products users want to save for later';
COMMENT ON POLICY "Users can view their own wishlist" ON public.wishlist IS 'Authenticated users can only view their own wishlist items';
COMMENT ON POLICY "Users can insert their own wishlist items" ON public.wishlist IS 'Authenticated users can add products to their own wishlist';
COMMENT ON POLICY "Users can delete their own wishlist items" ON public.wishlist IS 'Authenticated users can remove products from their own wishlist';
COMMENT ON POLICY "Users can update their own wishlist items" ON public.wishlist IS 'Authenticated users can update their own wishlist items (for future features)';
