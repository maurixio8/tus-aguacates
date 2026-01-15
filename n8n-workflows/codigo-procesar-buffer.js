// =====================================================
// ⏰ PROCESADOR DE BUFFER - Nodo Code Principal
// =====================================================
// Uso: Workflow con Schedule Trigger (cada 10 segundos)
// Este código va en un nodo Code después del Schedule Trigger
// =====================================================

// Este código genera la consulta SQL para obtener mensajes listos
// El resultado se usa en un nodo PostgreSQL para obtener los mensajes

const BUFFER_TIMEOUT_SECONDS = 30;
const MAX_MESSAGES_PER_CLIENT = 10;

// SQL para obtener clientes con mensajes listos para procesar
// (último mensaje fue hace > 30 segundos)
const sql = `
WITH ultimos_mensajes AS (
    -- Obtener el timestamp del último mensaje por cliente
    SELECT 
        cliente_telefono,
        MAX(timestamp) as ultimo_mensaje
    FROM mensaje_buffer
    WHERE procesado = false
    GROUP BY cliente_telefono
    HAVING MAX(timestamp) < NOW() - INTERVAL '${BUFFER_TIMEOUT_SECONDS} seconds'
),
mensajes_agrupados AS (
    -- Agrupar mensajes de esos clientes
    SELECT 
        mb.cliente_telefono,
        STRING_AGG(mb.mensaje, ' ' ORDER BY mb.timestamp) as mensaje_combinado,
        MIN(mb.timestamp) as primer_mensaje,
        MAX(mb.timestamp) as ultimo_mensaje,
        COUNT(*) as total_mensajes,
        ARRAY_AGG(mb.id ORDER BY mb.timestamp) as mensaje_ids
    FROM mensaje_buffer mb
    INNER JOIN ultimos_mensajes um ON mb.cliente_telefono = um.cliente_telefono
    WHERE mb.procesado = false
    GROUP BY mb.cliente_telefono
)
SELECT 
    cliente_telefono,
    mensaje_combinado,
    primer_mensaje,
    ultimo_mensaje,
    total_mensajes,
    mensaje_ids
FROM mensajes_agrupados
ORDER BY ultimo_mensaje ASC
LIMIT ${MAX_MESSAGES_PER_CLIENT};
`;

return [{
    json: {
        query: sql,
        bufferTimeoutSeconds: BUFFER_TIMEOUT_SECONDS,
        maxMessagesPerClient: MAX_MESSAGES_PER_CLIENT
    }
}];
