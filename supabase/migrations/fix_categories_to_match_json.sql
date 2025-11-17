-- Corrección: Sincronizar categorías con las 8 reales del JSON
-- Remove verduras and combos, add desgranados and gourmet

TRUNCATE TABLE categories CASCADE;

INSERT INTO categories (slug, name, description, sort_order, is_active) VALUES
-- Categorías que existen en el JSON de productos
('aguacates', 'Aguacates', 'Aguacates frescos de la mejor calidad', 1, true),
('frutas-tropicales', 'Frutas Tropicales', 'Frutas exóticas y tropicales', 2, true),
('frutos-rojos', 'Frutas Rojas', 'Deliciosas frutas rojas y bayas', 3, true),
('aromaticas', 'Aromáticas', 'Hierbas aromáticas frescas', 4, true),
('saludables', 'Saludables', 'Productos naturales y saludables', 5, true),
('especias', 'Especias', 'Especias y condimentos naturales', 6, true),
('desgranados', 'Desgranados', 'Productos desgranados frescos', 7, true),
('gourmet', 'Gourmet', 'Productos gourmet premium', 8, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;
