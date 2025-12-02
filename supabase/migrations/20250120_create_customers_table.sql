-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  addresses JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(phone)
);

-- Agregar índices para búsquedas rápidas
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_email ON customers(email);

-- Agregar columna customer_id a guest_orders para vincular pedidos con clientes
ALTER TABLE guest_orders
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- Crear índice para búsquedas por cliente
CREATE INDEX IF NOT EXISTS idx_guest_orders_customer_id ON guest_orders(customer_id);

-- Agregar trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

-- Habilitar RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para customers
CREATE POLICY "Admin can view all customers"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND is_active = true
    )
  );

CREATE POLICY "Admin can insert customers"
  ON customers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND is_active = true
    )
  );

CREATE POLICY "Admin can update customers"
  ON customers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND is_active = true
    )
  );

CREATE POLICY "Admin can delete customers"
  ON customers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND is_active = true
    )
  );

-- Comentarios para documentación
COMMENT ON TABLE customers IS 'Tabla de clientes registrados para pedidos recurrentes';
COMMENT ON COLUMN customers.addresses IS 'Array JSON de direcciones del cliente [{address: string, label: string, isDefault: boolean}]';
COMMENT ON COLUMN customers.notes IS 'Notas adicionales sobre el cliente (preferencias, alergias, etc.)';
