-- ====================================================
-- MIGRACIÓN: Corregir trigger ensure_user_profile para que funcione con RLS
-- ====================================================
-- Fecha: 2024-12-16
-- Propósito: Permitir que el trigger cree perfiles sin ser bloqueado por RLS
-- ====================================================

-- Eliminar función existente
DROP FUNCTION IF EXISTS public.ensure_user_profile() CASCADE;

-- Crear función con permisos para bypasear RLS
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insertar perfil usando SECURITY DEFINER para bypasear RLS
  INSERT INTO public.profiles (id, full_name, preferred_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULL,
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log del error pero no bloquear la creación del usuario
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Dar permisos al rol de servicio de Supabase
ALTER FUNCTION public.ensure_user_profile() OWNER TO postgres;

-- Recrear trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_profile();

-- Comentario
COMMENT ON FUNCTION public.ensure_user_profile() IS 'Crea automáticamente un perfil en la tabla profiles cuando se registra un nuevo usuario. Usa SECURITY DEFINER para bypasear RLS.';
