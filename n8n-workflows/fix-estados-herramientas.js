// Script para arreglar TOOL_CambiarEstadoCliente y agregar instrucciones de estados
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.5-admin-copiloto.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// 1. Arreglar la herramienta TOOL_CambiarEstadoCliente
const cambiarEstado = data.nodes.find(n => n.name === 'TOOL_CambiarEstadoCliente');
if (cambiarEstado) {
    cambiarEstado.parameters.toolDescription = "CAMBIAR ESTADO del cliente. OBLIGATORIO usarla en estos casos:\n" +
        "- Después de agregar productos: EN_PEDIDO\n" +
        "- Después de confirmar pedido: PEDIDO_CONFIRMADO\n" +
        "- Para pedidos de tienda online: PEDIDO_ONLINE\n" +
        "- Cuando escales conversación: ESCALADO\n" +
        "Estados válidos: NUEVO, ATENCION_LUZ, EN_PEDIDO, PEDIDO_CONFIRMADO, PEDIDO_ONLINE, ESCALADO";
    console.log('✅ TOOL_CambiarEstadoCliente actualizada con todos los estados');
}

// 2. Verificar TOOL_ConfirmarPedidoConEtiqueta
const confirmarPedido = data.nodes.find(n => n.name === 'TOOL_ConfirmarPedidoConEtiqueta');
if (!confirmarPedido) {
    console.log('❌ FALTA TOOL_ConfirmarPedidoConEtiqueta - la agregaré...');
    data.nodes.push({
        parameters: {
            descriptionType: "manual",
            toolDescription: "CONFIRMAR PEDIDO FINAL: USAR SIEMPRE después de enviar el resumen del pedido. Agrega etiqueta 'Confirmado' en YCloud.",
            jsCode: `// TOOL: Confirmar Pedido + Etiqueta YCloud
const telefono = $('1. Pre-procesamiento YCloud').first().json.from;

try {
  const updateResult = await this.helpers.httpRequest({
    method: 'POST',
    url: 'https://api.ycloud.com/v2/contacts',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': $credentials.YCloudApi.apiKey
    },
    body: {
      phoneNumber: telefono,
      tags: ['Confirmado']
    },
    json: true
  });
  
  return 'Cliente ' + telefono + ' etiquetado como Confirmado. AHORA USA TOOL_CambiarEstadoCliente con estado PEDIDO_CONFIRMADO.';
  
} catch (e) {
  return 'Error al etiquetar: ' + e.message;
}`,
            name: "confirmar_pedido_etiqueta"
        },
        id: "tool-confirmar-pedido-etiqueta",
        name: "TOOL_ConfirmarPedidoConEtiqueta",
        type: "@n8n/n8n-nodes-langchain.toolCode",
        typeVersion: 1.1,
        position: [-176, -480],
        credentials: {
            YCloudApi: {
                id: "9YuNWHvIcXFwYdOX",
                name: "YCloud account"
            }
        }
    });

    // Agregar conexión
    data.connections["TOOL_ConfirmarPedidoConEtiqueta"] = {
        ai_tool: [[{ node: "🤖 Agente Luz v4", type: "ai_tool", index: 0 }]]
    };
    console.log('✅ TOOL_ConfirmarPedidoConEtiqueta agregada');
} else {
    console.log('✅ TOOL_ConfirmarPedidoConEtiqueta ya existe');
}

// 3. Actualizar System Message con instrucciones claras de estados
const agentNode = data.nodes.find(n => n.name === '🤖 Agente Luz v4');
if (agentNode && agentNode.parameters && agentNode.parameters.options) {
    let msg = agentNode.parameters.options.systemMessage || '';

    // Agregar sección de gestión de estados
    const seccionEstados = `

---

## 🔄 GESTIÓN DE ESTADOS (MUY IMPORTANTE)

### SIEMPRE cambia el estado del cliente usando TOOL_CambiarEstadoCliente:

| Situación | Estado | Herramienta |
|-----------|--------|-------------|
| Agregaste productos al carrito | EN_PEDIDO | TOOL_CambiarEstadoCliente("EN_PEDIDO") |
| Cliente confirmó el pedido | PEDIDO_CONFIRMADO | TOOL_ConfirmarPedidoConEtiqueta + TOOL_CambiarEstadoCliente("PEDIDO_CONFIRMADO") |
| Pedido de tienda online | PEDIDO_ONLINE | TOOL_CambiarEstadoCliente("PEDIDO_ONLINE") |
| Escalaste a humano | ESCALADO | TOOL_CambiarEstadoCliente("ESCALADO") |

### 🚨 PROTOCOLO AL CONFIRMAR PEDIDO:
Cuando envíes el resumen del pedido y el cliente confirme:
1. **PRIMERO**: Usa TOOL_ConfirmarPedidoConEtiqueta (etiqueta en YCloud)
2. **DESPUÉS**: Usa TOOL_CambiarEstadoCliente("PEDIDO_CONFIRMADO")

### ⚠️ NUNCA olvides cambiar el estado:
- El estado permite hacer seguimiento de los clientes
- Sin cambio de estado, perdemos trazabilidad

`;

    // Insertar antes de las herramientas
    msg = msg.replace('## 🛠️ HERRAMIENTAS DISPONIBLES', seccionEstados + '## 🛠️ HERRAMIENTAS DISPONIBLES');

    agentNode.parameters.options.systemMessage = msg;
    console.log('✅ Instrucciones de gestión de estados agregadas al System Message');
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
