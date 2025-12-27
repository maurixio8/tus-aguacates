-- Migration: Función y trigger para resetear límites diarios del Chef Virtual
-- Fecha: 2024-12-23

-- Función para resetear automáticamente los contadores diarios
CREATE OR REPLACE FUNCTION reset_daily_recipe_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- Resetear el contador si es un nuevo día
  UPDATE user_recipe_limits
  SET recipes_generated_today = 0,
      last_reset = CURRENT_DATE
  WHERE user_id = NEW.user_id
    AND last_reset < CURRENT_DATE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentario: Esta función se puede llamar manualmente o se puede integrar
-- en el flujo de generación de recetas para resetear automáticamente

-- Crear un índice para optimizar consultas de recetas por usuario y fecha
CREATE INDEX IF NOT EXISTS idx_generated_recipes_user_favorites
ON generated_recipes(user_id, is_favorited, created_at DESC);

-- Crear índice para optimizar consultas de recetas recientes
CREATE INDEX IF NOT EXISTS idx_generated_recipes_user_created
ON generated_recipes(user_id, created_at DESC);

-- Crear índice para optimizar cleanup de recetas antiguas
CREATE INDEX IF NOT EXISTS idx_generated_recipes_cleanup
ON generated_recipes(created_at, is_favorited);
