// Script para mencionar tienda online AL PRINCIPIO cuando hay intención de compra
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.5-admin-copiloto.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const agentNode = data.nodes.find(n => n.name === '🤖 Agente Luz v4');

if (agentNode && agentNode.parameters && agentNode.parameters.options) {
    let msg = agentNode.parameters.options.systemMessage || '';

    // Reemplazar la sección de tienda online completa
    const viejaSeccion = `## 🌐 TIENDA ONLINE - MENCIONAR SOLO UNA VEZ

**URL**: https://tus-aguacates.vercel.app

### 🎯 MENCIONA LA TIENDA SOLO UNA VEZ POR CONVERSACIÓN:
Solo al FINAL del pedido o cuando sea muy relevante (NO en cada mensaje):`;

    const nuevaSeccion = `## 🌐 TIENDA ONLINE - MENCIONAR AL PRINCIPIO

**URL**: https://tus-aguacates.vercel.app

### 🎯 ESTRATEGIA: Mencionar AL INICIO cuando hay intención de compra

**¿Cuándo mencionar?**
- Cuando el cliente muestra PRIMERA intención de comprar algo
- SOLO UNA VEZ por conversación (o cada 24 horas)
- AL PRINCIPIO, no al final

**¿Por qué al principio?**
- El cliente puede ir a la tienda y hacer todo el pedido solo
- Ahorra tiempo porque el cliente ingresa sus propios datos
- Nosotros solo verificamos el pedido cuando llegue

### Ejemplo de cuándo mencionarla:
Cliente: "Hola, quiero aguacates"
Tu: "¡Hola María! 😊 ¡Claro que tenemos!

Te cuento que puedes hacer tu pedido de dos formas:
🛒 En nuestra tienda online: tus-aguacates.vercel.app 
   (Acumulas puntos, recetas gratis, y es súper fácil 💚)
📱 O aquí mismo por WhatsApp, yo te ayudo

¿Cómo prefieres?"

### Si el cliente quiere seguir por WhatsApp:
- Continúa normalmente mostrando productos
- NO vuelvas a mencionar la tienda (ya la ofreciste)

### Si el cliente va a la tienda:
- Un asesor verificará su pedido cuando llegue
- Si es cliente nuevo, se guardan sus datos automáticamente`;

    msg = msg.replace(viejaSeccion, nuevaSeccion);

    // También actualizar el incentivo para que sea al principio
    const viejasOpciones = `### Frases para incentivar:
• "¡Te recomiendo visitar nuestra tienda online donde puedes acumular puntos! 🎁"
• "En tus-aguacates.vercel.app tienes ofertas exclusivas y acumulas puntos 💚"
• "¿Sabías que en la tienda online puedes registrarte y obtener beneficios? ✨"`;

    const nuevasOpciones = `### Frase sugerida (AL INICIO de la intención de compra):
"Te cuento que también puedes pedir desde nuestra tienda: tus-aguacates.vercel.app 🛒
Ahí acumulas puntos, ves recetas gratis, y es muy fácil.
¿Prefieres la tienda o te ayudo por aquí? 💚"`;

    msg = msg.replace(viejasOpciones, nuevasOpciones);

    agentNode.parameters.options.systemMessage = msg;
    console.log('✅ Tienda online: se menciona AL PRINCIPIO cuando hay intención de compra');
    console.log('✅ Solo una vez por conversación o cada 24 horas');
    console.log('✅ Da opción al cliente de elegir cómo prefiere ordenar');
} else {
    console.log('No se encontró el agente');
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
