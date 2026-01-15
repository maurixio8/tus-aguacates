// Script para arreglar el TOOL_AnadirAlCarrito en el workflow v6.5
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.5-admin-copiloto.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Buscar el nodo TOOL_AnadirAlCarrito
const toolNode = data.nodes.find(n => n.name === 'TOOL_AnadirAlCarrito');

if (toolNode) {
    console.log('Encontrado TOOL_AnadirAlCarrito');

    // Simplificar el query - usar solo 4 parámetros sin variantes
    toolNode.parameters.query = `UPDATE clientes 
SET pre_pedido = COALESCE(pre_pedido, '[]'::jsonb) || 
  jsonb_build_object(
    'producto_id', $1::int,
    'producto_nombre', $2,
    'precio', $3::numeric,
    'cantidad', COALESCE($4::int, 1)
  ),
  estado_conversacion = 'EN_PEDIDO'
WHERE telefono = '{{ $('1. Pre-procesamiento YCloud').first().json.from }}'
RETURNING pre_pedido;`;

    toolNode.parameters.options.queryReplacement = `={{ $fromAI('producto_id','ID del producto a agregar','number',0) }}
{{ $fromAI('producto_nombre','Nombre del producto','string','Producto') }}
{{ $fromAI('precio','Precio del producto','number',0) }}
{{ $fromAI('cantidad','Cantidad a agregar','number',1) }}`;

    toolNode.parameters.toolDescription = "Agregar producto al carrito. REQUIERE: producto_id (ID numérico), producto_nombre, precio y cantidad.";

    console.log('Query actualizado a versión simplificada (4 parámetros)');
} else {
    console.log('No se encontró TOOL_AnadirAlCarrito');
}

// Guardar
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
