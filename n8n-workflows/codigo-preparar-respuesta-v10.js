// =====================================================
// 📤 PREPARAR RESPUESTA v10 - FIX SALTOS DE LÍNEA
// =====================================================
// Solución robusta para el problema de \n literal
// =====================================================

const respuestaIA = $input.first().json.output || $input.first().json.text || '';
const contexto = $('4. Merge Datos + Productos').first().json;

// =====================================================
// 🔧 FIX CRÍTICO: Convertir \n literal a salto real
// =====================================================

function fixLineBreaks(text) {
    if (!text) return text;

    let result = text;

    // El AI a veces genera la secuencia literal \n (dos caracteres: \ y n)
    // Necesitamos convertirla a un salto de línea real (código ASCII 10)

    // Crear el patrón: backslash (char 92) seguido de 'n'
    const literalBackslashN = String.fromCharCode(92) + 'n';

    // Reemplazar todas las ocurrencias
    while (result.includes(literalBackslashN)) {
        result = result.split(literalBackslashN).join('\n');
    }

    // También manejar variaciones con espacios
    result = result.replace(/\s+\n\s+/g, '\n');

    // Limpiar saltos de línea excesivos
    result = result.replace(/\n{3,}/g, '\n\n');

    return result;
}

// =====================================================
// 🔄 FILTRO ANTI-DUPLICADOS
// =====================================================

function detectarPatronRepetido(texto) {
    if (!texto || texto.length < 100) return texto;
    for (let len = 50; len < Math.min(500, texto.length / 2); len += 10) {
        const patron = texto.substring(0, len);
        const regex = new RegExp(patron.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = texto.match(regex);
        if (matches && matches.length >= 2) {
            const finPatron = texto.indexOf('🍏') > 0 ? texto.indexOf('🍏') + 2 :
                texto.indexOf('🥑') > 0 ? texto.indexOf('🥑') + 2 :
                    texto.indexOf('?') > 0 ? texto.indexOf('?') + 1 :
                        texto.indexOf('!') > 0 ? texto.indexOf('!') + 1 :
                            texto.indexOf('.', 50) > 0 ? texto.indexOf('.', 50) + 1 : len;
            return texto.substring(0, finPatron).trim();
        }
    }
    return texto;
}

function eliminarDuplicados(texto) {
    if (!texto) return texto;
    const partes = texto.split(/(?<=[🍏🥑😊💚🛒📦.!?\n])\s*/);
    const vistos = new Set();
    const unicos = [];
    for (const p of partes) {
        const norm = p.trim().toLowerCase().replace(/\s+/g, ' ');
        if (norm.length < 5) { unicos.push(p); continue; }
        if (!vistos.has(norm)) {
            vistos.add(norm);
            unicos.push(p.trim());
        }
    }
    return unicos.join(' ').replace(/\s+/g, ' ').trim();
}

// =====================================================
// ✨ FORMATO MEJORADO
// =====================================================

function formatearMensaje(texto) {
    if (!texto) return texto;

    let formateado = texto;

    // Poner productos en negrita
    formateado = formateado.replace(
        /•\s*([^-\n]+)\s*-\s*\$?([\d.,]+)/g,
        '• *$1* - *$$$2*'
    );

    // Poner totales en negrita
    formateado = formateado.replace(
        /total[:\s]+\$?([\d.,]+)/gi,
        'Total: *$$$1*'
    );

    // Limpiar asteriscos duplicados
    formateado = formateado.replace(/\*\*+/g, '*');
    formateado = formateado.replace(/\*\s*\*/g, '');

    return formateado.trim();
}

// =====================================================
// 🔄 PROCESAMIENTO PRINCIPAL
// =====================================================

let mensaje = respuestaIA
    .replace(/\*\*/g, '*')
    .replace(/\[functions\.[^\]]+\]/g, '')
    .trim();

// PASO CRÍTICO: Arreglar saltos de línea PRIMERO
mensaje = fixLineBreaks(mensaje);

// Luego aplicar otros filtros
mensaje = detectarPatronRepetido(mensaje);
mensaje = eliminarDuplicados(mensaje);
mensaje = formatearMensaje(mensaje);

if (!mensaje) mensaje = '¡Hola! 🥑 ¿En qué puedo ayudarte?';

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
                caption: '🥑 *' + img.nombre + '* - *$' + Number(img.precio).toLocaleString('es-CO') + '*'
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
