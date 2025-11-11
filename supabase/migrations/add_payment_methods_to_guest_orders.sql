-- Agregar campos de métodos de pago y WhatsApp a guest_orders
ALTER TABLE guest_orders
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'daviplata',
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pendiente',
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS whatsapp_message TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_sent BOOLEAN DEFAULT FALSE;

-- Crear índices para los nuevos campos
CREATE INDEX IF NOT EXISTS idx_guest_orders_payment_method ON guest_orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_guest_orders_payment_status ON guest_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_guest_orders_paid_at ON guest_orders(paid_at);
CREATE INDEX IF NOT EXISTS idx_guest_orders_whatsapp_sent ON guest_orders(whatsapp_sent);

-- Comentarios para documentación
COMMENT ON COLUMN guest_orders.payment_method IS 'Método de pago seleccionado: daviplata, efectivo, tarjeta';
COMMENT ON COLUMN guest_orders.payment_status IS 'Estado del pago: pendiente, pagado, fallido, pendiente_pago';
COMMENT ON COLUMN guest_orders.paid_at IS 'Fecha y hora cuando se realizó el pago';
COMMENT ON COLUMN guest_orders.whatsapp_message IS 'Mensaje de WhatsApp enviado para confirmación del pedido';
COMMENT ON COLUMN guest_orders.whatsapp_sent IS 'Indica si se ha enviado la notificación por WhatsApp';