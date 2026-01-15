// =====================================================
// 📤 PREPARAR RESPUESTA v9 - CON FORMATO MEJORADO
// =====================================================
// Productos en negrita, totales en negrita, saltos de línea correctos
// =====================================================

const respuestaIA = $input.first().json.output || $input.first().json.text || '';
const contexto = $('4. Merge Datos + Productos').first().json;

// =====================================================
// 🔄 FILTRO ANTI-DUPLICADOS
// =====================================================

// CAPA 0: Detectar patrón repetido
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

// CAPA 1: Detectar texto mitad duplicado
function detectarMitadDuplicado(texto) {
    if (!texto || texto.length < 80) return texto;
    const cuarto = Math.floor(texto.length / 4);
    const inicioQ1 = texto.substring(0, cuarto).toLowerCase();
    const inicioQ3 = texto.substring(cuarto * 2, cuarto * 3).toLowerCase();
    if (inicioQ1.length > 20 && inicioQ3.includes(inicioQ1.substring(0, 20))) {
        return texto.substring(0, cuarto * 2).trim();
    }
    return texto;
}

// CAPA 2: Eliminar oraciones duplicadas
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

    // 1. CONVERSIÓN AGRESIVA de \n literal a salto de línea real
    // El AI genera diferentes variaciones que debemos manejar
    let formateado = texto;

    // Método 1: Regex para capturar backslash+n como texto
    formateado = formateado.replace(/\\n/g, '\n');

    // Método 2: Si aún hay literales, usar String.raw inverso
    if (formateado.includes('\\n')) {
        formateado = formateado.split(String.fromCharCode(92) + 'n').join('\n');
    }

    // Método 3: Manejar espacios alrededor de \n
    formateado = formateado.replace(/\s*\\n\s*/g, '\n');

    // Método 4: Windows/Mac line endings
    formateado = formateado.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Método 5: Último recurso - buscar patrones comunes del AI
    formateado = formateado.replace(/ \\n /g, '\n');
    formateado = formateado.replace(/\\n\\n/g, '\n\n');

    // 2. Poner productos en negrita (patrones comunes)
    // Patrón: "• Producto - $X.XXX" -> "• *Producto* - *$X.XXX*"
    formateado = formateado.replace(
        /•\s*([^-\n]+)\s*-\s*\$?([\d.,]+)/g,
        '• *$1* - *$$$2*'
    );

    // 3. Poner totales en negrita
    formateado = formateado.replace(
        /total[:\s]+\$?([\d.,]+)/gi,
        'Total: *$$$1*'
    );

    // 4. Poner TOTAL A PAGAR en negrita
    formateado = formateado.replace(
        /total\s+a\s+pagar[:\s]+\$?([\d.,]+)/gi,
        '*TOTAL A PAGAR: $$$1*'
    );

    // 5. Poner subtotal en negrita
    formateado = formateado.replace(
        /subtotal[:\s]+\$?([\d.,]+)/gi,
        'Subtotal: *$$$1*'
    );

    // 6. Poner envío en negrita
    formateado = formateado.replace(
        /env[ií]o[:\s]+\$?([\d.,]+)/gi,
        'Envío: *$$$1*'
    );

    // 7. Formatear listas de productos numeradas: "1. Producto - $X.XXX"
    formateado = formateado.replace(
        /(\d+)\.\s*([^-\n]+)\s*-\s*\$?([\d.,]+)/g,
        '$1. *$2* - *$$$3*'
    );

    // 8. Limpiar asteriscos duplicados
    formateado = formateado.replace(/\*\*+/g, '*');
    formateado = formateado.replace(/\*\s*\*/g, '');

    // 9. Limpiar múltiples saltos de línea
    formateado = formateado.replace(/\n{3,}/g, '\n\n');

    return formateado.trim();
}

// =====================================================
// 🔄 PROCESAMIENTO PRINCIPAL
// =====================================================

let mensaje = respuestaIA.replace(/\*\*/g, '*').replace(/\[functions\.[^\]]+\]/g, '').trim();
mensaje = detectarPatronRepetido(mensaje);
mensaje = detectarMitadDuplicado(mensaje);
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
