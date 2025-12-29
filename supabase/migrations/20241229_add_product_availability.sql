-- Add product availability field to distinguish business vs retail products
-- This allows products to be shown only to businesses, only to retail customers, or both

-- Create enum type for product availability
CREATE TYPE product_availability AS ENUM ('both', 'business', 'retail');

-- Add available_for column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS available_for product_availability DEFAULT 'both';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_available_for ON products(available_for);

-- Add comment to explain the field
COMMENT ON COLUMN products.available_for IS 'Indicates where product is available: both (default), business (only for empresas), retail (only for regular customers)';

-- Update existing products to be available for both by default
UPDATE products
SET available_for = 'both'
WHERE available_for IS NULL;
