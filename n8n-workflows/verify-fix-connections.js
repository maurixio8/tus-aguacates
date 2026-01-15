// Script para verificar y reparar TODAS las conexiones de herramientas
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.5-admin-copiloto.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('=== VERIFICACIÓN DE HERRAMIENTAS ===\n');

// 1. Listar todas las herramientas TOOL_ en el archivo
const toolNodes = data.nodes.filter(n => n.name.startsWith('TOOL_'));
console.log('Herramientas encontradas en nodos:');
toolNodes.forEach(t => console.log(`  - ${t.name} (${t.type})`));

// 2. Verificar conexiones existentes
console.log('\nConexiones de herramientas existentes:');
const toolConnections = Object.keys(data.connections).filter(k => k.startsWith('TOOL_'));
toolConnections.forEach(t => {
    const target = data.connections[t].ai_tool?.[0]?.[0]?.node || 'sin conexión';
    console.log(`  - ${t} -> ${target}`);
});

// 3. Herramientas que deberían estar conectadas a Agente Luz v4
const toolsParaAgenteLuz = [
    'TOOL_AnadirAlCarrito',
    'TOOL_BuscarProductos',
    'TOOL_CalcularTotalPrePedido',
    'TOOL_CambiarEstadoCliente',
    'TOOL_ConfirmarPedidoConEtiqueta',
    'TOOL_ConsultarEstadoPedido',
    'TOOL_EscalarServicioCliente',
    'TOOL_GuardarDireccionCliente',
    'TOOL_GuardarNombreCliente',
    'TOOL_ObtenerVariantes'
];

// 4. Agregar conexiones faltantes
console.log('\n=== AGREGANDO CONEXIONES FALTANTES ===\n');
let agregadas = 0;

toolsParaAgenteLuz.forEach(toolName => {
    // Verificar que el nodo existe
    const nodeExists = data.nodes.find(n => n.name === toolName);
    if (!nodeExists) {
        console.log(`❌ ${toolName} - NODO NO EXISTE en el archivo`);
        return;
    }

    // Verificar si ya tiene conexión
    if (!data.connections[toolName]) {
        data.connections[toolName] = {
            ai_tool: [[{
                node: "🤖 Agente Luz v4",
                type: "ai_tool",
                index: 0
            }]]
        };
        console.log(`✅ ${toolName} - Conexión AGREGADA a 🤖 Agente Luz v4`);
        agregadas++;
    } else {
        console.log(`⏭️  ${toolName} - Ya tiene conexión`);
    }
});

// 5. Herramientas para Copiloto
const toolsParaCopiloto = [
    'TOOL_ADMIN_CambiarEstadoCliente',
    'TOOL_ADMIN_BorrarMemoriaCliente',
    'TOOL_ADMIN_LimpiarCarritoCliente'
];

toolsParaCopiloto.forEach(toolName => {
    const nodeExists = data.nodes.find(n => n.name === toolName);
    if (!nodeExists) {
        console.log(`❌ ${toolName} - NODO NO EXISTE`);
        return;
    }

    if (!data.connections[toolName]) {
        data.connections[toolName] = {
            ai_tool: [[{
                node: "🧠 Agente Copiloto1",
                type: "ai_tool",
                index: 0
            }]]
        };
        console.log(`✅ ${toolName} - Conexión AGREGADA a 🧠 Agente Copiloto1`);
        agregadas++;
    } else {
        console.log(`⏭️  ${toolName} - Ya tiene conexión`);
    }
});

console.log(`\n=== RESUMEN ===`);
console.log(`Total conexiones agregadas: ${agregadas}`);

// Guardar
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
