// Script para agregar TOOL_ObtenerVariantes al workflow v6.5
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.5-admin-copiloto.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Verificar si ya existe
const existe = data.nodes.find(n => n.name === 'TOOL_ObtenerVariantes');

if (!existe) {
    // Agregar la herramienta
    const toolVariantes = {
        parameters: {
            descriptionType: "manual",
            toolDescription: "OBTENER VARIANTES/PRESENTACIONES de un producto. ÚSALA SIEMPRE cuando muestres un producto al cliente para ver sus tamaños, pesos y precios. Input: UUID/supabase_id del producto.",
            operation: "executeQuery",
            query: `SELECT 
  v.supabase_id,
  v.variant_name as tipo,
  v.variant_value as presentacion,
  v.price as precio,
  v.price_adjustment as ajuste_precio,
  v.stock_quantity as stock,
  v.sku
FROM variantes_productos v
WHERE v.product_supabase_id = $1::uuid
  AND v.is_active = true
ORDER BY v.variant_name, v.sort_order, v.price;`,
            options: {
                queryReplacement: "={{ $fromAI('product_supabase_id','UUID del producto en Supabase (supabase_id en productosEncontrados)','string','') }}"
            }
        },
        id: "tool-variantes",
        name: "TOOL_ObtenerVariantes",
        type: "n8n-nodes-base.postgresTool",
        typeVersion: 2.6,
        position: [-800, -80],
        credentials: {
            postgres: {
                id: "R6hc0vEZJhKQSi3G",
                name: "Mi PostgreSQL Docker"
            }
        }
    };

    data.nodes.push(toolVariantes);
    console.log('✅ TOOL_ObtenerVariantes agregada');

    // Agregar conexión al agente
    data.connections["TOOL_ObtenerVariantes"] = {
        ai_tool: [[{ node: "🤖 Agente Luz v4", type: "ai_tool", index: 0 }]]
    };
    console.log('✅ Conexión agregada al Agente Luz v4');
} else {
    console.log('⏭️  TOOL_ObtenerVariantes ya existe');
}

// También verificar que exista el System Message con instrucciones de variantes
const agentNode = data.nodes.find(n => n.name === '🤖 Agente Luz v4');
if (agentNode && agentNode.parameters && agentNode.parameters.options) {
    let msg = agentNode.parameters.options.systemMessage || '';

    // Verificar si ya tiene la instrucción de variantes
    if (!msg.includes('SIEMPRE usa TOOL_ObtenerVariantes')) {
        const instruccionVariantes = `

### 🔍 USO OBLIGATORIO DE TOOL_ObtenerVariantes

**SIEMPRE que muestres un producto al cliente:**
1. Busca el \`supabase_id\` del producto en \`productosEncontrados\`
2. Llama a TOOL_ObtenerVariantes(supabase_id)
3. Muestra TODAS las variantes con sus precios

**Ejemplo:**
Si el cliente dice "Quiero fresas" y encontraste "Fresas premium" con supabase_id "56c45f31-e4d7-..."
1. Llama: TOOL_ObtenerVariantes("56c45f31-e4d7-...")
2. Muestra: "🍓 Fresas premium: 250g $8.500, 500g $16.000"

`;
        msg = msg.replace('## 🛠️ HERRAMIENTAS DISPONIBLES', instruccionVariantes + '## 🛠️ HERRAMIENTAS DISPONIBLES');
        agentNode.parameters.options.systemMessage = msg;
        console.log('✅ Instrucciones de uso de TOOL_ObtenerVariantes agregadas');
    }
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
