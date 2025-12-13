-- Fix orders payment_method check constraint to include 'nequi'
-- This constraint was blocking order creation with Nequi as payment method

-- Drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

-- Add the updated constraint that includes 'nequi'
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
CHECK (payment_method IN ('daviplata', 'nequi', 'efectivo'));
