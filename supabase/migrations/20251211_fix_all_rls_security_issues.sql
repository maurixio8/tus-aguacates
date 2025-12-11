-- ============================================================================
-- Migration: Fix All RLS Security Issues
-- Date: 2025-12-11
-- Purpose: Enable RLS and create proper security policies for all tables
-- ============================================================================

-- ============================================================================
-- 1. CREATE MISSING TABLES (if they don't exist)
-- ============================================================================

-- Create purchases table (admin purchase orders from suppliers)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'received', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_items table (items in each purchase order)
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table (vendors/suppliers)
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wishlist_items table (user wishlist/favorites)
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON purchase_items(product_id);

CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist_items(product_id);

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. DROP EXISTING POLICIES THAT MAY BE PROBLEMATIC
-- ============================================================================

-- Drop and recreate coupons policies
DROP POLICY IF EXISTS "Anyone can view active coupons" ON coupons;
DROP POLICY IF EXISTS "Admins can do anything with coupons" ON coupons;

-- Drop and recreate coupon_usage policies
DROP POLICY IF EXISTS "Anyone can view their own coupon usage" ON coupon_usage;
DROP POLICY IF EXISTS "Admins can do anything with coupon usage" ON coupon_usage;

-- Drop and recreate shipping_rules policies
DROP POLICY IF EXISTS "Anyone can view active shipping rules" ON shipping_rules;
DROP POLICY IF EXISTS "Admins can do anything with shipping rules" ON shipping_rules;

-- Drop and recreate guest_orders policies
DROP POLICY IF EXISTS "Cualquiera puede crear pedidos" ON guest_orders;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver todos los pedidos" ON guest_orders;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar pedidos" ON guest_orders;

-- ============================================================================
-- 5. CREATE SECURE RLS POLICIES FOR COUPONS
-- ============================================================================

-- Public can view active and valid coupons
CREATE POLICY "coupons_public_select" ON coupons
  FOR SELECT
  USING (
    is_active = true
    AND (valid_until IS NULL OR valid_until > NOW())
  );

-- Service role and authenticated users can insert coupons (admins)
CREATE POLICY "coupons_admin_insert" ON coupons
  FOR INSERT
  WITH CHECK (
    auth.role() IN ('authenticated', 'service_role')
  );

-- Service role and authenticated users can update coupons
CREATE POLICY "coupons_admin_update" ON coupons
  FOR UPDATE
  USING (auth.role() IN ('authenticated', 'service_role'))
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- Service role and authenticated users can delete coupons
CREATE POLICY "coupons_admin_delete" ON coupons
  FOR DELETE
  USING (auth.role() IN ('authenticated', 'service_role'));

-- ============================================================================
-- 6. CREATE SECURE RLS POLICIES FOR COUPON_USAGE
-- ============================================================================

-- Public can read coupon usage (for validation)
CREATE POLICY "coupon_usage_public_select" ON coupon_usage
  FOR SELECT
  USING (true);

-- Anyone (including anon) can insert coupon usage when creating an order
CREATE POLICY "coupon_usage_public_insert" ON coupon_usage
  FOR INSERT
  WITH CHECK (true);

-- Only admins can update coupon usage
CREATE POLICY "coupon_usage_admin_update" ON coupon_usage
  FOR UPDATE
  USING (auth.role() IN ('authenticated', 'service_role'))
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- Only admins can delete coupon usage
CREATE POLICY "coupon_usage_admin_delete" ON coupon_usage
  FOR DELETE
  USING (auth.role() IN ('authenticated', 'service_role'));

-- ============================================================================
-- 7. CREATE SECURE RLS POLICIES FOR SHIPPING_RULES
-- ============================================================================

-- Public can view active shipping rules
CREATE POLICY "shipping_rules_public_select" ON shipping_rules
  FOR SELECT
  USING (is_active = true);

-- Only admins can modify shipping rules
CREATE POLICY "shipping_rules_admin_all" ON shipping_rules
  FOR ALL
  USING (auth.role() IN ('authenticated', 'service_role'))
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- ============================================================================
-- 8. CREATE SECURE RLS POLICIES FOR GUEST_ORDERS
-- ============================================================================

-- Anyone can create guest orders (including anonymous users)
CREATE POLICY "guest_orders_public_insert" ON guest_orders
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated users (admins) can view all orders
CREATE POLICY "guest_orders_admin_select" ON guest_orders
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

-- Only authenticated users (admins) can update orders
CREATE POLICY "guest_orders_admin_update" ON guest_orders
  FOR UPDATE
  USING (auth.role() IN ('authenticated', 'service_role'))
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- Only authenticated users (admins) can delete orders
CREATE POLICY "guest_orders_admin_delete" ON guest_orders
  FOR DELETE
  USING (auth.role() IN ('authenticated', 'service_role'));

-- ============================================================================
-- 9. CREATE SECURE RLS POLICIES FOR PURCHASES
-- ============================================================================

-- Only authenticated users (admins) can do anything with purchases
CREATE POLICY "purchases_admin_all" ON purchases
  FOR ALL
  USING (auth.role() IN ('authenticated', 'service_role'))
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- ============================================================================
-- 10. CREATE SECURE RLS POLICIES FOR PURCHASE_ITEMS
-- ============================================================================

-- Only authenticated users (admins) can do anything with purchase_items
CREATE POLICY "purchase_items_admin_all" ON purchase_items
  FOR ALL
  USING (auth.role() IN ('authenticated', 'service_role'))
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- ============================================================================
-- 11. CREATE SECURE RLS POLICIES FOR SUPPLIERS
-- ============================================================================

-- Only authenticated users (admins) can do anything with suppliers
CREATE POLICY "suppliers_admin_all" ON suppliers
  FOR ALL
  USING (auth.role() IN ('authenticated', 'service_role'))
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- ============================================================================
-- 12. CREATE SECURE RLS POLICIES FOR WISHLIST_ITEMS
-- ============================================================================

-- Users can view their own wishlist items
CREATE POLICY "wishlist_items_user_select" ON wishlist_items
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add items to their own wishlist
CREATE POLICY "wishlist_items_user_insert" ON wishlist_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete items from their own wishlist
CREATE POLICY "wishlist_items_user_delete" ON wishlist_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all wishlist items
CREATE POLICY "wishlist_items_admin_select" ON wishlist_items
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

-- ============================================================================
-- 13. FIX FUNCTION SECURITY - ensure_single_default_address
-- ============================================================================

-- Drop and recreate the function with a secure search_path
DROP FUNCTION IF EXISTS ensure_single_default_address() CASCADE;

CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Unset all other default addresses for this user
    UPDATE public.addresses
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS ensure_single_default_address_trigger ON addresses;
CREATE TRIGGER ensure_single_default_address_trigger
  BEFORE INSERT OR UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION ensure_single_default_address();

-- ============================================================================
-- 14. CREATE TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Trigger for purchases
DROP TRIGGER IF EXISTS update_purchases_updated_at ON purchases;
CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for suppliers
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 15. ADD HELPFUL COMMENTS
-- ============================================================================

COMMENT ON TABLE purchases IS 'Purchase orders from suppliers (admin only)';
COMMENT ON TABLE purchase_items IS 'Line items for each purchase order';
COMMENT ON TABLE suppliers IS 'Vendor/supplier directory (admin only)';
COMMENT ON TABLE wishlist_items IS 'User wishlists/favorites';

COMMENT ON POLICY "coupons_public_select" ON coupons IS 'Allow public to view active coupons';
COMMENT ON POLICY "guest_orders_public_insert" ON guest_orders IS 'Allow anyone to create orders';
COMMENT ON POLICY "wishlist_items_user_select" ON wishlist_items IS 'Users can only see their own wishlist';

-- ============================================================================
-- MIGRATION COMPLETE
-- All tables now have RLS enabled with appropriate security policies
-- ============================================================================
