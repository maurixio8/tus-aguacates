-- Crear tabla de categorías de recetas
CREATE TABLE IF NOT EXISTS recipe_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT 'bg-gray-500',
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS recipe_categories_slug_idx ON recipe_categories(slug);
CREATE INDEX IF NOT EXISTS recipe_categories_active_idx ON recipe_categories(is_active, sort_order);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_recipe_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipe_categories_updated_at
  BEFORE UPDATE ON recipe_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_categories_updated_at();

-- RLS Policies
ALTER TABLE recipe_categories ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer categorías activas
CREATE POLICY "Active recipe categories are viewable by everyone"
  ON recipe_categories FOR SELECT
  USING (is_active = true);

-- Política: Todos pueden leer categorías específicas por slug
CREATE POLICY "Recipe categories are viewable by slug"
  ON recipe_categories FOR SELECT
  USING (is_active = true);

-- Insertar categorías iniciales con sus emojis
INSERT INTO recipe_categories (slug, name, description, icon, color, sort_order) VALUES
  ('con-aguacate', 'Con Aguacate', 'Recetas donde el aguacate es el protagonista', '🥑', 'bg-green-500', 0),
  ('desayunos', 'Desayunos', 'Empieza el día con energía', '🍳', 'bg-yellow-500', 1),
  ('smoothies', 'Smoothies', 'Bebidas nutritivas y refrescantes', '🥤', 'bg-pink-500', 2),
  ('ensaladas', 'Ensaladas', 'Frescas, saludables y deliciosas', '🥗', 'bg-emerald-500', 3),
  ('platos-principales', 'Platos Principales', 'Comidas completas y nutritivas', '🍽️', 'bg-orange-500', 4),
  ('snacks', 'Snacks', 'Meriendas rápidas y saludables', '🥨', 'bg-purple-500', 5),
  ('postres', 'Postres', 'Dulces saludables', '🍨', 'bg-rose-500', 6)
ON CONFLICT (slug) DO NOTHING;
