-- Añadir categoría "Ofertas y Combos" a la tabla de categorías
-- Esta categoría mostrará combos especiales y productos en oferta

INSERT INTO categories (slug, name, description, sort_order, is_active, image_url)
VALUES (
  'ofertas-combos',
  'Ofertas y Combos',
  'Combos especiales y ofertas del día - ¡Aprovecha los mejores precios!',
  2, -- Segunda posición, después de Aguacates
  true,
  '/categories/ofertas.jpg'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- Actualizar el sort_order de las demás categorías para hacer espacio
UPDATE categories SET sort_order = sort_order + 1 WHERE slug != 'aguacates' AND slug != 'ofertas-combos' AND sort_order >= 2;

-- Comentario: Para mover productos tipo "Combo" a esta categoría, ejecutar:
-- UPDATE products
-- SET category_id = (SELECT id FROM categories WHERE slug = 'ofertas-combos')
-- WHERE name ILIKE '%combo%' OR name ILIKE '%oferta%';
