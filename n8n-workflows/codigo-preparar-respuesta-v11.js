// =====================================================
// 📤 PREPARAR RESPUESTA v11 - SIMPLE Y FUNCIONAL
// =====================================================
// Solo arregla saltos de línea, sin formateo complejo
// =====================================================

const respuestaIA = $input.first().json.output || $input.first().json.text || '';
const contexto = $('4. Merge Datos + Productos').first().json;

// =====================================================
// 🔧 FIX: Convertir \n literal a salto de línea real
// =====================================================

let mensaje = respuestaIA || '';

// Limpiar markdown doble
mensaje = mensaje.replace(/\*\*/g, '*');

// MÉTODO SIMPLE: Reemplazar la secuencia literal \n
// Usamos una función para evitar problemas de escape
const BACKSLASH = String.fromCharCode(92); // \
const LITERAL_NEWLINE = BACKSLASH + 'n';    // \n como texto

// Loop para asegurar que se reemplacen todos
let intentos = 0;
while (mensaje.indexOf(LITERAL_NEWLINE) !== -1 && intentos < 100) {
    mensaje = mensaje.split(LITERAL_NEWLINE).join('\n');
    intentos++;
}

// Limpiar saltos de línea excesivos
mensaje = mensaje.replace(/\n{3,}/g, '\n\n');

// Limpiar espacios extra
mensaje = mensaje.replace(/  +/g, ' ');

// Fallback
if (!mensaje || mensaje.trim() === '') {
    mensaje = '¡Hola! 🥑 ¿En qué puedo ayudarte?';
}

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
        img = { url, nombre: p.name, precio: p.price };
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
                caption: '🥑 ' + img.nombre + ' - $' + Number(img.precio).toLocaleString('es-CO')
            }
        }
    });
}

// Agregar mensaje de texto
resultados.push({
    json: {
        from: contexto.to,
        to: contexto.from,
        type: 'text',
        text: { body: mensaje }
    }
});

return resultados;
