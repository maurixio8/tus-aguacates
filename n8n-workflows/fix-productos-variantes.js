// Script para arreglar productosTexto y agregar instrucción para usar TOOL_ObtenerVariantes
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.4-variantes-completas.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// 1. Encontrar el nodo "4. Merge Datos + Productos"
const mergeNode = data.nodes.find(n => n.name === '4. Merge Datos + Productos');
if (mergeNode && mergeNode.parameters && mergeNode.parameters.jsCode) {
    let code = mergeNode.parameters.jsCode;

    // Reemplazar la línea que genera productosTexto incorrectamente
    const oldLine = '`${i+1}. ${p.name} - $${Number(p.price).toLocaleString(\'es-CO\')} (${p.category_name}) [ID: ${p.id}]`';
    const newLine = '`${i+1}. ${p.name} - $${Number(p.price).toLocaleString(\'es-CO\')} [ID: ${p.id}] [IMPORTANTE: Usa TOOL_ObtenerVariantes con este ID para ver tamaños/pesos disponibles]`';

    if (code.includes(oldLine)) {
        code = code.replace(oldLine, newLine);
        mergeNode.parameters.jsCode = code;
        console.log('productosTexto corregido!');
    } else {
        console.log('Línea original no encontrada, intentando otra forma...');
        // Intentar con versión escapada
        code = code.replace(
            /category_name/g,
            'name'  // Mostrar el nombre en vez de la categoría null
        );
        mergeNode.parameters.jsCode = code;
        console.log('Reemplazo alternativo aplicado');
    }
}

// 2. Actualizar el System Message para enfatizar el uso de TOOL_ObtenerVariantes
const agentNode = data.nodes.find(n => n.name === '🤖 Agente Luz v4');
if (agentNode && agentNode.parameters && agentNode.parameters.options && agentNode.parameters.options.systemMessage) {
    let msg = agentNode.parameters.options.systemMessage;

    // Agregar una regla más fuerte sobre variantes
    const reglaVariantes = `

---

## ⚠️ REGLA CRÍTICA DE VARIANTES

### SIEMPRE que muestres productos al cliente:
1. LLAMA primero a TOOL_ObtenerVariantes(producto_id) 
2. Si devuelve variantes: muestra TODAS con sus pesos y precios
3. Si NO devuelve variantes: el producto no tiene variantes, muestra solo el precio base

### Ejemplo de cómo usar:
1. Cliente: "Tienes limones?"
2. TÚ: llama TOOL_ObtenerVariantes(118307) para Limón Mandarino
3. SI hay variantes: "Limón Mandarino: 500g $3.300, 1kg $6.000"
4. SI NO hay variantes: "Limón Mandarino $3.300 por unidad"

### NUNCA muestres productos sin antes verificar sus variantes.
`;

    if (!msg.includes('REGLA CRÍTICA DE VARIANTES')) {
        msg += reglaVariantes;
        agentNode.parameters.options.systemMessage = msg;
        console.log('Regla de variantes agregada al System Message!');
    }
}

// Guardar
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
