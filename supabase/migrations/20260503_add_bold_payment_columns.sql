-- Migración: Agregar columnas de pago Bold a guest_orders y orders
-- Creado: 2026-05-03 por Luz

-- ============================================
-- 1. guest_orders (pedidos de invitados)
-- ============================================

ALTER TABLE guest_orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE guest_orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pendiente';
ALTER TABLE guest_orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE guest_orders ADD COLUMN IF NOT EXISTS bold_transaction_id VARCHAR(255);
ALTER TABLE guest_orders ADD COLUMN IF NOT EXISTS bold_payment_method VARCHAR(100);
ALTER TABLE guest_orders ADD COLUMN IF NOT EXISTS card_last_four VARCHAR(4);
ALTER TABLE guest_orders ADD COLUMN IF NOT EXISTS card_brand VARCHAR(50);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_guest_orders_payment_status ON guest_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_guest_orders_paid_at ON guest_orders(paid_at);
CREATE INDEX IF NOT EXISTS idx_guest_orders_bold_transaction ON guest_orders(bold_transaction_id);

-- ============================================
-- 2. orders (pedidos de usuarios registrados)
-- ============================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bold_transaction_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bold_payment_method VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS card_last_four VARCHAR(4);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS card_brand VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Índices
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON orders(paid_at);
CREATE INDEX IF NOT EXISTS idx_orders_bold_transaction ON orders(bold_transaction_id);
