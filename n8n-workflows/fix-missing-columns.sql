-- =====================================================
-- 🛠️ CORRECCIÓN DE BASE DE DATOS
-- Ejecuta este script en tu nodo PostgreSQL en n8n
-- (Operación: Execute Query)
-- =====================================================

-- 1. Agregar columna 'ciudad' si no existe
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS ciudad VARCHAR(50) DEFAULT 'Bogotá';

-- 2. Agregar columna 'supabase_id' si no existe (parece que la consulta la usa)
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS supabase_id UUID;

-- 3. Crear índice para supabase_id para sincronización rápida
CREATE INDEX IF NOT EXISTS idx_clientes_supabase_id ON clientes(supabase_id);

-- 4. Verificar otras columnas usadas en la sincronización
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS email VARCHAR(100),
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS total_pedidos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_gastado DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

-- 5. Actualizar updated_at automáticamente (por si acaso no está el trigger)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

SELECT 'Base de datos corregida exitosamente' as resultado;
