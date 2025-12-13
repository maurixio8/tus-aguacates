-- Fix wishlist.product_id column type
-- Products in this app come from local JSON with IDs like 'product-1', 'product-2'
-- The column was UUID but needs to be TEXT to support these IDs

-- First, drop any foreign key constraints on product_id if they exist
ALTER TABLE wishlist DROP CONSTRAINT IF EXISTS wishlist_product_id_fkey;

-- Change the column type from UUID to TEXT
ALTER TABLE wishlist ALTER COLUMN product_id TYPE TEXT;

-- Re-create the index for performance
DROP INDEX IF EXISTS wishlist_user_product_idx;
CREATE UNIQUE INDEX wishlist_user_product_idx ON wishlist(user_id, product_id);

-- Update RLS policies if needed (they should work with TEXT as well)
