// Script para mejorar el saludo de bienvenida en el System Message
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.5-admin-copiloto.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const agentNode = data.nodes.find(n => n.name === '🤖 Agente Luz v4');

if (agentNode && agentNode.parameters && agentNode.parameters.options) {
    let msg = agentNode.parameters.options.systemMessage || '';

    // Buscar y reemplazar la sección de saludo
    const viejoSaludo = `### Cuando es cliente NUEVO:
\`\`\`
¡Hola! 👋🥑

Bienvenido/a a Tus Aguacates. 💚

¿En qué puedo ayudarte hoy? 😊
\`\`\`

### Cuando el cliente YA tiene nombre registrado:
\`\`\`
¡Hola [Nombre]! 👋

¿En qué te puedo ayudar hoy? 🥑
\`\`\``;

    const nuevoSaludo = `### Cuando es cliente NUEVO (primera vez):
\`\`\`
¡Hola! 👋🥑

¡Bienvenido/a a Tus Aguacates! 💚

Aquí te atendemos con todo el cariño.
Somos expertos en aguacates premium y frutas frescas del Eje Cafetero.

¿En qué puedo ayudarte hoy? 😊
\`\`\`

### Cuando el cliente YA tiene nombre registrado:
\`\`\`
¡Hola [Nombre]! 👋🥑

¡Qué gusto verte de nuevo!
Estoy aquí para atenderte. 💚

¿Qué te gustaría ordenar hoy? 😊
\`\`\`

### Cuando es cliente que REGRESA (tiene pedidos anteriores):
\`\`\`
¡Hola [Nombre]! 👋

¡Qué alegría tenerte de vuelta! 🥑
Gracias por seguir confiando en nosotros. 💚

¿En qué te puedo ayudar hoy?
\`\`\``;

    msg = msg.replace(viejoSaludo, nuevoSaludo);

    // También actualizar las reglas de saludo
    const viejaRegla = `### IMPORTANTE SOBRE EL NOMBRE:
- **Siempre usa el nombre del cliente si está disponible**
- Si el cliente dice "Hola, soy María", guarda el nombre y responde "¡Hola María!"
- Usa el nombre en cada mensaje de forma natural`;

    const nuevaRegla = `### IMPORTANTE SOBRE EL NOMBRE Y TRATO:
- **Siempre usa el nombre del cliente si está disponible**
- Si el cliente dice "Hola, soy María", guarda el nombre y responde "¡Hola María! ¡Qué gusto conocerte!"
- Usa el nombre en cada mensaje de forma natural
- **HAZ QUE EL CLIENTE SE SIENTA ESPECIAL E IMPORTANTE**
- Muestra entusiasmo genuino y calidez colombiana`;

    msg = msg.replace(viejaRegla, nuevaRegla);

    agentNode.parameters.options.systemMessage = msg;
    console.log('Saludos mejorados con más calidez y bienvenida especial');
} else {
    console.log('No se encontró el agente');
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
