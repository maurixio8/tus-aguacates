-- ============================================================================
-- Create subscriptions table for recurring orders
-- Purpose: Enable automatic recurring orders every 15 days
-- ============================================================================

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- Nombre descriptivo de la suscripción
  frequency_days INTEGER DEFAULT 15 CHECK (frequency_days > 0), -- Días entre entregas (por defecto 15)
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  
  -- Fechas importantes
  next_delivery_date DATE NOT NULL, -- Próxima fecha de entrega
  last_delivery_date DATE, -- Última fecha de entrega
  start_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Fecha de inicio
  end_date DATE, -- Fecha de fin (opcional, para suscripciones temporales)
  
  -- Dirección de entrega
  address_id UUID NOT NULL REFERENCES addresses(id),
  shipping_address_snapshot JSONB, -- Snapshot de la dirección al momento de crear la suscripción
  
  -- Método de pago
  payment_method VARCHAR(50) NOT NULL DEFAULT 'daviplata' CHECK (payment_method IN ('daviplata', 'efectivo')),
  
  -- Productos y preferencias
  fixed_products JSONB NOT NULL DEFAULT '[]', -- Productos fijos que siempre se incluyen
  optional_products JSONB NOT NULL DEFAULT '[]', -- Productos opcionales que el cliente puede modificar
  product_preferences JSONB NOT NULL DEFAULT '{}', -- Preferencias específicas de productos
  
  -- Configuración de precios
  base_total DECIMAL(10, 2) NOT NULL, -- Total base de productos fijos
  shipping_fee DECIMAL(10, 2) DEFAULT 0, -- Tarifa de envío
  estimated_total DECIMAL(10, 2) NOT NULL, -- Total estimado
  
  -- Control de entregas
  total_deliveries INTEGER DEFAULT 0, -- Total de entregas realizadas
  successful_deliveries INTEGER DEFAULT 0, -- Entregas exitosas
  failed_deliveries INTEGER DEFAULT 0, -- Entregas fallidas
  
  -- Configuración de notificaciones
  notification_days_before INTEGER DEFAULT 2, -- Días antes para notificar
  email_notifications BOOLEAN DEFAULT true,
  whatsapp_notifications BOOLEAN DEFAULT true,
  
  -- Campos de auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Campos adicionales
  notes TEXT, -- Notas adicionales del cliente
  tags JSONB DEFAULT '[]', -- Etiquetas para categorización
  metadata JSONB DEFAULT '{}' -- Metadatos adicionales
);

-- Create subscription_deliveries table to track each delivery
CREATE TABLE IF NOT EXISTS subscription_deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL, -- Pedido generado
  
  -- Información de la entrega
  delivery_date DATE NOT NULL,
  scheduled_date DATE NOT NULL, -- Fecha programada original
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Productos y precios
  products_snapshot JSONB NOT NULL, -- Snapshot de productos al momento de la entrega
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_fee DECIMAL(10, 2) DEFAULT 0,
  
  -- Procesamiento
  processed_at TIMESTAMP WITH TIME ZONE,
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Notificaciones
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Campos de auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Información de error
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE
);

-- Create subscription_modifications table to track changes
CREATE TABLE IF NOT EXISTS subscription_modifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  
  -- Información del cambio
  modification_type VARCHAR(50) NOT NULL CHECK (modification_type IN ('products', 'address', 'payment', 'frequency', 'pause', 'resume', 'cancel')),
  old_values JSONB,
  new_values JSONB,
  
  -- Auditoría
  modified_by UUID REFERENCES profiles(id), -- Usuario que hizo el modificación (null si es automático)
  modified_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  reason TEXT -- Razón del cambio
);

