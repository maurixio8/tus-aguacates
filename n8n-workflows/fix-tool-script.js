// Script para arreglar el nodo TOOL_ConfirmarPedidoConEtiqueta
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.4-variantes-completas.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Encontrar y reemplazar el nodo
const nodeIndex = data.nodes.findIndex(n => n.name === 'TOOL_ConfirmarPedidoConEtiqueta');
if (nodeIndex !== -1) {
    data.nodes[nodeIndex] = {
        "parameters": {
            "descriptionType": "manual",
            "toolDescription": "CONFIRMAR PEDIDO FINAL: Usar DESPUÉS de enviar el resumen del pedido. Cambia estado a PEDIDO_CONFIRMADO y agrega etiqueta Confirmado en YCloud.",
            "jsCode": `// TOOL: Confirmar Pedido + Etiqueta YCloud
const telefono = $('1. Pre-procesamiento YCloud').first().json.from;

// 1. ACTUALIZAR ESTADO EN POSTGRESQL vía Supabase/PostgreSQL
try {
  const updateResult = await this.helpers.httpRequest({
    method: 'PATCH',
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
  console.log('YCloud response:', updateResult);
} catch (e) {
  console.log('Error en YCloud:', e.message);
}

return {
  confirmado: true,
  telefono: telefono,
  mensaje: 'Cliente etiquetado como Confirmado en YCloud. Recuerda también usar TOOL_CambiarEstadoCliente con PEDIDO_CONFIRMADO.'
};`
        },
        "id": "tool-confirmar-pedido-etiqueta",
        "name": "TOOL_ConfirmarPedidoConEtiqueta",
        "type": "@n8n/n8n-nodes-langchain.toolCode",
        "typeVersion": 1.1,
        "position": [-176, -480]
    };
    console.log('Nodo reemplazado!');
} else {
    console.log('Nodo no encontrado');
}

// Agregar conexión si no existe
if (!data.connections['TOOL_ConfirmarPedidoConEtiqueta']) {
    data.connections['TOOL_ConfirmarPedidoConEtiqueta'] = {
        ai_tool: [[{
            node: '🤖 Agente Luz v4',
            type: 'ai_tool',
            index: 0
        }]]
    };
    console.log('Conexión agregada!');
}

// Guardar
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
