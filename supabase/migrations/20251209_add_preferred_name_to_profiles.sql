-- ============================================================================
-- Add preferred_name field to profiles table
-- Purpose: Enable personalized greetings using preferred names
-- ============================================================================

-- Add preferred_name column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_name VARCHAR(100);

-- Add comment for documentation
COMMENT ON COLUMN profiles.preferred_name IS 'Nombre preferido del cliente para saludos personalizados. Si está disponible, se usa优先 sobre full_name para los saludos.';

-- Create index for better performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_name ON profiles(preferred_name) WHERE preferred_name IS NOT NULL;

-- Success message
SELECT 'Campo preferred_name agregado exitosamente a la tabla profiles' as status;