-- ===========================================================
-- TOOL_EscalarServicioCliente - QUERY SIMPLIFICADA
-- ===========================================================
-- 
-- ERROR ANTERIOR: column "notas" does not exist
-- SOLUCIÓN: Simplificar query sin usar columna "notas"
--
-- ===========================================================

-- Solo actualiza el estado a ESCALADO
UPDATE clientes 
SET 
    estado_conversacion = 'ESCALADO'
WHERE telefono = '{{ $('1. Pre-procesamiento YCloud').item.json.from }}'
RETURNING 
    nombre,
    telefono,
    estado_conversacion,
    'Conversación escalada. Motivo: ' || $1 as mensaje_confirmacion;

-- ===========================================================
-- CONFIGURACIÓN EN N8N:
-- 1. Operation: Execute Query
-- 2. Query: (copiar el código arriba sin comentarios)
-- 3. Options > Query Parameters:
--    ={{ $fromAI('motivo_escalado','Motivo del escalado','string','Cliente solicita ayuda') }}
-- ===========================================================
