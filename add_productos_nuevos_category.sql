
-- Agregar categoría 'PRODUCTOS NUEVOS' a la base de datos
INSERT INTO categories (
  id, 
  name, 
  slug, 
  description, 
  image_url, 
  is_active, 
  sort_order,
  created_at,
  updated_at
) VALUES (
  'cat-9',
  'Productos Nuevos',
  'productos-nuevos',
  'Últimos productos agregados a nuestra tienda',
  '/categories/productos-nuevos.jpg',
  true,
  9,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

