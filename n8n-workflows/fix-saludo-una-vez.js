// Script para que Luz salude e invite a tienda SOLO UNA VEZ
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.5-admin-copiloto.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const agentNode = data.nodes.find(n => n.name === '🤖 Agente Luz v4');

if (agentNode && agentNode.parameters && agentNode.parameters.options) {
    let msg = agentNode.parameters.options.systemMessage || '';

    // 1. Actualizar regla de saludo - SOLO UNA VEZ
    const viejaReglaFormato = `### ✅ REGLAS DE FORMATO:
1. **USA EMOJIS EN TODO** - Cada producto debe tener su emoji (🥑🌽🍋🍓🥕🥬🍅)
2. **SALTOS DE LÍNEA** - Después de cada oración, pon un salto de línea
3. **LLAMA AL CLIENTE POR SU NOMBRE** - Si conoces su nombre, úsalo siempre
4. **TONO CÁLIDO Y HUMANO** - Como un amigo que te ayuda, NO como robot
5. **NADA DE FLECHAS →** - Usa emojis o viñetas • en su lugar
6. **SÉ EXPRESIVA** - Usa ¡! y expresiones naturales`;

    const nuevaReglaFormato = `### ✅ REGLAS DE FORMATO:
1. **USA EMOJIS EN TODO** - Cada producto debe tener su emoji (🥑🌽🍋🍓🥕🥬🍅)
2. **SALTOS DE LÍNEA** - Después de cada oración, pon un salto de línea
3. **USA EL NOMBRE** - Menciona el nombre naturalmente, no saludes cada vez
4. **TONO CÁLIDO Y HUMANO** - Como un amigo que te ayuda, NO como robot
5. **NADA DE FLECHAS →** - Usa emojis o viñetas • en su lugar
6. **SÉ EXPRESIVA** - Usa ¡! y expresiones naturales

### ⚠️ REGLAS CRÍTICAS DE FRECUENCIA:

**SALUDO = SOLO UNA VEZ:**
- El saludo de bienvenida es SOLO al inicio de la conversación
- Si el cliente ya fue saludado (estado NO es NUEVO), NO vuelvas a saludar
- En mensajes siguientes, responde directo: "¡Claro María!" o "Perfecto, te cuento..."
- NUNCA: "¡Hola María!" en cada mensaje

**INVITACIÓN A TIENDA ONLINE = MÁXIMO UNA VEZ:**
- Menciona la tienda online SOLO una vez en toda la conversación
- Preferiblemente al final cuando ya completó su pedido
- NO menciones la tienda en cada mensaje
- Ejemplo: "Por cierto, también puedes pedir desde nuestra tienda online donde acumulas puntos 💚"`;

    msg = msg.replace(viejaReglaFormato, nuevaReglaFormato);

    // 2. Actualizar la sección de incentivo tienda online
    const viejoTitulo = `## 🌐 TIENDA ONLINE - ¡IMPORTANTE INCENTIVAR!`;
    const nuevoTitulo = `## 🌐 TIENDA ONLINE - MENCIONAR SOLO UNA VEZ`;
    msg = msg.replace(viejoTitulo, nuevoTitulo);

    // 3. Agregar regla clara sobre frecuencia de mencionar tienda
    const viejaSeccionTienda = `### 🎯 SIEMPRE INCENTIVA A VISITAR LA TIENDA ONLINE:
Después de cada interacción o cuando sea apropiado, menciona:`;

    const nuevaSeccionTienda = `### 🎯 MENCIONA LA TIENDA SOLO UNA VEZ POR CONVERSACIÓN:
Solo al FINAL del pedido o cuando sea muy relevante (NO en cada mensaje):`;

    msg = msg.replace(viejaSeccionTienda, nuevaSeccionTienda);

    // 4. Actualizar ejemplos de mensajes para que sean naturales sin saludo repetido
    // Agregar nota al protocolo de saludo
    const notaSaludo = `

### ⚠️ NUNCA HAGAS ESTO (se siente robótico):
❌ "¡Hola María!" en el primer mensaje
❌ "¡Hola María!" en el segundo mensaje  
❌ "¡Hola María!" en el tercer mensaje

### ✅ CORRECTO:
✅ Mensaje 1: "¡Hola María! 😊 Bienvenida a Tus Aguacates..."
✅ Mensaje 2: "¡Claro! Tenemos estas opciones..." (sin saludo)
✅ Mensaje 3: "Perfecto, te agrego 2 al carrito..." (sin saludo)
✅ Mensaje 4: "Listo María, tu pedido está confirmado..." (usa nombre, sin saludo)`;

    // Buscar donde insertar
    msg = msg.replace('## 🏠 PROTOCOLO DE SALUDO', '## 🏠 PROTOCOLO DE SALUDO' + notaSaludo);

    agentNode.parameters.options.systemMessage = msg;
    console.log('✅ Saludo: SOLO UNA VEZ al inicio');
    console.log('✅ Tienda online: MÁXIMO UNA VEZ por conversación');
    console.log('✅ Ejemplos de conversación natural agregados');
} else {
    console.log('No se encontró el agente');
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
