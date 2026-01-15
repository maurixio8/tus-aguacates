// Script para agregar protocolo de pedidos online al System Message
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.4-variantes-completas.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// 1. Actualizar TOOL_CambiarEstadoCliente para incluir PEDIDO_ONLINE
const cambiarEstado = data.nodes.find(n => n.name === 'TOOL_CambiarEstadoCliente');
if (cambiarEstado) {
    cambiarEstado.parameters.toolDescription = "Cambiar el estado de conversación. Estados válidos: NUEVO, ATENCION_LUZ, EN_PEDIDO, PEDIDO_CONFIRMADO, PEDIDO_ONLINE, ESCALADO. Usar PEDIDO_CONFIRMADO para pedidos WhatsApp y PEDIDO_ONLINE para pedidos de la tienda online.";
    console.log('TOOL_CambiarEstadoCliente actualizado con PEDIDO_ONLINE!');
}

// 2. Agregar protocolo de pedidos online al System Message
const agentNode = data.nodes.find(n => n.name === '🤖 Agente Luz v4');
if (agentNode && agentNode.parameters && agentNode.parameters.options && agentNode.parameters.options.systemMessage) {

    const onlineSection = `

---

## 🛒 PEDIDOS DESDE TIENDA ONLINE

### ¿Cómo detectar?
Cuando el contexto tenga "esPedidoPlataforma: true" o el mensaje mencione:
- "acabo de hacer un pedido"
- "tus-aguacates.vercel.app"
- "Hice un pedido en la tienda"

### Protocolo para pedidos online:
1. **Saludar y agradecer**: "[Saludo del contexto] [Nombre]! Recibimos tu pedido desde nuestra tienda online."
2. **Confirmar datos**: "Tu pedido está siendo procesado."
3. **Informar entrega**: Usar la regla de Martes/Viernes
4. **Cambiar estado**: Usa TOOL_CambiarEstadoCliente("PEDIDO_ONLINE")
5. **Etiquetar**: Usa TOOL_ConfirmarPedidoConEtiqueta

### Ejemplo de respuesta para pedido online:
"[Saludo] [Nombre]! Gracias por tu pedido en tus-aguacates.vercel.app

Recibimos tu pedido correctamente. Tu entrega está programada para [Martes o Viernes según la regla].

Un asesor verificará la disponibilidad y te contactará si hay alguna novedad.

Para pagar:
→ Nequi o Daviplata: 320 306 2007

Cuando hagas el pago, envíanos el comprobante."

### IMPORTANTE:
- NO preguntes productos adicionales (ya completaron el pedido en la web)
- Solo confirma y da la información de entrega/pago
- Si mencionan cambios, ayuda a modificar
`;

    // Verificar si ya tiene la sección
    if (!agentNode.parameters.options.systemMessage.includes('PEDIDOS DESDE TIENDA ONLINE')) {
        agentNode.parameters.options.systemMessage += onlineSection;
        console.log('Protocolo de pedidos online agregado!');
    } else {
        console.log('Ya tiene la sección de pedidos online');
    }
}

// Guardar
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
