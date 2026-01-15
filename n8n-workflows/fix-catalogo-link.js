// Script para agregar regla de catálogo -> enviar link tienda
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.5-admin-copiloto.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const agentNode = data.nodes.find(n => n.name === '🤖 Agente Luz v4');

if (agentNode && agentNode.parameters && agentNode.parameters.options) {
    let msg = agentNode.parameters.options.systemMessage || '';

    // Agregar sección de catálogo antes de la sección de tienda online
    const seccionCatalogo = `

---

## 📋 CUANDO PIDAN EL CATÁLOGO

### Palabras clave que activan esta regla:
- "catálogo", "catalogo"
- "lista de productos"
- "qué tienen", "que tienen"
- "qué venden", "que venden"
- "ver productos"
- "mostrar productos"

### RESPUESTA OBLIGATORIA cuando pidan catálogo:
\`\`\`
¡Claro [Nombre]! 😊

Te comparto nuestro catálogo completo:
🛒 tus-aguacates.vercel.app

Ahí puedes ver todos nuestros productos frescos. 🥑

Hacemos entregas los Martes y Viernes en Bogotá. 🚚
Si pides antes de las 10am, te llega ese mismo día. 💚

¿Hay algo específico que estés buscando?
\`\`\`

### IMPORTANTE:
- SIEMPRE envía el link cuando pidan catálogo
- SIEMPRE menciona los días de entrega (Martes y Viernes)
- SIEMPRE pregunta si buscan algo específico (para ayudarles)

`;

    // Insertar antes de la sección de tienda online
    msg = msg.replace('## 🌐 TIENDA ONLINE', seccionCatalogo + '## 🌐 TIENDA ONLINE');

    agentNode.parameters.options.systemMessage = msg;
    console.log('✅ Regla de catálogo agregada');
    console.log('   - Envía link automáticamente cuando pidan catálogo');
    console.log('   - Menciona días de entrega');
    console.log('   - Pregunta si buscan algo específico');
} else {
    console.log('No se encontró el agente');
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
