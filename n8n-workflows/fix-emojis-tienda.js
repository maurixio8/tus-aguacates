// Script para mejorar emojis y agregar incentivo de tienda online
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.5-admin-copiloto.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const agentNode = data.nodes.find(n => n.name === '🤖 Agente Luz v4');

if (agentNode && agentNode.parameters && agentNode.parameters.options) {
    let msg = agentNode.parameters.options.systemMessage || '';

    // Cambiar emoji de mano 👋 por carita feliz 😊 y agregar 🥑💚 al final
    msg = msg.replace(/👋🥑/g, '😊🥑');
    msg = msg.replace(/👋\n/g, '😊\n');

    // Agregar sección de incentivo tienda online después de la sección de tienda
    const seccionTienda = `## 🌐 TIENDA ONLINE

**URL**: https://tus-aguacates.vercel.app

Menciona cuando sea relevante:
- 🛒 "Puedes ver todo nuestro catálogo en la tienda online"
- 🍳 "Tenemos recetas en: https://tus-aguacates.vercel.app/recetas"`;

    const nuevaSeccionTienda = `## 🌐 TIENDA ONLINE - ¡IMPORTANTE INCENTIVAR!

**URL**: https://tus-aguacates.vercel.app

### 🎯 SIEMPRE INCENTIVA A VISITAR LA TIENDA ONLINE:
Después de cada interacción o cuando sea apropiado, menciona:

\`\`\`
Por cierto, ¿ya conoces nuestra tienda online? 🛒

En tus-aguacates.vercel.app puedes:
✨ Acumular puntos con cada compra
🎁 Recibir ofertas exclusivas
📱 Ordenar en cualquier momento

¡Te invito a registrarte! 💚
\`\`\`

### Frases para incentivar:
- "¡Te recomiendo visitar nuestra tienda online donde puedes acumular puntos! 🎁"
- "En tus-aguacates.vercel.app tienes ofertas exclusivas y acumulas puntos 💚"
- "¿Sabías que en la tienda online puedes registrarte y obtener beneficios? ✨"

### También menciona:
- 🛒 "Puedes ver todo nuestro catálogo en la tienda online"
- 🍳 "Tenemos recetas en: https://tus-aguacates.vercel.app/recetas"`;

    msg = msg.replace(seccionTienda, nuevaSeccionTienda);

    // Actualizar los saludos con mejores emojis
    msg = msg.replace(/¡Hola! 👋🥑/g, '¡Hola! 😊🥑');
    msg = msg.replace(/¡Hola \[Nombre\]! 👋🥑/g, '¡Hola [Nombre]! 😊🥑');
    msg = msg.replace(/¡Hola \[Nombre\]! 👋\n/g, '¡Hola [Nombre]! 😊\n');

    agentNode.parameters.options.systemMessage = msg;
    console.log('Emojis actualizados e incentivo de tienda online agregado');
} else {
    console.log('No se encontró el agente');
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
