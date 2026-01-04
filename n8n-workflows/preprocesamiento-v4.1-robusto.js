// =====================================================
// 🧠 PRE-PROCESAMIENTO v4.1 - DETECCIÓN ROBUSTA
// =====================================================
// Copia este código en el nodo "1. Pre-procesamiento YCloud"
// =====================================================

const body = $input.item.json.body;
const whatsappMsg = body.whatsappInboundMessage;

// Validar mensaje de texto
if (!whatsappMsg || whatsappMsg.type !== 'text') {
    return [{
        json: {
            esMediaNoSoportado: true,
            from: (whatsappMsg?.from || '').replace('+', ''),
            to: (whatsappMsg?.to || '').replace('+', ''),
            tipoMensaje: whatsappMsg?.type || 'unknown'
        }
    }];
}

// Extraer datos básicos
const from = whatsappMsg.from.replace('+', '');
const to = whatsappMsg.to.replace('+', '');
const messageText = whatsappMsg.text?.body || '';
const customerName = whatsappMsg.customerProfile?.name || 'Cliente';
const msgLower = messageText.toLowerCase().trim();

// =====================================================
// MÉTODO 1: PATRONES DE PREGUNTAS/VERBOS (AMPLIADOS)
// =====================================================
const patronesPrecio = [
    /qu[eé]\s+(vale|cuesta|precio)/i,
    /cu[aá]nto\s+(vale|cuesta|es|ser[ií]a|me\s+sale|costar[ií]a)/i,
    /cu[aá]l\s+es\s+el\s+precio/i,
    /a\s+c[oó]mo\s+(est[aá]|el|la|los|las)?/i,
    /precio\s+(de|del)/i,
    /\bprecio\b/i,
    /\bcosto\b/i,
    /\bvalor\s+de\b/i
];

const patronesDisponibilidad = [
    /\btien(e|es|en)\b/i,
    /\bhay\b/i,
    /\bhabr[aá]\b/i,
    /\bvend(e|es|en)\b/i,
    /\bmaneja(n|s)?\b/i,
    /\bqueda(n)?\b/i,
    /\bdisponible\b/i,
    /\bofrece(n|s)?\b/i
];

const patronesCompra = [
    /\bquier(o|e|es|a)\b/i,
    /\bquisiera\b/i,
    /\bme\s+gust(a|ar[ií]a)\b/i,
    /\bdam(e|a)\b/i,
    /\bdem(e|a)\b/i,
    /\bme\s+da(s)?\b/i,
    /\bnecesit(o|a|amos)\b/i,
    /\bbusc(o|a|ando)\b/i,
    /\bagrega(r)?\b/i,
    /\ba[ñn]ad(e|ir)\b/i,
    /\bponer\b/i,
    /\bped(ir|ido)\b/i,
    /\bcompra(r)?\b/i,
    /\bllev(o|ar|a)\b/i
];

const patronesInformacion = [
    /\bmu[eé]stra(me)?\b/i,
    /\bens[eé][ñn]a(me)?\b/i,
    /\bqu[eé]\s+(tipo|opciones|variedades)/i,
    /\binfo(rmaci[oó]n)?\s+(de|sobre)\b/i
];

const tienePatronPregunta = [
    ...patronesPrecio,
    ...patronesDisponibilidad,
    ...patronesCompra,
    ...patronesInformacion
].some(p => p.test(msgLower));

// =====================================================
// MÉTODO 2: CATEGORÍAS Y PRODUCTOS CONOCIDOS
// =====================================================
const categoriasConocidas = [
    // Categorías principales
    'aguacate', 'aguacates', 'hass',
    'fresa', 'fresas', 'frutilla',
    'mango', 'mangos',
    'cereza', 'cerezas',
    'ar[aá]ndano', 'ar[aá]ndanos', 'blueberr',
    'mora', 'moras',
    'uva', 'uvas',
    'kiwi', 'kiwis',
    'naranja', 'naranjas',
    'lim[oó]n', 'limones',
    'manzana', 'manzanas',
    'banano', 'bananos', 'pl[aá]tano',
    'coco', 'cocos',
    'papaya', 'papayas',
    'pi[ñn]a', 'pi[ñn]as',
    'tomate', 'tomates', 'cherry',
    'maracuy[aá]', 'gulupa', 'granadilla',
    'pitahaya', 'pitaya', 'dragon',

    // Aromáticas y especias
    'albahaca', 'menta', 'cilantro', 'perejil',
    'romero', 'tomillo', 'or[eé]gano', 'laurel',
    'canela', 'jengibre', 'c[uú]rcuma', 'pimienta',

    // Saludables
    'miel', 'polen', 'prop[oó]leo',

    // Gourmet
    'gourmet', 'premium', 'especial',
    'caja', 'combo', 'pack', 'kit',
    'bandeja', 'canasta',

    // Desgranados
    'desgranado', 'desgranada', 'pelado',

    // Navidad
    'navidad', 'navide[ñn]o'
];

