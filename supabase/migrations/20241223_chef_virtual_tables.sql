-- Crear tabla de recetas generadas por el Chef Virtual
CREATE TABLE IF NOT EXISTS generated_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ingredients TEXT NOT NULL, -- JSON array de ingredientes
  recipe_data JSONB NOT NULL, -- Receta completa generada por la IA
  is_favorited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS generated_recipes_user_id_idx ON generated_recipes(user_id);
CREATE INDEX IF NOT EXISTS generated_recipes_created_at_idx ON generated_recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS generated_recipes_is_favorited_idx ON generated_recipes(user_id, is_favorited);

-- Tabla de límites de recetas diarias por usuario
CREATE TABLE IF NOT EXISTS user_recipe_limits (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  recipes_generated_today INTEGER DEFAULT 0,
  last_reset DATE DEFAULT CURRENT_DATE
);

-- Tabla de suscripción del Chef Virtual
CREATE TABLE IF NOT EXISTS user_chef_subscription (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'premium')),
  recipes_limit INTEGER DEFAULT 2,
  can_save BOOLEAN DEFAULT false,
  saved_recipes_limit INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para suscripciones
CREATE INDEX IF NOT EXISTS user_chef_subscription_tier_idx ON user_chef_subscription(tier);

-- Trigger para updated_at en suscripciones
CREATE OR REPLACE FUNCTION update_chef_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chef_subscription_updated_at
  BEFORE UPDATE ON user_chef_subscription
  FOR EACH ROW
  EXECUTE FUNCTION update_chef_subscription_updated_at();

-- RLS Policies
ALTER TABLE generated_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recipe_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_chef_subscription ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden ver sus propias recetas generadas
CREATE POLICY "Users can view own generated recipes"
  ON generated_recipes FOR SELECT
  USING (user_id = auth.uid());

-- Política: Usuarios pueden insertar sus propias recetas generadas
CREATE POLICY "Users can insert own generated recipes"
  ON generated_recipes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Política: Usuarios pueden actualizar sus propias recetas (favorito)
CREATE POLICY "Users can update own generated recipes"
  ON generated_recipes FOR UPDATE
  USING (user_id = auth.uid());

-- Política: Usuarios pueden eliminar sus propias recetas
CREATE POLICY "Users can delete own generated recipes"
  ON generated_recipes FOR DELETE
  USING (user_id = auth.uid());

-- Política: Usuarios pueden ver sus propios límites
CREATE POLICY "Users can view own recipe limits"
  ON user_recipe_limits FOR SELECT
  USING (user_id = auth.uid());

-- Política: Todos pueden insertar límites (para nuevos usuarios)
CREATE POLICY "Users can insert own recipe limits"
  ON user_recipe_limits FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Política: Usuarios pueden ver sus propias suscripciones
CREATE POLICY "Users can view own chef subscription"
  ON user_chef_subscription FOR SELECT
  USING (user_id = auth.uid());

-- Política: Todos pueden insertar suscripción (para nuevos usuarios)
CREATE POLICY "Users can insert own chef subscription"
  ON user_chef_subscription FOR INSERT
  WITH CHECK (user_id = auth.uid());
