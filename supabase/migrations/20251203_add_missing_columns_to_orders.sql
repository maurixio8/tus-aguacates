-- Agregar columnas faltantes a la tabla orders para soportar pedidos desde el dashboard admin
-- Este migration agrega las columnas necesarias que están en guest_orders pero faltan en orders

-- Agregar columnas de información del cliente si no existen
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Agregar columnas de información del pedido si no existen
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_status VARCHAR(50) DEFAULT 'pendiente';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'manual';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';

-- Agregar columna para rastrear quién creó el pedido (para pedidos creados por admin)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

-- Agregar timestamps si no existen
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Comentarios para documentar las columnas
COMMENT ON COLUMN orders.customer_name IS 'Nombre completo del cliente';
COMMENT ON COLUMN orders.customer_phone IS 'Teléfono de contacto del cliente';
COMMENT ON COLUMN orders.customer_email IS 'Email del cliente';
COMMENT ON COLUMN orders.delivery_address IS 'Dirección de entrega completa';
COMMENT ON COLUMN orders.delivery_notes IS 'Notas adicionales para la entrega';
COMMENT ON COLUMN orders.order_status IS 'Estado del pedido: pendiente, en_proceso, completado, cancelado';
COMMENT ON COLUMN orders.payment_method IS 'Método de pago: manual, efectivo, tarjeta, transferencia';
COMMENT ON COLUMN orders.payment_status IS 'Estado del pago: pending, paid, failed';
COMMENT ON COLUMN orders.created_by IS 'ID del admin que creó el pedido (si aplica)';
