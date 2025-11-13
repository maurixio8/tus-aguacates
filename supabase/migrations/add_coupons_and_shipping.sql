-- Create enhanced coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2), -- Maximum discount for percentage coupons
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  usage_limit INTEGER DEFAULT NULL, -- NULL = unlimited
  times_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_welcome_coupon BOOLEAN DEFAULT false,
  free_shipping BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coupon usage tracking table
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  order_id UUID REFERENCES guest_orders(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shipping rules table
CREATE TABLE IF NOT EXISTS shipping_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  zone VARCHAR(100) NOT NULL DEFAULT 'Bogotá',
  free_shipping_min DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default Bogotá shipping rule (Free shipping for orders >= $68,900, otherwise $7,400)
INSERT INTO shipping_rules (name, zone, free_shipping_min, shipping_cost, priority)
VALUES (
  'Envío Estándar Bogotá',
  'Bogotá',
  68900.00,
  7400.00,
  1
) ON CONFLICT DO NOTHING;

-- Insert welcome coupon example (10% off, min purchase $30,000, unlimited usage)
INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase, is_welcome_coupon, usage_limit, valid_until)
VALUES (
  'BIENVENIDO10',
  'Cupón de bienvenida - 10% de descuento en tu primer pedido',
  'percentage',
  10.00,
  30000.00,
  true,
  NULL,
  (NOW() + INTERVAL '6 months')
) ON CONFLICT (code) DO NOTHING;

-- Insert sample coupons for testing
INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase, usage_limit, valid_until)
VALUES
  ('VERANO15', 'Descuento de verano - 15% en pedidos mayores a $50,000', 'percentage', 15.00, 50000.00, 100, (NOW() + INTERVAL '3 months')),
  ('FIJO5000', '$5,000 de descuento en pedidos mayores a $25,000', 'fixed', 5000.00, 25000.00, 50, (NOW() + INTERVAL '2 months')),
  ('GRATIS20', 'Envío gratis en pedidos mayores a $20,000', 'percentage', 0.00, 20000.00, 200, (NOW() + INTERVAL '1 month')),
  ('PRIMAVERA10', '10% de descuento - temporada primavera', 'percentage', 10.00, 15000.00, 75, (NOW() + INTERVAL '4 months'))
ON CONFLICT (code) DO NOTHING;

-- Update sample coupons with free shipping flag
UPDATE coupons SET free_shipping = true WHERE code = 'GRATIS20';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON coupons(valid_until);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_used_at ON coupon_usage(used_at);
CREATE INDEX IF NOT EXISTS idx_shipping_rules_active ON shipping_rules(is_active);

-- Enable Row Level Security
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coupons (public read for validation, admin write)
CREATE POLICY "Anyone can view active coupons" ON coupons
  FOR SELECT USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

CREATE POLICY "Admins can do anything with coupons" ON coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN admin_users ON auth.users.id = admin_users.user_id
      WHERE auth.users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- RLS Policies for coupon_usage
CREATE POLICY "Anyone can view their own coupon usage" ON coupon_usage
  FOR SELECT USING (true);

CREATE POLICY "Admins can do anything with coupon usage" ON coupon_usage
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN admin_users ON auth.users.id = admin_users.user_id
      WHERE auth.users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- RLS Policies for shipping rules (public read, admin write)
CREATE POLICY "Anyone can view active shipping rules" ON shipping_rules
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can do anything with shipping rules" ON shipping_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN admin_users ON auth.users.id = admin_users.user_id
      WHERE auth.users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipping_rules_updated_at BEFORE UPDATE ON shipping_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();