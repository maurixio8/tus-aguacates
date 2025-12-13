-- ============================================================================
-- Add Nequi as valid payment method option
-- Purpose: Update constraint to allow 'nequi' as a preferred payment method
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS valid_payment_method;

-- Re-create constraint with Nequi included
ALTER TABLE profiles
ADD CONSTRAINT valid_payment_method
CHECK (preferred_payment_method IN ('daviplata', 'nequi', 'efectivo') OR preferred_payment_method IS NULL);

-- Update comment for documentation
COMMENT ON COLUMN profiles.preferred_payment_method IS 'Metodo de pago preferido del cliente para autocompletado en checkout: daviplata, nequi, efectivo';

-- Success message
SELECT 'Nequi agregado como metodo de pago valido' as status;
