-- ===========================================================
-- HERRAMIENTA: TOOL_ConsultarEstadoPedido
-- Propósito: Consultar estado de pedido del cliente
-- ===========================================================
-- 
-- Configuración en n8n:
-- Tipo de nodo: Postgres Tool
-- Nombre: TOOL_ConsultarEstadoPedido
-- 
-- Tool Description:
-- "Consultar el estado del pedido más reciente del cliente.
-- Úsala cuando el cliente pregunte: ¿cuándo llega mi pedido?, 
-- ¿ya enviaron?, estado de mi pedido."
--
-- NO requiere input - usa el teléfono del contexto
-- ===========================================================

SELECT 
    id,
    COALESCE(order_number, LEFT(id::text, 8)) as numero_pedido,
    status as estado,
    payment_status as estado_pago,
    total_amount as total,
    created_at as fecha_pedido,
    delivery_date as fecha_entrega,
    CASE 
        WHEN status = 'pendiente' THEN '⏳ Pedido pendiente de confirmación'
        WHEN status = 'confirmado' THEN '✅ Pedido confirmado, en preparación'
        WHEN status = 'en_camino' THEN '🚚 Tu pedido está en camino'
        WHEN status = 'entregado' THEN '📦 Pedido entregado'
        WHEN status = 'cancelado' THEN '❌ Pedido cancelado'
        ELSE '📋 Estado: ' || status
    END as mensaje_estado
FROM guest_orders
WHERE 
    guest_phone = '{{ $('1. Pre-procesamiento YCloud').item.json.from }}'
    OR guest_phone LIKE '%' || RIGHT('{{ $('1. Pre-procesamiento YCloud').item.json.from }}', 10) || '%'
ORDER BY created_at DESC
LIMIT 1;
