// Fix para manejo de pedidos web y reactions
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.5-admin-copiloto.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// 1. Actualizar "4. Merge Datos + Productos" para manejar cuando no hay cliente
const mergeNode = data.nodes.find(n => n.name === '4. Merge Datos + Productos');
if (mergeNode) {
    const nuevoJsCode = `// Combinar datos del cliente y resultados de búsqueda
// v5: Manejo robusto de clientes y pedidos web

const preproceso = $('1. Pre-procesamiento YCloud').first().json;

// Obtener cliente con manejo de errores
let cliente = {};
try {
  cliente = $('2. Obtener Cliente').first().json || {};
} catch (e) {
  // Si no existe el cliente, crear uno vacío
  cliente = { id: null, telefono: preproceso.from, nombre: preproceso.customerName || 'Cliente' };
}

// Obtener productos de búsqueda
let productosEncontrados = [];
try {
  const busquedaItems = $('3. Búsqueda Automática Productos').all();
  productosEncontrados = busquedaItems
    .map(item => item.json)
    .filter(p => p && p.id && p.name && typeof p.price !== 'undefined');
} catch (e) {
  productosEncontrados = [];
}

// Formatear productos de forma SIMPLE
let productosTexto = '';
if (productosEncontrados.length > 0) {
  const lineas = [];
  productosEncontrados.forEach(p => {
    if (p.variantes && Array.isArray(p.variantes) && p.variantes.length > 0) {
      p.variantes.forEach(v => {
        lineas.push(\`• \${p.name} - \${v.presentacion} $\${Number(v.precio).toLocaleString('es-CO')} [ID:\${p.id}]\`);
      });
    } else {
      lineas.push(\`• \${p.name} - $\${Number(p.price).toLocaleString('es-CO')} [ID:\${p.id}]\`);
    }
  });
  productosTexto = [...new Set(lineas)].join('\\n');
} else if (preproceso.debeHacerBusqueda && preproceso.terminoBusqueda) {
  productosTexto = \`❌ No se encontraron productos para: "\${preproceso.terminoBusqueda}"\`;
} else {
  productosTexto = '(No se realizó búsqueda)';
}

// Contexto de tiempo
const now = new Date();
const dayOfWeek = now.getDay();
const hour = now.getHours();
const pasoCutoff = hour >= 10;

let diasHastaEntrega, mensajeEntrega;
switch(dayOfWeek) {
  case 0: diasHastaEntrega = 2; mensajeEntrega = "Próxima entrega: Martes"; break;
  case 1: diasHastaEntrega = 1; mensajeEntrega = "Próxima entrega: Martes"; break;
  case 2: 
    if (pasoCutoff) { diasHastaEntrega = 3; mensajeEntrega = "Próxima entrega: Viernes"; }
    else { diasHastaEntrega = 0; mensajeEntrega = "¡Entrega HOY antes 10AM!"; }
    break;
  case 3: diasHastaEntrega = 2; mensajeEntrega = "Próxima entrega: Viernes"; break;
  case 4: diasHastaEntrega = 1; mensajeEntrega = "Próxima entrega: Viernes"; break;
  case 5:
    if (pasoCutoff) { diasHastaEntrega = 4; mensajeEntrega = "Próxima entrega: Martes"; }
    else { diasHastaEntrega = 0; mensajeEntrega = "¡Entrega HOY antes 10AM!"; }
    break;
  case 6: diasHastaEntrega = 3; mensajeEntrega = "Próxima entrega: Martes"; break;
  default: diasHastaEntrega = 1; mensajeEntrega = "Próxima entrega: Martes o Viernes";
}

const fechaEntrega = new Date(now);
fechaEntrega.setDate(now.getDate() + diasHastaEntrega);
const proximaEntrega = fechaEntrega.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
const fechaActual = now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const horaActual = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });

return {
  json: {
    clienteId: cliente.id || null,
    clienteTelefono: cliente.telefono || preproceso.from,
    clienteNombre: cliente.nombre || preproceso.customerName || 'Cliente',
    clienteEstado: cliente.estado_conversacion || 'NUEVO',
    clienteDireccion: cliente.direccion || '',
    clienteCarrito: cliente.pre_pedido || [],
    clienteTotalPedidos: cliente.total_pedidos || 0,
    
    mensajeCliente: preproceso.messageText,
    terminoBusqueda: preproceso.terminoBusqueda || '',
    esIntentoBusqueda: preproceso.esIntentoBusqueda || false,
    esPedidoPlataforma: preproceso.esPedidoPlataforma || false,
    infoPedidoPlataforma: preproceso.infoPedidoPlataforma || null,
    
    productosEncontrados,
    productosTexto,
    
    from: preproceso.from,
    to: preproceso.to,
    saludo: preproceso.saludo,
    
    fechaActual, horaActual, horaNumero: hour, diaNumero: dayOfWeek,
    pasoCutoff, proximaEntrega, mensajeEntrega, diasHastaEntrega
  }
};`;

    mergeNode.parameters.jsCode = nuevoJsCode;
    console.log('✅ "4. Merge Datos + Productos" actualizado con manejo robusto');
}

