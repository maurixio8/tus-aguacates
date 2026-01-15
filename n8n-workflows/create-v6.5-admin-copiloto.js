// Script para agregar herramientas de admin al workflow v6.1 que SÍ tiene el Copiloto
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\🥑 Agente Luz v6.1 - Búsqueda Mejorada.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Archivo cargado. Nodos totales:', data.nodes.length);

// Nuevas herramientas de admin para el Copiloto
const nuevasHerramientas = [
    {
        parameters: {
            descriptionType: "manual",
            toolDescription: "ADMIN: Cambiar ESTADO de conversación de un cliente. Estados válidos: NUEVO, ATENCION_LUZ, EN_PEDIDO, PEDIDO_CONFIRMADO, PEDIDO_ONLINE, ESCALADO. Ejemplo: 'Pon el 3161932558 en NUEVO'",
            operation: "executeQuery",
            query: "UPDATE clientes SET estado_conversacion = $1 WHERE REPLACE(REPLACE(REPLACE(telefono, '+', ''), ' ', ''), '-', '') LIKE '%' || $2 || '%' RETURNING telefono, nombre, estado_conversacion, 'Estado cambiado' as status;",
            options: {
                queryReplacement: "={{ $fromAI('nuevo_estado','Estado: NUEVO, ATENCION_LUZ, EN_PEDIDO, PEDIDO_CONFIRMADO, PEDIDO_ONLINE, ESCALADO','string','NUEVO') }}\n{{ $fromAI('telefono','Telefono del cliente','string') }}"
            }
        },
        id: "tool-admin-cambiar-estado-copiloto",
        name: "TOOL_ADMIN_CambiarEstadoCliente",
        type: "n8n-nodes-base.postgresTool",
        typeVersion: 2.6,
        position: [-800, 240],
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
            query: "DELETE FROM n8n_chat_histories WHERE session_id LIKE '%' || $1 || '%' RETURNING 'Memoria eliminada para sesion con: ' || $1 as resultado;",
            options: {
                queryReplacement: "={{ $fromAI('telefono','Telefono del cliente para borrar memoria','string') }}"
            }
        },
        id: "tool-admin-borrar-memoria-copiloto",
        name: "TOOL_ADMIN_BorrarMemoriaCliente",
        type: "n8n-nodes-base.postgresTool",
        typeVersion: 2.6,
        position: [-600, 240],
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
            query: "UPDATE clientes SET pre_pedido = '[]'::jsonb WHERE REPLACE(REPLACE(REPLACE(telefono, '+', ''), ' ', ''), '-', '') LIKE '%' || $1 || '%' RETURNING telefono, nombre, 'Carrito vaciado' as status;",
            options: {
                queryReplacement: "={{ $fromAI('telefono','Telefono del cliente para limpiar carrito','string') }}"
            }
        },
        id: "tool-admin-limpiar-carrito-copiloto",
        name: "TOOL_ADMIN_LimpiarCarritoCliente",
        type: "n8n-nodes-base.postgresTool",
        typeVersion: 2.6,
        position: [-400, 240],
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
        console.log(`✅ Agregada: ${tool.name}`);
    } else {
        console.log(`⏭️  Ya existe: ${tool.name}`);
    }
}

// Encontrar el nombre exacto del nodo Copiloto
const copilotoNode = data.nodes.find(n => n.name && n.name.includes('Agente Copiloto'));
if (copilotoNode) {
    console.log(`\n🎯 Encontrado Copiloto: "${copilotoNode.name}"`);

    // Agregar conexiones para las nuevas herramientas al Copiloto
    const conexionesNuevas = {
        "TOOL_ADMIN_CambiarEstadoCliente": {
            ai_tool: [[{ node: copilotoNode.name, type: "ai_tool", index: 0 }]]
        },
        "TOOL_ADMIN_BorrarMemoriaCliente": {
            ai_tool: [[{ node: copilotoNode.name, type: "ai_tool", index: 0 }]]
        },
        "TOOL_ADMIN_LimpiarCarritoCliente": {
            ai_tool: [[{ node: copilotoNode.name, type: "ai_tool", index: 0 }]]
        }
    };

    Object.assign(data.connections, conexionesNuevas);
    console.log('✅ Conexiones agregadas al Copiloto!');
} else {
    console.log('❌ No se encontró nodo Copiloto');
}

// Renombrar el workflow
data.name = "🥑 Agente Luz v6.5 - Con Herramientas Admin Copiloto";

// Guardar como nuevo archivo
const outputPath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.5-admin-copiloto.json';
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`\n📁 Archivo guardado: agente-luz-v6.5-admin-copiloto.json`);
console.log(`Total nodos: ${data.nodes.length}`);
