-- ====================================================
-- MIGRACIÓN: Agregar columna preferred_name a profiles
-- ====================================================
-- Fecha: 2024-12-16
-- Propósito: Agregar columna faltante preferred_name a la tabla profiles
-- ====================================================

-- Agregar columna preferred_name
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_name TEXT;

-- Comentario
COMMENT ON COLUMN public.profiles.preferred_name IS 'Nombre preferido o apodo del usuario';