// 2. Arreglar TOOL_ConsultarEstadoPedido para usar tabla correcta (orders de Supabase)
const toolEstadoPedido = data.nodes.find(n => n.name === 'TOOL_ConsultarEstadoPedido');
if (toolEstadoPedido) {
    // Usar tabla 'orders' que es la de Supabase (tienda online)
    toolEstadoPedido.parameters.query = `SELECT 
  id,
  COALESCE(order_number, LEFT(id::text, 8)) as numero_pedido,
  status as estado,
  payment_status as estado_pago,
  total_amount as total,
  created_at as fecha_pedido,
  delivery_date as fecha_entrega,
  CASE 
    WHEN status = 'pending' THEN '⏳ Pedido pendiente de confirmación'
    WHEN status = 'confirmed' THEN '✅ Pedido confirmado, en preparación'
    WHEN status = 'en_camino' THEN '🚚 Tu pedido está en camino'
    WHEN status = 'entregado' THEN '📦 Pedido entregado'
    WHEN status = 'cancelado' THEN '❌ Pedido cancelado'
    ELSE '📋 Estado: ' || status
  END as mensaje_estado
FROM orders 
WHERE guest_phone LIKE '%' || RIGHT('{{ $('1. Pre-procesamiento YCloud').first().json.from }}', 10) || '%'
ORDER BY created_at DESC 
LIMIT 1;`;

    toolEstadoPedido.parameters.toolDescription = "Consultar el estado del pedido más reciente. Usarla cuando el cliente pregunte: ¿cuándo llega mi pedido? ¿cómo va mi pedido?";

    console.log('✅ TOOL_ConsultarEstadoPedido corregido para usar tabla orders');
}

// 3. Agregar instrucciones para pedidos web al System Message
const agentNode = data.nodes.find(n => n.name === '🤖 Agente Luz v4');
if (agentNode && agentNode.parameters && agentNode.parameters.options) {
    let msg = agentNode.parameters.options.systemMessage || '';

    // Verificar si ya tiene instrucciones de pedidos web
    if (!msg.includes('PEDIDOS DESDE TIENDA ONLINE')) {
        const instruccionesWeb = `

## 🛒 PEDIDOS DESDE TIENDA ONLINE (MUY IMPORTANTE)

### ¿Cómo detectar?
Si el mensaje contiene:
- "tus-aguacates.vercel.app"
- "Mi pedido:" con lista de productos
- "Total:" con precio
- "Me llamo" y "Dirección"

### Tu respuesta para pedidos web:
\`\`\`
¡[Saludo] [Nombre]! 😊🥑

¡Gracias por tu pedido en nuestra tienda online!

📦 Recibimos tu pedido correctamente:
[CONFIRMAR productos y total que mencionó]

📍 Dirección de entrega:
[Confirmar la dirección que dio]
¿Es correcta esta dirección?

🚚 Tu pedido llegará el [Martes o Viernes según regla].

💳 Para pagar:
Nequi/Daviplata: 320 306 2007

Cuando hagas el pago, envíanos el comprobante 🙌
\`\`\`

### Acciones después:
1. Usa TOOL_GuardarDireccionCliente si dio dirección nueva
2. Usa TOOL_CambiarEstadoCliente("PEDIDO_ONLINE")
3. Usa TOOL_ConfirmarPedidoConEtiqueta

`;
        msg = msg.replace('## 🎯 IDENTIDAD', instruccionesWeb + '## 🎯 IDENTIDAD');
        agentNode.parameters.options.systemMessage = msg;
        console.log('✅ Instrucciones para pedidos web agregadas');
    }
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('\n✅ Archivo guardado: agente-luz-v6.5-admin-copiloto.json');
