// Script para agregar credenciales al toolCode y actualizar System Message
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.4-variantes-completas.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// 1. Agregar credenciales al nodo TOOL_ConfirmarPedidoConEtiqueta
const toolNode = data.nodes.find(n => n.name === 'TOOL_ConfirmarPedidoConEtiqueta');
if (toolNode) {
    toolNode.credentials = {
        "YCloudApi": {
            "id": "9YuNWHvIcXFwYdOX",
            "name": "YCloud account"
        }
    };
    console.log('Credenciales agregadas al toolCode!');
}

// 2. Encontrar el nodo del agente y actualizar el System Message
const agentNode = data.nodes.find(n => n.name === '🤖 Agente Luz v4');
if (agentNode && agentNode.parameters && agentNode.parameters.options && agentNode.parameters.options.systemMessage) {
    // Agregar sección de confirmación de pedido al final
    const newSection = `

---

## 🎯 CONFIRMACIÓN DE PEDIDO (IMPORTANTE)

### Después de enviar el resumen del pedido:
1. **Usa TOOL_CambiarEstadoCliente** con estado = "PEDIDO_CONFIRMADO"
2. **Usa TOOL_ConfirmarPedidoConEtiqueta** para etiquetar al cliente en YCloud

### Disclaimer OBLIGATORIO al final del resumen:
Incluye esto al final de cada resumen de pedido:

"Este es un PRE-PEDIDO sujeto a verificación de disponibilidad.
Un asesor verificará tu pedido y te confirmará por WhatsApp.
Si hay alguna novedad, te contactaremos."

### Herramientas de Confirmación:
- **TOOL_ConfirmarPedidoConEtiqueta**: Agrega etiqueta "Confirmado" en YCloud
- **TOOL_CambiarEstadoCliente("PEDIDO_CONFIRMADO")**: Cambia el estado del cliente
`;

    // Verificar si ya tiene la sección
    if (!agentNode.parameters.options.systemMessage.includes('CONFIRMACIÓN DE PEDIDO')) {
        agentNode.parameters.options.systemMessage += newSection;
        console.log('System Message actualizado!');
    } else {
        console.log('System Message ya tiene la sección de confirmación');
    }
}

// Guardar
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
