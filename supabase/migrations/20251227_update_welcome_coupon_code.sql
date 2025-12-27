-- Migration: Update welcome coupon code from BIENVENIDO10 to ONLINE10
-- Created: 2025-12-27
-- Description: Changes the welcome coupon code to match the new branding

-- Update existing welcome coupon code from BIENVENIDO10 to ONLINE10
UPDATE coupons
SET
  code = 'ONLINE10',
  description = 'Cupón de bienvenida - 10% de descuento en tu primer pedido',
  updated_at = NOW()
WHERE code = 'BIENVENIDO10';

-- If BIENVENIDO10 doesn't exist, create ONLINE10 as welcome coupon
INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase, is_welcome_coupon, usage_limit, valid_until)
VALUES (
  'ONLINE10',
  'Cupón de bienvenida - 10% de descuento en tu primer pedido',
  'percentage',
  10.00,
  30000.00,
  true,
  NULL,
  (NOW() + INTERVAL '6 months')
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = NOW();
