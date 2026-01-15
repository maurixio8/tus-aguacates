// Script para arreglar el formato de retorno del toolCode
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.4-variantes-completas.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Encontrar el nodo toolCode
const toolNode = data.nodes.find(n => n.name === 'TOOL_ConfirmarPedidoConEtiqueta');
if (toolNode && toolNode.parameters) {
    // El toolCode de n8n LangChain DEBE retornar un STRING, no un objeto
    toolNode.parameters.jsCode = `// TOOL: Confirmar Pedido + Etiqueta YCloud
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
}`;

    console.log('jsCode actualizado con retorno STRING!');
}

// Guardar
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
