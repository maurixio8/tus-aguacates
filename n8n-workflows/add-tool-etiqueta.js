// Script para agregar TOOL_ConfirmarPedidoConEtiqueta al workflow v6.5
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.5-admin-copiloto.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Verificar si ya existe
const existe = data.nodes.find(n => n.name === 'TOOL_ConfirmarPedidoConEtiqueta');

if (!existe) {
    // Agregar la herramienta
    const nuevaTool = {
        parameters: {
            descriptionType: "manual",
            toolDescription: "CONFIRMAR PEDIDO FINAL: Usar DESPUÉS de enviar el resumen del pedido. Cambia estado a PEDIDO_CONFIRMADO y agrega etiqueta 'Confirmado' en YCloud.",
            jsCode: `// TOOL: Confirmar Pedido + Etiqueta YCloud
const telefono = $('1. Pre-procesamiento YCloud').first().json.from;

try {
  // Llamar a YCloud para agregar etiqueta
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
  
  // IMPORTANTE: toolCode DEBE retornar un STRING
  return 'Cliente ' + telefono + ' etiquetado como Confirmado en YCloud. Ahora usa TOOL_CambiarEstadoCliente con PEDIDO_CONFIRMADO.';
  
} catch (e) {
  return 'Error al etiquetar en YCloud: ' + e.message + '. Continúa con TOOL_CambiarEstadoCliente.';
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
    };

    data.nodes.push(nuevaTool);
    console.log('✅ Agregada TOOL_ConfirmarPedidoConEtiqueta');

    // Agregar conexión al agente
    data.connections["TOOL_ConfirmarPedidoConEtiqueta"] = {
        ai_tool: [[{ node: "🤖 Agente Luz v4", type: "ai_tool", index: 0 }]]
    };
    console.log('✅ Conexión agregada al Agente Luz v4');

} else {
    console.log('⏭️  TOOL_ConfirmarPedidoConEtiqueta ya existe');
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
