-- Crear tabla para pedidos de invitados (guest orders)
CREATE TABLE IF NOT EXISTS guest_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(50) NOT NULL,
  guest_address TEXT NOT NULL,
  order_data JSONB NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pendiente',
  delivery_date DATE,
  delivery_time VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para guest_orders
CREATE INDEX IF NOT EXISTS idx_guest_orders_status ON guest_orders(status);
CREATE INDEX IF NOT EXISTS idx_guest_orders_email ON guest_orders(guest_email);
CREATE INDEX IF NOT EXISTS idx_guest_orders_created_at ON guest_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_guest_orders_delivery_date ON guest_orders(delivery_date);

-- RLS para guest_orders
ALTER TABLE guest_orders ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede crear pedidos (invitados + autenticados)
CREATE POLICY "Cualquiera puede crear pedidos"
  ON guest_orders
  FOR INSERT
  WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));

-- Solo usuarios autenticados pueden ver todos los pedidos (admin)
CREATE POLICY "Usuarios autenticados pueden ver todos los pedidos"
  ON guest_orders
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

-- Solo usuarios autenticados pueden actualizar pedidos
CREATE POLICY "Usuarios autenticados pueden actualizar pedidos"
  ON guest_orders
  FOR UPDATE
  USING (auth.role() IN ('authenticated', 'service_role'));

-- Agregar campo para indicar si se creó cuenta desde pedido invitado
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_from_guest BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_order_id UUID;

-- Actualizar tabla de categorías para usar las 8 categorías simplificadas
TRUNCATE TABLE categories CASCADE;

INSERT INTO categories (slug, name, description, sort_order, is_active) VALUES
('frutas', 'Frutas', 'Frutas frescas y tropicales', 1, true),
('verduras', 'Verduras', 'Verduras y vegetales frescos', 2, true),
('aguacates', 'Aguacates', 'Aguacates Hass en diferentes presentaciones', 3, true),
('especias', 'Especias', 'Condimentos, chiles y especias', 4, true),
('hierbas-aromaticas', 'Hierbas Aromáticas', 'Hierbas frescas aromáticas', 5, true),
('combos', 'Combos', 'Combos y ofertas especiales', 6, true),
('jugos', 'Jugos', 'Zumos y bebidas naturales', 7, true),
('otros', 'Otros', 'Productos gourmet y especiales', 8, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;
