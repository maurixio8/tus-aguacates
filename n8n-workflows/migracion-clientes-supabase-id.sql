-- =====================================================
-- Migración: Agregar columna supabase_id a tabla clientes
-- =====================================================
-- Ejecutar en PostgreSQL local (n8n_db)
-- =====================================================

-- 1. Agregar columna para vincular con Supabase
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS supabase_id UUID;

-- 2. Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_clientes_supabase_id ON clientes(supabase_id);

-- 3. Comentario descriptivo
COMMENT ON COLUMN clientes.supabase_id IS 'ID del cliente en Supabase (UUID) para sincronización';

-- =====================================================
-- VERIFICAR
-- =====================================================
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'clientes' AND column_name = 'supabase_id';
