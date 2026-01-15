// Script para agregar herramientas de admin al Copiloto dentro del Agente Luz
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.4-variantes-completas.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Nuevas herramientas de admin para el Copiloto
const nuevasHerramientas = [
    {
        parameters: {
            descriptionType: "manual",
            toolDescription: "ADMIN: Cambiar ESTADO de conversación de un cliente. Estados válidos: NUEVO, ATENCION_LUZ, EN_PEDIDO, PEDIDO_CONFIRMADO, PEDIDO_ONLINE, ESCALADO. Ejemplo: 'Pon el 3161932558 en NUEVO'",
            operation: "executeQuery",
            query: "UPDATE clientes SET estado_conversacion = $1 WHERE REPLACE(REPLACE(REPLACE(telefono, '+', ''), ' ', ''), '-', '') LIKE '%' || $2 || '%' RETURNING telefono, nombre, estado_conversacion, 'Estado cambiado exitosamente' as status;",
            options: {
                queryReplacement: "={{ $fromAI('nuevo_estado','Estado: NUEVO, ATENCION_LUZ, EN_PEDIDO, PEDIDO_CONFIRMADO, PEDIDO_ONLINE, ESCALADO','string','NUEVO') }}\n{{ $fromAI('telefono','telefono del cliente','string') || $('1. Pre-procesamiento YCloud').first().json.telefono_objetivo }}"
            }
        },
        id: "tool-admin-cambiar-estado",
        name: "TOOL_ADMIN_CambiarEstadoCliente",
        type: "n8n-nodes-base.postgresTool",
        typeVersion: 2.6,
        position: [-400, -480],
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
            toolDescription: "ADMIN: Borrar MEMORIA/historial de conversación de un cliente. Elimina el historial de chat. Ejemplo: 'Borra la memoria del 3161932558'",
            operation: "executeQuery",
            query: "DELETE FROM n8n_chat_histories WHERE session_id = $1 OR session_id LIKE '%' || $1 || '%' RETURNING 'Memoria eliminada para: ' || $1 as resultado;",
            options: {
                queryReplacement: "={{ $fromAI('telefono','telefono del cliente para borrar memoria','string') || $('1. Pre-procesamiento YCloud').first().json.telefono_objetivo }}"
            }
        },
        id: "tool-admin-borrar-memoria",
        name: "TOOL_ADMIN_BorrarMemoriaCliente",
        type: "n8n-nodes-base.postgresTool",
        typeVersion: 2.6,
        position: [-300, -480],
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
            toolDescription: "ADMIN: Limpiar/vaciar el CARRITO de un cliente. Ejemplo: 'Vacía el carrito del 3161932558'",
            operation: "executeQuery",
            query: "UPDATE clientes SET pre_pedido = '[]'::jsonb WHERE REPLACE(REPLACE(REPLACE(telefono, '+', ''), ' ', ''), '-', '') LIKE '%' || $1 || '%' RETURNING telefono, nombre, 'Carrito vaciado exitosamente' as status;",
            options: {
                queryReplacement: "={{ $fromAI('telefono','telefono del cliente para limpiar carrito','string') || $('1. Pre-procesamiento YCloud').first().json.telefono_objetivo }}"
            }
        },
        id: "tool-admin-limpiar-carrito",
        name: "TOOL_ADMIN_LimpiarCarritoCliente",
        type: "n8n-nodes-base.postgresTool",
        typeVersion: 2.6,
        position: [-200, -480],
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

// Agregar conexiones para las nuevas herramientas al agente principal
// Necesitamos conectar cada herramienta al Agente Luz v4
const conexionesNuevas = {
    "TOOL_ADMIN_CambiarEstadoCliente": {
        ai_tool: [[{ node: "🤖 Agente Luz v4", type: "ai_tool", index: 0 }]]
    },
    "TOOL_ADMIN_BorrarMemoriaCliente": {
        ai_tool: [[{ node: "🤖 Agente Luz v4", type: "ai_tool", index: 0 }]]
    },
    "TOOL_ADMIN_LimpiarCarritoCliente": {
        ai_tool: [[{ node: "🤖 Agente Luz v4", type: "ai_tool", index: 0 }]]
    }
};

Object.assign(data.connections, conexionesNuevas);
console.log('Conexiones agregadas!');

// Guardar
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
