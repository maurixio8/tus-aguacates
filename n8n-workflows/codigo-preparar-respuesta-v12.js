// =====================================================
// 📤 PREPARAR RESPUESTA v12 - CON MARCADOR <BR>
// =====================================================
// El AI Agent debe usar <BR> en lugar de \n
// Luego este código lo convierte a salto de línea real
// =====================================================

const respuestaIA = $input.first().json.output || $input.first().json.text || '';
const contexto = $('4. Merge Datos + Productos').first().json;

// =====================================================
// 🔧 CONVERSIÓN DE MARCADORES A SALTOS DE LÍNEA
// =====================================================

let mensaje = respuestaIA || '';

// Limpiar markdown doble
mensaje = mensaje.replace(/\*\*/g, '*');

// MÉTODO 1: Convertir <BR> a salto de línea real
mensaje = mensaje.replace(/<BR>/gi, '\n');
mensaje = mensaje.replace(/<br>/gi, '\n');
mensaje = mensaje.replace(/<br\/>/gi, '\n');
mensaje = mensaje.replace(/<br \/>/gi, '\n');

// MÉTODO 2: Convertir [BR] a salto de línea (alternativa)
mensaje = mensaje.replace(/\[BR\]/gi, '\n');
mensaje = mensaje.replace(/\[SALTO\]/gi, '\n');

// MÉTODO 3: Intentar convertir \n literal (último recurso)
// Usar charCode para evitar problemas de escape
const backslash = String.fromCharCode(92);
const literalNewline = backslash + 'n';
let maxIterations = 50;
while (mensaje.includes(literalNewline) && maxIterations > 0) {
    mensaje = mensaje.split(literalNewline).join('\n');
    maxIterations--;
}

// Limpiar emojis corruptos (caracteres Unicode sueltos)
mensaje = mensaje.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '');
mensaje = mensaje.replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');

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
