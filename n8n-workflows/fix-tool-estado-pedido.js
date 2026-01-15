// Fix para TOOL_ConsultarEstadoPedido - usar tabla clientes en lugar de orders
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.5-admin-copiloto.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const toolEstadoPedido = data.nodes.find(n => n.name === 'TOOL_ConsultarEstadoPedido');

if (toolEstadoPedido) {
    // Opción: Consultar datos del cliente en lugar de tabla orders
    // La tabla 'clientes' SÍ existe en el PostgreSQL local
    toolEstadoPedido.parameters.query = `SELECT 
  c.nombre,
  c.telefono,
  c.estado_conversacion as estado,
  c.direccion,
  c.pre_pedido as carrito,
  c.updated_at as ultima_actualizacion,
  CASE 
    WHEN c.estado_conversacion = 'PEDIDO_CONFIRMADO' THEN '✅ Tu pedido fue confirmado. Te contactaremos para coordinar la entrega.'
    WHEN c.estado_conversacion = 'PEDIDO_ONLINE' THEN '🛒 Tu pedido de la tienda online está siendo procesado.'
    WHEN c.estado_conversacion = 'EN_PEDIDO' THEN '📦 Tienes un pedido en proceso. ¿Deseas confirmarlo?'
    WHEN c.estado_conversacion = 'ESCALADO' THEN '👤 Un asesor te contactará pronto.'
    ELSE '💬 No encontré pedidos recientes. ¿Quieres hacer uno nuevo?'
  END as mensaje_estado
FROM clientes c
WHERE c.telefono LIKE '%' || RIGHT('{{ $('1. Pre-procesamiento YCloud').first().json.from }}', 10) || '%'
LIMIT 1;`;

    toolEstadoPedido.parameters.toolDescription = "Consultar el estado del cliente y su último pedido. Usarla cuando el cliente pregunte: ¿cómo va mi pedido? ¿tengo pedidos?";

    console.log('✅ TOOL_ConsultarEstadoPedido corregido para usar tabla clientes');
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