// Convertir a expresiones regulares
const regexCategorias = categoriasConocidas.map(c => new RegExp(`\\b${c}`, 'i'));
const tieneProductoConocido = regexCategorias.some(r => r.test(msgLower));

// =====================================================
// MÉTODO 3: FALLBACK - NO ES SOLO SALUDO
// =====================================================
const soloSaludos = [
    /^hola$/i,
    /^hola[,!.\s]*$/i,
    /^buenos?\s+(d[ií]as?|tardes?|noches?)[,!.\s]*$/i,
    /^buenas[,!.\s]*$/i,
    /^hey[,!.\s]*$/i,
    /^qu[eé]\s+tal[,!.\s]*$/i,
    /^c[oó]mo\s+est[aá](s|n)?[,\?!.\s]*$/i,
    /^gracias[,!.\s]*$/i,
    /^ok[,!.\s]*$/i,
    /^s[ií][,!.\s]*$/i,
    /^no[,!.\s]*$/i,
    /^perfecto[,!.\s]*$/i,
    /^listo[,!.\s]*$/i,
    /^eso\s+es\s+todo[,!.\s]*$/i,
    /^nada\s+m[aá]s[,!.\s]*$/i
];

const esSoloSaludo = soloSaludos.some(p => p.test(msgLower));
const tieneMasDePalabras = msgLower.split(/\s+/).length > 1;

// =====================================================
// DECISIÓN FINAL: ¿ES INTENTO DE BÚSQUEDA?
// =====================================================
// Activar búsqueda si:
// 1. Tiene patrón de pregunta/verbo de compra, O
// 2. Menciona un producto/categoría conocida, O
// 3. Tiene más de 1 palabra y NO es solo un saludo
const esIntentoBusqueda =
    tienePatronPregunta ||
    tieneProductoConocido ||
    (tieneMasDePalabras && !esSoloSaludo);

// =====================================================
// EXTRACCIÓN DEL TÉRMINO DE BÚSQUEDA
// =====================================================
const palabrasIgnorar = new Set([
    // Artículos
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    // Preposiciones
    'de', 'del', 'a', 'al', 'en', 'con', 'por', 'para',
    // Verbos comunes
    'que', 'qué', 'cuanto', 'cuánto', 'cual', 'cuál',
    'vale', 'valen', 'cuesta', 'cuestan', 'precio', 'costo',
    'tienen', 'tienes', 'tiene', 'hay', 'habrá',
    'busco', 'busca', 'buscando', 'quiero', 'quiere', 'quisiera',
    'venden', 'vende', 'manejan', 'ofrecen', 'ofrece',
    'necesito', 'necesita', 'dame', 'deme', 'das', 'da',
    'agregar', 'añadir', 'poner', 'llevar', 'llevo',
    'comprar', 'compro', 'pedir', 'pedido',
    // Saludos
    'hola', 'buenos', 'buenas', 'días', 'tardes', 'noches',
    'hey', 'oye', 'disculpa', 'perdón',
    // Cortesías
    'por', 'favor', 'porfavor', 'gracias', 'muchas',
    // Otros
    'como', 'cómo', 'está', 'esta', 'estan', 'están',
    'ser', 'sería', 'serian', 'saber', 'decir', 'puedo', 'puedes',
    'algo', 'más', 'mas', 'otro', 'otra', 'otros', 'otras',
    'todo', 'todos', 'ese', 'eso', 'esa'
]);

const terminoBusqueda = msgLower
    .replace(/[^\w\sáéíóúñü]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !palabrasIgnorar.has(w))
    .join(' ')
    .trim();

// =====================================================
// SALUDO SEGÚN HORA (COLOMBIA UTC-5)
// =====================================================
const now = new Date();
const horaCol = new Date(now.getTime() - 5 * 60 * 60 * 1000).getHours();
let saludo;
if (horaCol < 12) saludo = 'Buenos días';
else if (horaCol < 19) saludo = 'Buenas tardes';
else saludo = 'Buenas noches';

// =====================================================
// RESULTADO
// =====================================================
return [{
    json: {
        from,
        to,
        messageText,
        customerName,
        saludo,
        esMediaNoSoportado: false,
        esIntentoBusqueda,
        terminoBusqueda,
        // Debug info (puedes eliminar después)
        _debug: {
            tienePatronPregunta,
            tieneProductoConocido,
            tieneMasDePalabras,
            esSoloSaludo
        },
        timestamp: whatsappMsg.sendTime
    }
}];
