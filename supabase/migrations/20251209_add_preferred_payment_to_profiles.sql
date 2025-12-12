-- ============================================================================
-- Add preferred_payment_method field to profiles table
-- Purpose: Enable payment method preference for faster checkout
-- ============================================================================

-- Add preferred_payment_method column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_payment_method VARCHAR(50) DEFAULT 'daviplata';

-- Add comment for documentation
COMMENT ON COLUMN profiles.preferred_payment_method IS 'Método de pago preferido del cliente para autocompletado en checkout: daviplata, efectivo';

-- Create index for better performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_payment ON profiles(preferred_payment_method) WHERE preferred_payment_method IS NOT NULL;

-- Add constraint to ensure valid payment methods
ALTER TABLE profiles 
ADD CONSTRAINT IF NOT EXISTS valid_payment_method 
CHECK (preferred_payment_method IN ('daviplata', 'efectivo') OR preferred_payment_method IS NULL);

-- Success message
SELECT 'Campo preferred_payment_method agregado exitosamente a la tabla profiles' as status;