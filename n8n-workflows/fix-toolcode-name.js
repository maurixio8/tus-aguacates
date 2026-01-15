// Script para arreglar el campo name del toolCode
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.4-variantes-completas.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Encontrar el nodo toolCode
const toolNode = data.nodes.find(n => n.name === 'TOOL_ConfirmarPedidoConEtiqueta');
if (toolNode) {
    // Agregar el campo name requerido por toolCode (solo alfanumérico)
    toolNode.parameters.name = "confirmar_pedido_etiqueta";
    console.log('Campo name agregado al toolCode!');
    console.log('Name:', toolNode.parameters.name);
}

// Guardar
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