-- Índices para subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_delivery ON subscriptions(next_delivery_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_subscriptions_frequency ON subscriptions(frequency_days);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions(created_at);

-- Índices para subscription_deliveries
CREATE INDEX IF NOT EXISTS idx_subscription_deliveries_subscription_id ON subscription_deliveries(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_deliveries_status ON subscription_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_subscription_deliveries_delivery_date ON subscription_deliveries(delivery_date);
CREATE INDEX IF NOT EXISTS idx_subscription_deliveries_order_id ON subscription_deliveries(order_id);

-- Índices para subscription_modifications
CREATE INDEX IF NOT EXISTS idx_subscription_modifications_subscription_id ON subscription_modifications(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_modifications_type ON subscription_modifications(modification_type);
CREATE INDEX IF NOT EXISTS idx_subscription_modifications_modified_at ON subscription_modifications(modified_at);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_deliveries_updated_at BEFORE UPDATE ON subscription_deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular próxima fecha de entrega
CREATE OR REPLACE FUNCTION calculate_next_delivery_date(
  current_date DATE,
  frequency_days INTEGER
) RETURNS DATE AS $$
BEGIN
  RETURN current_date + (frequency_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Función para crear entrega automática
CREATE OR REPLACE FUNCTION create_subscription_delivery()
RETURNS TRIGGER AS $$
DECLARE
  delivery_record RECORD;
BEGIN
  -- Solo crear entrega si la suscripción está activa
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    INSERT INTO subscription_deliveries (
      subscription_id,
      delivery_date,
      scheduled_date,
      products_snapshot,
      total_amount,
      shipping_fee
    ) VALUES (
      NEW.id,
      NEW.next_delivery_date,
      NEW.next_delivery_date,
      NEW.fixed_products,
      NEW.estimated_total,
      NEW.shipping_fee
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear entrega cuando se activa una suscripción
CREATE TRIGGER create_delivery_on_activation
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION create_subscription_delivery();

-- Habilitar RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_modifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para subscriptions
CREATE POLICY "Los usuarios pueden ver sus propias suscripciones"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propias suscripciones"
  ON subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias suscripciones"
  ON subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propias suscripciones"
  ON subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins pueden ver todas las suscripciones
CREATE POLICY "Admins pueden ver todas las suscripciones"
  ON subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins pueden gestionar todas las suscripciones"
  ON subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Políticas RLS para subscription_deliveries
CREATE POLICY "Los usuarios pueden ver sus propias entregas"
  ON subscription_deliveries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.id = subscription_deliveries.subscription_id
      AND subscriptions.user_id = auth.uid()
    )
  );

-- Admins pueden ver todas las entregas
CREATE POLICY "Admins pueden ver todas las entregas"
  ON subscription_deliveries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Políticas RLS para subscription_modifications
CREATE POLICY "Los usuarios pueden ver sus propias modificaciones"
  ON subscription_modifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.id = subscription_modifications.subscription_id
      AND subscriptions.user_id = auth.uid()
    )
  );

-- Admins pueden ver todas las modificaciones
CREATE POLICY "Admins pueden ver todas las modificaciones"
  ON subscription_modifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Comentarios para documentación
COMMENT ON TABLE subscriptions IS 'Suscripciones de pedidos recurrentes automáticos';
COMMENT ON COLUMN subscriptions.name IS 'Nombre descriptivo que el cliente da a su suscripción';
COMMENT ON COLUMN subscriptions.frequency_days IS 'Frecuencia en días entre entregas (por defecto 15 días)';
COMMENT ON COLUMN subscriptions.status IS 'Estado: active, paused, cancelled, expired';
COMMENT ON COLUMN subscriptions.next_delivery_date IS 'Próxima fecha programada para entrega';
COMMENT ON COLUMN subscriptions.fixed_products IS 'Productos fijos que se incluyen en cada entrega';
COMMENT ON COLUMN subscriptions.optional_products IS 'Productos opcionales que el cliente puede modificar';
COMMENT ON COLUMN subscriptions.notification_days_before IS 'Días antes de la entrega para enviar notificación';

COMMENT ON TABLE subscription_deliveries IS 'Registro de cada entrega generada por una suscripción';
COMMENT ON TABLE subscription_modifications IS 'Historial de modificaciones a las suscripciones';

-- Mensaje de éxito
SELECT 'Tabla de suscripciones creada exitosamente' as status;