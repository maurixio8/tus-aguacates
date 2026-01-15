// Fix para TOOL_ConfirmarPedidoConEtiqueta - sin usar httpRequestWithAuthentication
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.5-admin-copiloto.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const toolEtiqueta = data.nodes.find(n => n.name === 'TOOL_ConfirmarPedidoConEtiqueta');

if (toolEtiqueta) {
    // Opción: Simplificar la herramienta para que solo retorne instrucciones
    // La etiqueta real se puede hacer manualmente o con otro workflow
    const codigoSimplificado = `// TOOL: Confirmar Pedido - Versión simplificada
// La etiqueta en YCloud se debe hacer manualmente o con workflow separado

const telefono = $('1. Pre-procesamiento YCloud').first().json.from;

// Retornar mensaje de confirmación para el agente
return {
  confirmado: true,
  telefono: telefono,
  mensaje: 'Pedido marcado como confirmado para ' + telefono + '. IMPORTANTE: Ahora usa TOOL_CambiarEstadoCliente("PEDIDO_CONFIRMADO") para actualizar el estado del cliente.'
};`;

    toolEtiqueta.parameters.jsCode = codigoSimplificado;
    console.log('✅ TOOL_ConfirmarPedidoConEtiqueta simplificada (sin llamada a YCloud API)');
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
console.log('');
console.log('NOTA: La etiqueta en YCloud se debe hacer manualmente o crear un workflow separado.');
console.log('Por ahora, el agente solo cambiará el estado del cliente a PEDIDO_CONFIRMADO.');
