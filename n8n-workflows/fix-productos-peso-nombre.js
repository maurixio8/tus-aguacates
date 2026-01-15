// Script para agregar lógica de productos con peso en el nombre
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.4-variantes-completas.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Encontrar el agente
const agentNode = data.nodes.find(n => n.name === '🤖 Agente Luz v4');
if (agentNode && agentNode.parameters && agentNode.parameters.options && agentNode.parameters.options.systemMessage) {
    let msg = agentNode.parameters.options.systemMessage;

    // Agregar sección sobre productos con peso en el nombre
    const nuevaSeccion = `

---

## 🍓 PRODUCTOS CON PESO EN EL NOMBRE

### Algunos productos ya tienen el peso en su nombre:
Ejemplos:
- "Frambuesa Europea - 125grs" → $15.000
- "Frambuesa Europea - 250grs" → $27.900
- "Frambuesas Amarillas - 125grs" → $12.000

### ¿Cómo identificarlos?
Si en el contexto ves VARIOS productos con el mismo nombre base pero diferentes pesos (125g, 250g, 500g, 1kg), significa que cada peso es un producto separado.

### QUÉ HACER:
1. NO uses TOOL_ObtenerVariantes (no tienen variantes)
2. Muestra TODOS los productos encontrados con sus precios
3. Pregunta cuál quiere el cliente

### Ejemplo de respuesta correcta:
Cliente: "Tienes frambuesas?"
Tu respuesta:
"Si! Tenemos estas opciones de frambuesas:
→ Frambuesa Europea 125grs - $15.000
→ Frambuesa Europea 250grs - $27.900
→ Frambuesas Amarillas 125grs - $12.000
→ Frambuesas Amarillas 250grs - $22.400

Cual te gustaria y cuantas unidades?"
`;

    // Verificar si ya tiene la sección
    if (!msg.includes('PRODUCTOS CON PESO EN EL NOMBRE')) {
        msg += nuevaSeccion;
        agentNode.parameters.options.systemMessage = msg;
        console.log('Sección de productos con peso en nombre agregada!');
    } else {
        console.log('Ya tiene la sección');
    }
}

// Guardar
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
