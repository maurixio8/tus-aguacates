-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  neighborhood VARCHAR(255),
  city VARCHAR(100) DEFAULT 'Bogotá',
  notes TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  last_order_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsqueda rápida por teléfono
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Crear índice para búsqueda por nombre (para autocompletado)
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- Crear índice para búsqueda de texto completo
CREATE INDEX IF NOT EXISTS idx_customers_search ON customers USING gin(to_tsvector('spanish', name || ' ' || COALESCE(phone, '') || ' ' || COALESCE(email, '')));

-- Habilitar RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones (ajustar según necesidades de seguridad)
CREATE POLICY "Allow all operations on customers" ON customers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Migrar clientes existentes desde la tabla orders (si existe)
INSERT INTO customers (name, phone, email, address, total_orders, total_spent, last_order_date, created_at)
SELECT
  customer_name,
  customer_phone,
  customer_email,
  delivery_address,
  COUNT(*) as total_orders,
  COALESCE(SUM(total_amount), 0) as total_spent,
  MAX(created_at) as last_order_date,
  MIN(created_at) as created_at
FROM orders
WHERE customer_phone IS NOT NULL AND customer_phone != ''
GROUP BY customer_name, customer_phone, customer_email, delivery_address
ON CONFLICT DO NOTHING;
