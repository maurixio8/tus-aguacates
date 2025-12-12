-- Crear tabla para direcciones de usuarios
CREATE TABLE IF NOT EXISTS addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL, -- "Casa", "Trabajo", "Oficina", etc.
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  street_address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) DEFAULT 'Cundinamarca',
  postal_code VARCHAR(20),
  additional_info TEXT, -- Referencias, instrucciones de entrega, etc.
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para addresses
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON addresses(user_id, is_default);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para asegurar que solo haya una dirección por defecto por usuario
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Desmarcar todas las otras direcciones del mismo usuario
    UPDATE addresses
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para mantener solo una dirección por defecto
CREATE TRIGGER ensure_single_default_address_trigger
  BEFORE INSERT OR UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION ensure_single_default_address();

-- RLS para addresses
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propias direcciones
CREATE POLICY "Los usuarios pueden ver sus propias direcciones"
  ON addresses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden insertar sus propias direcciones
CREATE POLICY "Los usuarios pueden crear sus propias direcciones"
  ON addresses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propias direcciones
CREATE POLICY "Los usuarios pueden actualizar sus propias direcciones"
  ON addresses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propias direcciones
CREATE POLICY "Los usuarios pueden eliminar sus propias direcciones"
  ON addresses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins pueden ver todas las direcciones
CREATE POLICY "Admins pueden ver todas las direcciones"
  ON addresses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Agregar columnas a la tabla orders para referencias de dirección
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES addresses(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB; -- Snapshot de la dirección al momento de la orden

-- Comentarios para documentación
COMMENT ON TABLE addresses IS 'Direcciones guardadas de usuarios para checkout rápido';
COMMENT ON COLUMN addresses.label IS 'Etiqueta descriptiva: Casa, Trabajo, etc.';
COMMENT ON COLUMN addresses.is_default IS 'Solo una dirección puede ser por defecto por usuario';
COMMENT ON COLUMN addresses.additional_info IS 'Referencias, instrucciones de entrega, notas especiales';
