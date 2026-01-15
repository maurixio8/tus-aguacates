-- =====================================================
-- 🔧 AGREGAR ESTADO PEDIDO_CONFIRMADO AL CONSTRAINT
-- =====================================================
-- Ejecutar en PostgreSQL local
-- Fecha: 2026-01-12
-- =====================================================

-- Eliminar constraint viejo
ALTER TABLE clientes 
DROP CONSTRAINT IF EXISTS chk_estado_conversacion;

-- Agregar constraint con TODOS los estados (incluido PEDIDO_CONFIRMADO)
ALTER TABLE clientes
ADD CONSTRAINT chk_estado_conversacion 
CHECK (estado_conversacion IN (
    'NUEVO',
    'ATENCION_LUZ',
    'EN_PEDIDO',
    'CONFIRMANDO',
    'PAGANDO',
    'COMPLETADO',
    'ESCALADO',
    'PEDIDO_ONLINE',
    'PEDIDO_CONFIRMADO'
));

-- Verificar
SELECT 'Constraint actualizado correctamente' as resultado;
