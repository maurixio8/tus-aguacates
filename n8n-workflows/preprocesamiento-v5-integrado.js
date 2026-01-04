// =====================================================
// 🧠 PRE-PROCESAMIENTO v5 - AGENTE INTEGRADO ROBUSTO
// =====================================================
// Última actualización: 2025-12-20
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
            tipoMensaje: whatsappMsg?.type || 'unknown',
            saludo: 'Hola'
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
// PASO 1: DETECTAR SALUDOS SIMPLES (NO BUSCAR)
// =====================================================
const esSoloSaludo = [
    /^hola[,!.\s]*$/i,
    /^buenos?\s+(d[ií]as?|tardes?|noches?)[,!.\s]*$/i,
    /^buenas[,!.\s]*$/i,
    /^hey[,!.\s]*$/i,
    /^qu[eé]\s+tal[,\?!.\s]*$/i,
    /^c[oó]mo\s+est[aá](s|n)?[,\?!.\s]*$/i,
    /^gracias[,!.\s]*$/i,
    /^ok[,!.\s]*$/i,
    /^s[ií][,!.\s]*$/i,
    /^no[,!.\s]*$/i,
    /^perfecto[,!.\s]*$/i,
    /^listo[,!.\s]*$/i,
    /^dale[,!.\s]*$/i,
    /^bien[,!.\s]*$/i
].some(p => p.test(msgLower));

// =====================================================
// PASO 1.5: DETECTAR PEDIDO DESDE PLATAFORMA ONLINE
// Cuando el cliente completó un pedido en la tienda
// y llega con el mensaje predefinido de WhatsApp
// =====================================================
const esPedidoPlataforma = [
    /acabo\s+de\s+hacer\s+un\s+pedido/i,
    /hice\s+un\s+pedido\s+en\s+(la\s+)?tienda/i,
    /tus-aguacates\.vercel\.app/i,
    /mi\s+pedido:.*\n.*total/is,
    /quedo\s+atent[oa]\s+a\s+la\s+confirmaci[oó]n/i
].some(p => p.test(messageText));

// Extraer información del pedido si viene de plataforma
let infoPedidoPlataforma = null;
if (esPedidoPlataforma) {
    // Intentar extraer el nombre del mensaje
    const nombreMatch = messageText.match(/me\s+llamo\s+(\w+)/i);
    const pagoMatch = messageText.match(/pago:\s*(.+?)(\n|$)/i);
    const totalMatch = messageText.match(/total:\s*\$?([\d,.]+)/i);

    infoPedidoPlataforma = {
        nombre: nombreMatch ? nombreMatch[1] : null,
        metodoPago: pagoMatch ? pagoMatch[1].trim() : null,
        total: totalMatch ? totalMatch[1] : null
    };
}

// =====================================================
// PASO 2: DETECTAR PREGUNTAS CONVERSACIONALES
// (tienda, horarios, envío, pago - NO buscar productos)
// =====================================================
const esPreguntaConversacional = [
    // Tienda online
    /c[oó]mo\s+(veo|entro|accedo|visito|llego|abro)/i,
    /d[oó]nde\s+(est[aá]|queda|encuentro|veo)/i,
    /tienda\s+(en\s+)?l[ií]nea/i,
    /tienda\s+(online|virtual|web)/i,
    /ver\s+(la\s+)?tienda/i,
    /p[aá]gina\s+web/i,
    /\b(link|enlace|url)\b/i,

    // Horarios
    /\bhorario/i,
    /a\s+qu[eé]\s+hora/i,
    /hasta\s+qu[eé]\s+hora/i,

    // Envío
    /\benv[ií]o/i,
    /\bentrega/i,
    /\bdomicilio/i,
    /hacen\s+env[ií]o/i,
    /zona\s+de\s+(cobertura|entrega)/i,

    // Pagos
    /m[eé]todo(s)?\s+de\s+pago/i,
    /forma(s)?\s+de\s+pago/i,
    /aceptan\s+(tarjeta|nequi|daviplata|efectivo)/i,
    /puedo\s+pagar\s+con/i,

    // Contacto/ubicación
    /\bcontacto/i,
    /\bubicaci[oó]n/i,
    /\bdirecci[oó]n/i,
    /d[oó]nde\s+est[aá]n/i,

    // Pedido actual
    /mi\s+pedido/i,
    /mi\s+carrito/i,
    /qu[eé]\s+llevo/i,
    /eso\s+es\s+todo/i,
    /total\s+(del\s+)?pedido/i,
    /cu[aá]nto\s+es\s+(el\s+)?total/i,
    /cu[aá]nto\s+te\s+debo/i
].some(p => p.test(msgLower));

