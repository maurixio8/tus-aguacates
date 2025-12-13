-- Primero, eliminar la tabla wishlist si existe para recrearla correctamente
DROP TABLE IF EXISTS wishlist CASCADE;

-- Crear tabla wishlist con foreign key correcta
CREATE TABLE wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Evitar duplicados
  UNIQUE(user_id, product_id)
);

-- Crear índices para rendimiento
CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX idx_wishlist_product_id ON wishlist(product_id);
CREATE INDEX idx_wishlist_created_at ON wishlist(created_at DESC);

-- Habilitar RLS
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own wishlist"
  ON wishlist
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own wishlist"
  ON wishlist
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own wishlist"
  ON wishlist
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comentarios
COMMENT ON TABLE wishlist IS 'Almacena los productos favoritos de cada usuario';
COMMENT ON COLUMN wishlist.id IS 'ID único del elemento en wishlist';
COMMENT ON COLUMN wishlist.user_id IS 'ID del usuario propietario del wishlist';
COMMENT ON COLUMN wishlist.product_id IS 'ID del producto en favoritos (puede ser UUID o slug)';
COMMENT ON COLUMN wishlist.created_at IS 'Fecha y hora en que se agregó el producto a favoritos';
