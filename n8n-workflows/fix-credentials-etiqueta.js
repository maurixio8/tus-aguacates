// Fix para TOOL_ConfirmarPedidoConEtiqueta - usar httpRequestWithAuthentication
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.5-admin-copiloto.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const toolEtiqueta = data.nodes.find(n => n.name === 'TOOL_ConfirmarPedidoConEtiqueta');

if (toolEtiqueta) {
    // Código corregido usando httpRequestWithAuthentication
    const codigoCorregido = `// TOOL: Confirmar Pedido + Etiqueta YCloud
const telefono = $('1. Pre-procesamiento YCloud').first().json.from;

try {
  // Usar httpRequestWithAuthentication en lugar de httpRequest + credentials manual
  const updateResult = await this.helpers.httpRequestWithAuthentication.call(this, 'YCloudApi', {
    method: 'POST',
    url: 'https://api.ycloud.com/v2/contacts',
    body: {
      phoneNumber: '+' + telefono,
      tags: ['Confirmado']
    },
    json: true
  });
  
  return 'Cliente ' + telefono + ' etiquetado como Confirmado en YCloud. Continúa con TOOL_CambiarEstadoCliente para cambiar el estado a PEDIDO_CONFIRMADO.';
  
} catch (e) {
  return 'Error al etiquetar: ' + e.message + '. Continúa con TOOL_CambiarEstadoCliente para cambiar estado a PEDIDO_CONFIRMADO.';
}`;

    toolEtiqueta.parameters.jsCode = codigoCorregido;
    console.log('✅ TOOL_ConfirmarPedidoConEtiqueta corregida:');
    console.log('   - Usa httpRequestWithAuthentication (forma correcta)');
    console.log('   - Agrega + al teléfono para formato internacional');
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
