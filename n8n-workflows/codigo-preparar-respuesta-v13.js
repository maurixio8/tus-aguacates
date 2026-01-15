// =====================================================
// 📤 PREPARAR RESPUESTA v13 - SIN NEGRITAS, SIN EMOJIS ROTOS
// =====================================================
// Limpia el formato para WhatsApp
// =====================================================

const respuestaIA = $input.first().json.output || $input.first().json.text || '';
const contexto = $('4. Merge Datos + Productos').first().json;

// =====================================================
// 🔧 LIMPIEZA TOTAL DEL MENSAJE
// =====================================================

let mensaje = respuestaIA || '';

// 1. ELIMINAR TODOS LOS ASTERISCOS (negritas causan problemas)
mensaje = mensaje.replace(/\*/g, '');

// 2. CONVERTIR \n LITERAL A SALTO DE LÍNEA REAL
// El AI genera backslash+n como dos caracteres
const BACKSLASH = String.fromCharCode(92); // \
const LITERAL_N = BACKSLASH + 'n';

let intentos = 0;
while (mensaje.indexOf(LITERAL_N) !== -1 && intentos < 50) {
    mensaje = mensaje.split(LITERAL_N).join('\n');
    intentos++;
}

// 3. LIMPIAR EMOJIS ROTOS (unicode suelto)
// Eliminar surrogate pairs huérfanos
mensaje = mensaje.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '');
mensaje = mensaje.replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');

// Eliminar secuencias \uXXXX como texto
mensaje = mensaje.replace(/\\u[0-9a-fA-F]{4}/g, '');

// 4. REEMPLAZAR EMOJIS PROBLEMÁTICOS CON ALTERNATIVAS SIMPLES
const reemplazosEmoji = {
    '🍒': '→',  // Ciruela
    '🌽': '→',  // Mazorca  
    '🥑': '→',  // Aguacate
    '🛒': '(carrito)',
    '📦': '→',
    '💚': '',
    '😊': '',
    '✅': '(ok)',
    '📍': '→',
    '💳': '→',
    '🚚': '→',
    '🙌': '',
};

for (const [emoji, reemplazo] of Object.entries(reemplazosEmoji)) {
    mensaje = mensaje.split(emoji).join(reemplazo);
}

// 5. FORMATEAR LISTAS DE PRODUCTOS
// Convertir "• Producto" a "→ Producto" para mejor lectura
mensaje = mensaje.replace(/•/g, '→');

// 6. LIMPIAR ESPACIOS Y SALTOS EXCESIVOS
mensaje = mensaje.replace(/\n{3,}/g, '\n\n');
mensaje = mensaje.replace(/  +/g, ' ');
mensaje = mensaje.trim();

// 7. FALLBACK
if (!mensaje) {
    mensaje = 'Hola! En qué puedo ayudarte?';
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
        // Caption sin emojis ni asteriscos
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
