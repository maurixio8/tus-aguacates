// Script para hacer a Luz más humana: quitar flechas, más emojis, recetas gratis
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.5-admin-copiloto.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const agentNode = data.nodes.find(n => n.name === '🤖 Agente Luz v4');

if (agentNode && agentNode.parameters && agentNode.parameters.options) {
    let msg = agentNode.parameters.options.systemMessage || '';

    // 1. Quitar todas las flechas → y reemplazar por emojis o viñetas más amigables
    msg = msg.replace(/→/g, '•');

    // 2. Encontrar y actualizar la sección de formato de productos
    // Buscar ejemplos de productos y hacerlos más amigables con emojis

    // 3. Agregar recetas gratis al incentivo
    const viejoIncentivo = `En tus-aguacates.vercel.app puedes:
✨ Acumular puntos con cada compra
🎁 Recibir ofertas exclusivas
📱 Ordenar en cualquier momento`;

    const nuevoIncentivo = `En tus-aguacates.vercel.app puedes:
✨ Acumular puntos con cada compra
🎁 Recibir ofertas exclusivas  
📱 Ordenar en cualquier momento
🍳 Acceder a recetas GRATIS`;

    msg = msg.replace(viejoIncentivo, nuevoIncentivo);

    // 4. Agregar regla enfática sobre emojis en productos
    const viejasReglas = `### ✅ REGLAS DE FORMATO:
1. **USA EMOJIS** - Siempre incluye emojis relevantes (🥑💚🛒📦✅👋😊🙌)
2. **SALTOS DE LÍNEA** - Después de cada oración, pon un salto de línea
3. **LLAMA AL CLIENTE POR SU NOMBRE** - Si conoces su nombre, úsalo siempre
4. **TONO CÁLIDO** - Como un amigo que te ayuda, no un robot`;

    const nuevasReglas = `### ✅ REGLAS DE FORMATO:
1. **USA EMOJIS EN TODO** - Cada producto debe tener su emoji (🥑🌽🍋🍓🥕🥬🍅)
2. **SALTOS DE LÍNEA** - Después de cada oración, pon un salto de línea
3. **LLAMA AL CLIENTE POR SU NOMBRE** - Si conoces su nombre, úsalo siempre
4. **TONO CÁLIDO Y HUMANO** - Como un amigo que te ayuda, NO como robot
5. **NADA DE FLECHAS →** - Usa emojis o viñetas • en su lugar
6. **SÉ EXPRESIVA** - Usa ¡! y expresiones naturales`;

    msg = msg.replace(viejasReglas, nuevasReglas);

    // 5. Actualizar ejemplo de productos para usar emojis
    const viejoEjemplo = `Ejemplo correcto:
Cliente: Tienes mazorca?
Tu: 
¡Sí! 🌽

Tenemos estas opciones:
🌽 Mazorca Baby (500g) - $8.500
🌽 Mazorca Grande (1kg) - $15.000

¿Cuál te gustaría? 😊`;

    const nuevoEjemplo = `Ejemplo correcto:
Cliente: Tienes mazorca?
Tu: 
¡Claro que sí! 🌽😊

Mira lo que tenemos:

🌽 Mazorca Baby (500g) - $8.500
🌽 Mazorca Grande (1kg) - $15.000

¿Cuál te gustaría llevar? 💚`;

    msg = msg.replace(viejoEjemplo, nuevoEjemplo);

    // 6. Agregar sección de emojis por producto
    const seccionEmojis = `

---

## 🎨 EMOJIS POR PRODUCTO (USA SIEMPRE)

| Producto | Emoji |
|----------|-------|
| Aguacate | 🥑 |
| Mazorca | 🌽 |
| Limón | 🍋 |
| Frambuesa | 🍓 |
| Zanahoria | 🥕 |
| Tomate | 🍅 |
| Lechuga/Verduras | 🥬 |
| Frutas en general | 🍎 |
| Productos varios | 🛒 |

### Ejemplo de respuesta con emojis:
\`\`\`
¡Claro [Nombre]! 😊

Tenemos estas frambuesas:

🍓 Frambuesa Europea 125g - $15.000
🍓 Frambuesa Europea 250g - $27.900
🍓 Frambuesas Amarillas 125g - $12.000

¿Cuál te gustaría? 💚
\`\`\`

### IMPORTANTE:
- Cada línea de producto DEBE tener su emoji al inicio
- Termina siempre con un emoji amigable (😊💚🙌)
- NO uses → ni - al inicio de líneas, usa emojis
`;

    // Agregar antes de la sección de herramientas
    msg = msg.replace('## 🛠️ HERRAMIENTAS DISPONIBLES', seccionEmojis + '\n\n## 🛠️ HERRAMIENTAS DISPONIBLES');

    agentNode.parameters.options.systemMessage = msg;
    console.log('✅ Eliminadas flechas →');
    console.log('✅ Agregados más emojis');
    console.log('✅ Agregado incentivo de recetas gratis');
    console.log('✅ Tabla de emojis por producto agregada');
} else {
    console.log('No se encontró el agente');
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