// =====================================================
// PASO 3: EXTRACCIÓN DE TÉRMINO DE BÚSQUEDA
// Lista completa de palabras a ignorar
// =====================================================
const palabrasIgnorar = new Set([
    // VERBOS DE SOLICITUD DE INFORMACIÓN
    'saber', 'conocer', 'decir', 'informar', 'consultar', 'preguntar',
    'averiguar', 'entender', 'explicar', 'indicar',

    // VERBOS DE VISUALIZACIÓN
    'ver', 'mostrar', 'enseñar', 'mirar', 'observar',

    // ARTÍCULOS
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',

    // PREPOSICIONES
    'de', 'del', 'a', 'al', 'en', 'con', 'por', 'para', 'como', 'cómo',
    'sobre', 'sin', 'hacia', 'desde', 'entre',

    // VERBOS DE BÚSQUEDA/COMPRA
    'que', 'qué', 'cuanto', 'cuánto', 'cual', 'cuál',
    'vale', 'valen', 'cuesta', 'cuestan', 'costar', 'costaría',
    'precio', 'precios', 'costo', 'costos', 'valor', 'valores',
    'tienen', 'tienes', 'tiene', 'tener', 'tendrán', 'tendría',
    'hay', 'habrá', 'habría', 'haber',
    'busco', 'busca', 'buscando', 'buscar',
    'quiero', 'quiere', 'quieren', 'querer', 'quisiera', 'querría',
    'venden', 'vende', 'vender',
    'manejan', 'maneja', 'manejar',
    'ofrecen', 'ofrece', 'ofrecer',
    'necesito', 'necesita', 'necesitar',
    'dame', 'deme', 'das', 'dan', 'dar',
    'agregar', 'añadir', 'poner', 'meter', 'agrega', 'agregame', 'agrégame', 'agregale', 'añádeme', 'ponme', 'ponle',
    'llevar', 'llevo', 'lleva', 'llevamos',
    'comprar', 'compro', 'compra',
    'pedir', 'pedido', 'pido',

    // SALUDOS Y CORTESÍAS
    'hola', 'buenos', 'buenas', 'días', 'dias', 'tardes', 'noches',
    'hey', 'oye', 'disculpa', 'perdón', 'perdon', 'perdone',
    'por', 'favor', 'porfavor', 'gracias', 'muchas',

    // PRONOMBRES Y OTROS
    'me', 'te', 'se', 'nos', 'les', 'lo', 'la',
    'yo', 'tu', 'tú', 'usted', 'ustedes', 'nosotros',
    'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'eso',
    'algo', 'más', 'mas', 'otro', 'otra', 'otros', 'otras',
    'todo', 'todos', 'toda', 'todas',
    'también', 'tambien', 'además', 'ademas',
    'ser', 'sería', 'seria', 'son', 'es', 'era',
    'están', 'esta', 'está', 'estan',
    'puede', 'puedo', 'puedes', 'poder', 'podría', 'podrías', 'podríamos', 'pudiera', 'pueda', 'puedan',

    // ADJETIVOS COMUNES
    'bueno', 'buena', 'buenos', 'buenas',
    'mejor', 'mejores', 'peor', 'peores',
    'grande', 'pequeño', 'pequeña',
    'fresco', 'fresca', 'frescos', 'frescas',

    // CANTIDADES
    'uno', 'dos', 'tres', 'cuatro', 'cinco',
    'kilo', 'kilos', 'gramos', 'grs', 'libra', 'libras',
    'unidad', 'unidades', 'paquete', 'paquetes',
    'bandeja', 'bandejas', 'caja', 'cajas',

    // ⭐ CONECTORES Y MULETILLAS (NUEVO)
    'pero', 'aunque', 'entonces', 'pues', 'bueno', 'mira', 'oiga',
    'digame', 'dígame', 'cuéntame', 'cuentame', 'dime',
    'porfa', 'xfa', 'please', 'plz', 'plis',
    'okay', 'vale', 'listo', 'dale', 'aja', 'ajá',
    'mmm', 'ehh', 'eeh', 'umm', 'hmm',
    'solo', 'sólo', 'solamente', 'únicamente', 'unicamente',
    'realmente', 'exactamente', 'básicamente', 'basicamente',
    'obviamente', 'claramente', 'simplemente',
    'siempre', 'nunca', 'ahora', 'después', 'despues', 'antes',
    'aquí', 'aqui', 'acá', 'aca', 'allá', 'alla', 'ahí', 'ahi'
]);

