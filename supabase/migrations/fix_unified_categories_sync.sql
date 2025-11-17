-- Sincronizar tabla de categorías con UnifiedCategories.tsx
-- Esto añade las categorías faltantes y corrige los slugs inconsistentes

TRUNCATE TABLE categories CASCADE;

INSERT INTO categories (slug, name, description, sort_order, is_active) VALUES
-- Categorías principales
('aguacates', 'Aguacates', 'Aguacates frescos de la mejor calidad', 1, true),
('frutas-tropicales', 'Frutas Tropicales', 'Frutas exóticas y tropicales', 2, true),
('frutos-rojos', 'Frutas Rojas', 'Deliciosas frutas rojas y bayas', 3, true),
('verduras', 'Verduras', 'Verduras frescas y orgánicas', 4, true),
('aromaticas', 'Aromáticas', 'Hierbas aromáticas frescas', 5, true),
('saludables', 'Saludables', 'Productos naturales y saludables', 6, true),
('especias', 'Especias', 'Especias y condimentos naturales', 7, true),
('combos', 'Combos', 'Combos especiales y paquetes', 8, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;
