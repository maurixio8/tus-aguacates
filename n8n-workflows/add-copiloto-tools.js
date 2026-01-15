// Script para agregar herramientas de admin al Copiloto
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\Copiloto-Operaciones-v2-YCloud.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Nuevas herramientas a agregar
const nuevasHerramientas = [
    {
        parameters: {
            descriptionType: "manual",
            toolDescription: "CAMBIAR ESTADO de conversación de un cliente. Estados válidos: NUEVO, ATENCION_LUZ, EN_PEDIDO, PEDIDO_CONFIRMADO, PEDIDO_ONLINE, ESCALADO. Requiere teléfono y nuevo estado.",
            operation: "executeQuery",
            query: "UPDATE clientes SET estado_conversacion = $1 WHERE REPLACE(REPLACE(REPLACE(telefono, '+', ''), ' ', ''), '-', '') LIKE '%' || $2 || '%' RETURNING telefono, nombre, estado_conversacion, 'Estado cambiado exitosamente' as status;",
            options: {
                queryReplacement: "={{ $fromAI('nuevo_estado','Estado válido: NUEVO, ATENCION_LUZ, EN_PEDIDO, PEDIDO_CONFIRMADO, PEDIDO_ONLINE, ESCALADO','string','NUEVO') }}\n{{ $fromAI('telefono','Teléfono del cliente','string') || $('2. Extractor Inteligente').item.json.telefono_objetivo }}"
            }
        },
        id: "tool-cambiar-estado-cliente",
        name: "TOOL_ADMIN_CambiarEstadoCliente",
        type: "n8n-nodes-base.postgresTool",
        typeVersion: 2.6,
        position: [400, 960],
        credentials: {
            postgres: {
                id: "R6hc0vEZJhKQSi3G",
                name: "Mi PostgreSQL Docker"
            }
        }
    },
    {
        parameters: {
            descriptionType: "manual",
            toolDescription: "BORRAR MEMORIA de conversación de un cliente. Elimina el historial de chat con el agente. Requiere teléfono del cliente.",
            operation: "executeQuery",
            query: "DELETE FROM n8n_chat_histories WHERE session_id = $1 OR session_id LIKE '%' || $1 || '%' RETURNING session_id, 'Memoria borrada exitosamente' as status;",
            options: {
                queryReplacement: "={{ $fromAI('telefono','Teléfono del cliente para borrar memoria','string') || $('2. Extractor Inteligente').item.json.telefono_objetivo }}"
            }
        },
        id: "tool-borrar-memoria-cliente",
        name: "TOOL_ADMIN_BorrarMemoriaCliente",
        type: "n8n-nodes-base.postgresTool",
        typeVersion: 2.6,
        position: [600, 960],
        credentials: {
            postgres: {
                id: "R6hc0vEZJhKQSi3G",
                name: "Mi PostgreSQL Docker"
            }
        }
    },
    {
        parameters: {
            descriptionType: "manual",
            toolDescription: "LIMPIAR CARRITO de un cliente. Vacía el pre_pedido del cliente. Requiere teléfono.",
            operation: "executeQuery",
            query: "UPDATE clientes SET pre_pedido = '[]'::jsonb WHERE REPLACE(REPLACE(REPLACE(telefono, '+', ''), ' ', ''), '-', '') LIKE '%' || $1 || '%' RETURNING telefono, nombre, pre_pedido, 'Carrito limpiado exitosamente' as status;",
            options: {
                queryReplacement: "={{ $fromAI('telefono','Teléfono del cliente para limpiar carrito','string') || $('2. Extractor Inteligente').item.json.telefono_objetivo }}"
            }
        },
        id: "tool-limpiar-carrito-cliente",
        name: "TOOL_ADMIN_LimpiarCarritoCliente",
        type: "n8n-nodes-base.postgresTool",
        typeVersion: 2.6,
        position: [800, 960],
        credentials: {
            postgres: {
                id: "R6hc0vEZJhKQSi3G",
                name: "Mi PostgreSQL Docker"
            }
        }
    }
];

// Agregar las herramientas al array de nodos
for (const tool of nuevasHerramientas) {
    const existe = data.nodes.find(n => n.name === tool.name);
    if (!existe) {
        data.nodes.push(tool);
        console.log(`Agregada herramienta: ${tool.name}`);
    } else {
        console.log(`Ya existe: ${tool.name}`);
    }
}

// Agregar conexiones para las nuevas herramientas
const nuevasConexiones = {
    "TOOL_ADMIN_CambiarEstadoCliente": {
        ai_tool: [[{ node: "🤖 Agente Copiloto", type: "ai_tool", index: 0 }]]
    },
    "TOOL_ADMIN_BorrarMemoriaCliente": {
        ai_tool: [[{ node: "🤖 Agente Copiloto", type: "ai_tool", index: 0 }]]
    },
    "TOOL_ADMIN_LimpiarCarritoCliente": {
        ai_tool: [[{ node: "🤖 Agente Copiloto", type: "ai_tool", index: 0 }]]
    }
};

Object.assign(data.connections, nuevasConexiones);
console.log('Conexiones agregadas!');

// Actualizar el System Message del Copiloto para incluir las nuevas herramientas
const agentNode = data.nodes.find(n => n.name === '🤖 Agente Copiloto');
if (agentNode && agentNode.parameters && agentNode.parameters.options) {
    let msg = agentNode.parameters.options.systemMessage || '';

    // Agregar las nuevas herramientas a la lista
    if (!msg.includes('TOOL_ADMIN_CambiarEstadoCliente')) {
        const nuevasHerramientasTexto = `
### NUEVAS HERRAMIENTAS DE ADMIN:
- \`TOOL_ADMIN_CambiarEstadoCliente\`: Cambia estado (NUEVO, EN_PEDIDO, PEDIDO_CONFIRMADO, PEDIDO_ONLINE, ESCALADO)
- \`TOOL_ADMIN_BorrarMemoriaCliente\`: Borra historial de conversación de un cliente
- \`TOOL_ADMIN_LimpiarCarritoCliente\`: Vacía el carrito de un cliente

**Ejemplos:**
- "Pon el cliente 3203062007 en estado NUEVO" → TOOL_ADMIN_CambiarEstadoCliente('NUEVO', '3203062007')
- "Borra la memoria del 3203062007" → TOOL_ADMIN_BorrarMemoriaCliente('3203062007')
- "Limpia el carrito del 3203062007" → TOOL_ADMIN_LimpiarCarritoCliente('3203062007')
`;
        msg = msg.replace('### GESTIÓN DE CLIENTES:', nuevasHerramientasTexto + '\n### GESTIÓN DE CLIENTES:');
        agentNode.parameters.options.systemMessage = msg;
        console.log('System Message del Copiloto actualizado!');
    }
}

// Guardar
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
