// Script para corregir el formato de saludo en el System Message
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.4-variantes-completas.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Encontrar el agente
const agentNode = data.nodes.find(n => n.name === '🤖 Agente Luz v4');
if (agentNode && agentNode.parameters && agentNode.parameters.options && agentNode.parameters.options.systemMessage) {
    let msg = agentNode.parameters.options.systemMessage;

    // Reemplazar la sección de saludo incorrecta
    const oldGreeting = `### Cuando es cliente NUEVO y NO conoces el nombre:
\\\`\\\`\\\`
Hola [saludo del contexto] 😊 Bienvenido a tusaguacates.com.

¿En qué podemos servirte hoy?
\\\`\\\`\\\``;

    const newGreeting = `### Cuando es cliente NUEVO:
FORMATO DE SALUDO CORRECTO:
"[Saludo del contexto], bienvenido a Tus Aguacates! En qué podemos ayudarte?"

Donde [Saludo del contexto] es el valor de $json.saludo que puede ser:
- "Buenos días" (si es mañana)
- "Buenas tardes" (si es tarde)
- "Buenas noches" (si es noche)

EJEMPLOS CORRECTOS:
- "Buenos días! Bienvenido a Tus Aguacates. En qué te puedo ayudar?"
- "Buenas noches Mauricio! Bienvenido a Tus Aguacates. En qué te puedo servir?"

EJEMPLOS INCORRECTOS (NO HACER):
- "Hola Buenos días" (NO - no pongas Hola antes del saludo)
- Solo "Mauricio, tenemos..." (NO - siempre saluda primero si es NUEVO)`;

    // Hacer el reemplazo más simple
    msg = msg.replace(
        /### Cuando es cliente NUEVO y NO conoces el nombre:[\s\S]*?```[\s\S]*?```/,
        newGreeting
    );

    // También arreglar la parte del saludo incorrecto
    msg = msg.replace('Hola [saludo del contexto]', '[Saludo del contexto]');
    msg = msg.replace('tusaguacates.com', 'Tus Aguacates');

    agentNode.parameters.options.systemMessage = msg;
    console.log('System Message corregido!');
}

// Guardar
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
