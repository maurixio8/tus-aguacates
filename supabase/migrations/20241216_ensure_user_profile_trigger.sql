-- ====================================================
-- MIGRACIÓN: Asegurar que el trigger ensure_user_profile esté correctamente configurado
-- ====================================================
-- Fecha: 2024-12-16
-- Propósito: Crear automáticamente el perfil cuando se registra un nuevo usuario
-- ====================================================

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Eliminar función existente si existe
DROP FUNCTION IF EXISTS public.ensure_user_profile();

-- Crear función que se ejecuta cuando se crea un nuevo usuario
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Crear trigger que ejecuta la función cuando se inserta un nuevo usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_profile();

-- Comentario
COMMENT ON FUNCTION public.ensure_user_profile() IS 'Crea automáticamente un perfil en la tabla profiles cuando se registra un nuevo usuario';
