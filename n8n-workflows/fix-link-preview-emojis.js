// Script para habilitar Link Preview y mantener emojis
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.5-admin-copiloto.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Buscar el nodo Preparar Respuesta
const prepararRespuesta = data.nodes.find(n => n.name === '📤 Preparar Respuesta');

if (prepararRespuesta) {
    console.log('Encontrado nodo 📤 Preparar Respuesta');

    // Nuevo código que:
    // 1. MANTIENE emojis (no los elimina)
    // 2. Agrega preview_url: true cuando hay URLs
    const nuevoJsCode = `// =====================================================
// 📤 PREPARAR RESPUESTA v15 - CON EMOJIS Y LINK PREVIEW
// =====================================================
// Mantiene emojis y habilita preview de links
// =====================================================

const respuestaIA = $input.first().json.output || $input.first().json.text || '';
const contexto = $('4. Merge Datos + Productos').first().json;

// =====================================================
// 🔧 LIMPIEZA DEL MENSAJE (MANTENIENDO EMOJIS)
// =====================================================

let mensaje = respuestaIA || '';

// 1. ELIMINAR ASTERISCOS (negritas causan problemas)
mensaje = mensaje.replace(/\\*/g, '');

// 2. CONVERTIR \\n LITERAL A SALTO DE LÍNEA REAL
const BACKSLASH = String.fromCharCode(92);
const LITERAL_N = BACKSLASH + 'n';

let intentos = 0;
while (mensaje.indexOf(LITERAL_N) !== -1 && intentos < 50) {
    mensaje = mensaje.split(LITERAL_N).join('\\n');
    intentos++;
}

// 3. LIMPIAR SOLO emojis rotos (unicode suelto) - MANTENER EMOJIS NORMALES
mensaje = mensaje.replace(/[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])/g, '');
mensaje = mensaje.replace(/(?<![\\uD800-\\uDBFF])[\\uDC00-\\uDFFF]/g, '');
mensaje = mensaje.replace(/\\\\u[0-9a-fA-F]{4}/g, '');

// 4. NO ELIMINAR EMOJIS - Los emojis son importantes para el tono amigable
// Solo eliminar flechas → y reemplazar por caracteres seguros
mensaje = mensaje.replace(/→/g, '•');

// 5. LIMPIAR ESPACIOS Y SALTOS EXCESIVOS
mensaje = mensaje.replace(/\\n{3,}/g, '\\n\\n');
mensaje = mensaje.replace(/  +/g, ' ');
mensaje = mensaje.trim();

// 6. FALLBACK
if (!mensaje) {
    mensaje = '¡Hola! 😊 ¿En qué puedo ayudarte?';
}

// =====================================================
// 🔗 DETECTAR SI HAY URLs PARA HABILITAR PREVIEW
// =====================================================
const tieneUrl = mensaje.includes('http://') || mensaje.includes('https://') || mensaje.includes('tus-aguacates.vercel.app');

// =====================================================
// 🖼️ PREPARAR IMAGEN SI HAY PRODUCTOS
// =====================================================

const prods = contexto.productosEncontrados || [];
let img = null;
if (prods.length > 0) {
    const p = prods.find(x => x.main_image_url && x.main_image_url.length > 0);
    if (p) {
        let url = p.main_image_url;
        if (url.includes('supabase.co/storage') && url.includes('.webp')) {
            url = url.replace('/object/public/', '/render/image/public/') + '?format=origin';
        }
        img = {
            url,
            nombre: p.name,
            precio: p.price,
            caption: p.name + ' - $' + Number(p.price).toLocaleString('es-CO')
        };
    }
}

// =====================================================
// 📤 PREPARAR RESPUESTAS PARA YCLOUD
// =====================================================

const resultados = [];

// Agregar imagen si existe
if (img && !contexto.esMedia) {
    resultados.push({
        json: {
            from: contexto.to,
            to: contexto.from,
            type: 'image',
            image: {
                link: img.url,
                caption: img.caption
            }
        }
    });
}

// Agregar mensaje de texto CON preview_url si hay links
const mensajeJson = {
    from: contexto.to,
    to: contexto.from,
    type: 'text',
    text: { 
        body: mensaje,
        preview_url: tieneUrl  // Habilita Link Preview cuando hay URLs
    }
};

resultados.push({ json: mensajeJson });

return resultados;
`;

    prepararRespuesta.parameters.jsCode = nuevoJsCode;
    console.log('✅ Código actualizado:');
    console.log('   - MANTIENE emojis (no los elimina)');
    console.log('   - Agrega preview_url: true cuando hay URLs');
    console.log('   - Link Preview habilitado para tus-aguacates.vercel.app');
} else {
    console.log('No se encontró el nodo');
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
