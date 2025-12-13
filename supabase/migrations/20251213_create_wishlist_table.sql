-- Crear tabla wishlist para almacenar productos favoritos de usuarios
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Evitar duplicados: un usuario no puede tener el mismo producto dos veces en favoritos
  UNIQUE(user_id, product_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_created_at ON wishlist(created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver solo sus propios favoritos
CREATE POLICY "Users can view their own wishlist"
  ON wishlist
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden agregar productos a sus propios favoritos
CREATE POLICY "Users can add to their own wishlist"
  ON wishlist
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar productos de sus propios favoritos
CREATE POLICY "Users can delete from their own wishlist"
  ON wishlist
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comentarios para documentación
COMMENT ON TABLE wishlist IS 'Almacena los productos favoritos de cada usuario';
COMMENT ON COLUMN wishlist.id IS 'ID único del elemento en wishlist';
COMMENT ON COLUMN wishlist.user_id IS 'ID del usuario propietario del wishlist';
COMMENT ON COLUMN wishlist.product_id IS 'ID del producto en favoritos';
COMMENT ON COLUMN wishlist.created_at IS 'Fecha y hora en que se agregó el producto a favoritos';
