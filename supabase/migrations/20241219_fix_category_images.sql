-- ====================================================
-- MIGRACIÓN: Actualizar image_url de categorías
-- ====================================================
-- Fecha: 2024-12-19
-- Propósito: Vincular las categorías con las imágenes locales existentes
--            en /public/categories/
-- ====================================================

-- Actualizar image_url para cada categoría con su imagen local correspondiente
UPDATE categories SET
  image_url = '/categories/aguacates.jpg',
  updated_at = NOW()
WHERE slug = 'aguacates';

UPDATE categories SET
  image_url = '/categories/tropicales.jpg',
  updated_at = NOW()
WHERE slug = 'frutas-tropicales';

UPDATE categories SET
  image_url = '/categories/frutos-rojos.jpg',
  updated_at = NOW()
WHERE slug = 'frutos-rojos';

UPDATE categories SET
  image_url = '/categories/aromaticas.jpg',
  updated_at = NOW()
WHERE slug = 'aromaticas';

UPDATE categories SET
  image_url = '/categories/saludables.jpg',
  updated_at = NOW()
WHERE slug = 'saludables';

UPDATE categories SET
  image_url = '/categories/especias.jpg',
  updated_at = NOW()
WHERE slug = 'especias';

UPDATE categories SET
  image_url = '/categories/desgranados.jpg',
  updated_at = NOW()
WHERE slug = 'desgranados';

UPDATE categories SET
  image_url = '/categories/gourmet.jpg',
  updated_at = NOW()
WHERE slug = 'gourmet';

-- Para "Ofertas y Combos" usamos gourmet.jpg temporalmente
-- hasta que se suba una imagen específica
UPDATE categories SET
  image_url = '/categories/gourmet.jpg',
  updated_at = NOW()
WHERE slug = 'ofertas-combos';

-- Para "Productos Nuevos" usamos gourmet.jpg temporalmente
UPDATE categories SET
  image_url = '/categories/gourmet.jpg',
  updated_at = NOW()
WHERE slug = 'productos-nuevos';

-- Comentario
COMMENT ON TABLE categories IS 'Categorías actualizadas con image_url vinculadas a /public/categories/';
