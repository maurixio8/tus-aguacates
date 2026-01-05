-- =====================================================
-- Migración: Agregar columnas faltantes a tabla clientes
-- =====================================================
-- La tabla actual no tiene: email, total_gastado, activo
-- Ejecutar en PostgreSQL local (n8n_db)
-- =====================================================

-- 1. Agregar columna email
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS email VARCHAR(100);

-- 2. Agregar columna total_gastado (si existe total_pedidos pero no total_gastado)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS total_gastado DECIMAL(12,2) DEFAULT 0;

-- 3. Agregar columna activo
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

-- 4. Verificar estructura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'clientes'
ORDER BY ordinal_position;
