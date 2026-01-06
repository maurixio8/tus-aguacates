-- =====================================================
-- Agregar columna para tracking de notificaciones
-- =====================================================
-- Ejecutar en tu base de datos PostgreSQL

ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS notificado_escalado BOOLEAN DEFAULT false;

-- Crear índice para optimizar la búsqueda
CREATE INDEX IF NOT EXISTS idx_clientes_escalado_notificado 
ON clientes(estado_conversacion, notificado_escalado) 
WHERE estado_conversacion = 'ESCALADO';

-- Reset el flag cuando el estado cambia de ESCALADO
-- (Esto es un trigger opcional)
CREATE OR REPLACE FUNCTION reset_notificado_escalado()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado_conversacion = 'ESCALADO' AND NEW.estado_conversacion != 'ESCALADO' THEN
        NEW.notificado_escalado := false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reset_notificado ON clientes;
CREATE TRIGGER trigger_reset_notificado
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION reset_notificado_escalado();