// Extraer término de búsqueda limpio
let terminoBusqueda = msgLower
    .replace(/[^\w\sáéíóúñü]/g, '') // Quitar puntuación
    .split(/\s+/)
    .filter(w => w.length > 2 && !palabrasIgnorar.has(w))
    .join(' ')
    .trim();

// =====================================================
// PASO 4: DETECTAR MÚLTIPLES PRODUCTOS
// Separar "apio y cebolla" → ["apio", "cebolla"]
// =====================================================
// Detectar separadores: "y", "o", ","
const separadores = /\s+(?:y|o|,)\s+/gi;
const tieneMultiplesProductos = separadores.test(terminoBusqueda);

let terminosIndividuales = [];
if (tieneMultiplesProductos) {
    // Separar por "y", "o", ","
    terminosIndividuales = terminoBusqueda
        .split(/\s*(?:y|o|,)\s*/gi)
        .map(t => t.trim())
        .filter(t => t.length > 0);
} else if (terminoBusqueda) {
    terminosIndividuales = [terminoBusqueda];
}

// =====================================================
// PASO 5: NORMALIZACIÓN DE PLURALES
// Genera variantes para mejorar la búsqueda
// =====================================================
let terminoNormalizado = terminoBusqueda;
let variantesBusqueda = [];
let terminosNormalizados = [];

// Normalizar cada término individual
terminosIndividuales.forEach(termino => {
    const palabras = termino.split(' ');

    const palabrasNormalizadas = palabras.map(palabra => {
        // Si termina en 's', crear variante sin 's'
        if (palabra.endsWith('s') && palabra.length > 3) {
            const singular = palabra.slice(0, -1);
            return singular;
        }
        // Si termina en 'es', crear variante sin 'es'
        if (palabra.endsWith('es') && palabra.length > 4) {
            const singular = palabra.slice(0, -2);
            return singular;
        }
        return palabra;
    });

    terminosNormalizados.push(palabrasNormalizadas.join(' '));
});

// El término normalizado principal (para compatibilidad)
terminoNormalizado = terminosNormalizados.join(' ');
variantesBusqueda = [...new Set([...terminosIndividuales, ...terminosNormalizados])];

// =====================================================
// PASO 4: DECISIÓN DE BÚSQUEDA
// =====================================================
// NO buscar si:
// - Es solo saludo
// - Es pregunta conversacional
// - No hay término de búsqueda después de limpiar

const debeHacerBusqueda =
    !esSoloSaludo &&
    !esPreguntaConversacional &&
    terminoBusqueda.length > 0;

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
        // Datos del cliente
        from,
        to,
        messageText,
        customerName,
        saludo,

        // Flags de decisión
        esMediaNoSoportado: false,
        esSoloSaludo,
        esPreguntaConversacional,
        debeHacerBusqueda,

        // ⭐ NUEVO: Pedido desde plataforma online
        esPedidoPlataforma,           // true si es mensaje de checkout completado
        infoPedidoPlataforma,         // { nombre, metodoPago, total }

        // ⭐ NUEVO: Múltiples productos
        tieneMultiplesProductos,    // true si preguntó por 2+ productos
        terminosIndividuales,       // Array: ["apio", "cebolla"]
        terminosNormalizados,       // Array: ["apio", "cebolla"] (singulares)

        // Términos de búsqueda
        terminoBusqueda,            // Original: "apio cebolla"
        terminoNormalizado,         // Normalizado: "apio cebolla"
        variantesBusqueda,          // Array de variantes

        // Metadata
        timestamp: whatsappMsg.sendTime
    }
}];
