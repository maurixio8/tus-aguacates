-- =====================================================
-- 📊 TABLA: recordatorios_enviados
-- =====================================================
-- Registra todos los recordatorios enviados para evitar spam
-- =====================================================

CREATE TABLE IF NOT EXISTS recordatorios_enviados (
    id SERIAL PRIMARY KEY,
    cliente_telefono VARCHAR(20) NOT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'carrito_abandonado',
    mensaje_enviado TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para consultas rápidas
    CONSTRAINT fk_cliente_telefono FOREIGN KEY (cliente_telefono) 
        REFERENCES clientes(telefono) ON DELETE CASCADE
);

-- Índice para buscar recordatorios recientes por teléfono y tipo
CREATE INDEX IF NOT EXISTS idx_recordatorios_telefono_tipo_fecha 
ON recordatorios_enviados (cliente_telefono, tipo, created_at DESC);

-- Índice para limpiar recordatorios antiguos
CREATE INDEX IF NOT EXISTS idx_recordatorios_created_at 
ON recordatorios_enviados (created_at);

-- Comentarios
COMMENT ON TABLE recordatorios_enviados IS 'Registro de recordatorios enviados a clientes para evitar spam';
COMMENT ON COLUMN recordatorios_enviados.tipo IS 'Tipo de recordatorio: carrito_abandonado, seguimiento_pedido, promocion';
COMMENT ON COLUMN recordatorios_enviados.metadata IS 'Datos adicionales en JSON: {total, horas_inactivo, etc}';

-- =====================================================
-- 🧹 JOB DE LIMPIEZA (opcional - ejecutar mensualmente)
-- =====================================================
-- DELETE FROM recordatorios_enviados WHERE created_at < NOW() - INTERVAL '30 days';
