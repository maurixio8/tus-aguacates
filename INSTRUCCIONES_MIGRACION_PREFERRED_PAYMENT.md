# Instrucciones para Migración de Preferred Payment Method

## Objetivo
Agregar el campo `preferred_payment_method` a la tabla `profiles` para permitir el autocompletado del método de pago preferido en el checkout.

## SQL a ejecutar manualmente

Copia y ejecuta el siguiente SQL en el editor SQL de Supabase:

```sql
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
```

## Pasos para ejecutar en Supabase

1. Inicia sesión en tu dashboard de Supabase
2. Ve a la sección "SQL Editor"
3. Crea una nueva consulta
4. Copia y pega el SQL anterior
5. Haz clic en "Run" para ejecutar la migración
6. Verifica que no haya errores

## Verificación

Después de ejecutar la migración, puedes verificar que el campo se agregó correctamente ejecutando:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'preferred_payment_method';
```

## Impacto en la aplicación

Una vez ejecutada esta migración:

1. Los usuarios registrados podrán tener un método de pago preferido
2. El checkout autocompletará el método de pago basado en compras anteriores
3. El nuevo componente `EnhancedAuthenticatedCheckoutForm` utilizará esta información
4. La experiencia de compra será más rápida para clientes recurrentes

## Notas

- El campo tiene un valor por defecto de 'daviplata'
- Solo se permiten los valores 'daviplata' y 'efectivo'
- El campo es opcional (puede ser NULL)
- Se crea un índice para mejorar el rendimiento