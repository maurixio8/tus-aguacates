// =====================================================
// 🧠 PRE-PROCESAMIENTO v7 - CON BOTONES INTERACTIVOS
// =====================================================
// Última actualización: 2025-12-21
// Copia este código en el nodo "1. Pre-procesamiento YCloud"
// =====================================================

const body = $input.item.json.body;
const whatsappMsg = body.whatsappInboundMessage;

// Extraer datos básicos (siempre, aunque sea media)
const from = (whatsappMsg?.from || '').replace('+', '');
const to = (whatsappMsg?.to || '').replace('+', '');
const customerName = whatsappMsg?.customerProfile?.name || 'Cliente';
const messageType = whatsappMsg?.type || 'unknown';

// Saludo según hora (COLOMBIA UTC-5)
const now = new Date();
const horaCol = new Date(now.getTime() - 5 * 60 * 60 * 1000).getHours();
let saludo;
if (horaCol < 12) saludo = 'Buenos días';
else if (horaCol < 19) saludo = 'Buenas tardes';
else saludo = 'Buenas noches';

// =====================================================
// NUEVO: DETECTAR RESPUESTAS DE BOTONES INTERACTIVOS
// =====================================================
let esRespuestaBoton = false;
let botonId = '';
let botonTexto = '';

if (messageType === 'interactive') {
    const interactive = whatsappMsg.interactive;
    if (interactive?.type === 'button_reply') {
        esRespuestaBoton = true;
        botonId = interactive.button_reply?.id || '';
        botonTexto = interactive.button_reply?.title || '';
    } else if (interactive?.type === 'list_reply') {
        esRespuestaBoton = true;
        botonId = interactive.list_reply?.id || '';
        botonTexto = interactive.list_reply?.title || '';
    }
}

// =====================================================
// MANEJO DE IMÁGENES Y MEDIA
// =====================================================
const esImagen = messageType === 'image';
const esDocumento = messageType === 'document';
const esAudio = messageType === 'audio';
const esVideo = messageType === 'video';
const esSticker = messageType === 'sticker';
const esMedia = esImagen || esDocumento || esAudio || esVideo || esSticker;

// Si es media, retornar con información útil para que el agente responda
if (esMedia) {
    const captionImagen = whatsappMsg?.image?.caption ||
        whatsappMsg?.document?.caption ||
        whatsappMsg?.video?.caption || '';

    let textoMedia = '[Mensaje multimedia]';
    if (esImagen) textoMedia = '[📸 Imagen recibida]';
    else if (esDocumento) textoMedia = '[📄 Documento recibido]';
    else if (esAudio) textoMedia = '[🎵 Audio recibido]';
    else if (esVideo) textoMedia = '[🎥 Video recibido]';
    else if (esSticker) textoMedia = '[😊 Sticker recibido]';

    return [{
        json: {
            from, to, customerName, saludo,
            esMediaNoSoportado: false,
            esMedia: true,
            esImagen, esDocumento, esAudio, esVideo, esSticker,
            tipoMensaje: messageType,
            messageText: textoMedia,
            captionImagen,
            esRespuestaBoton: false,
            botonId: '',
            botonTexto: '',
            esSoloSaludo: false,
            esPreguntaConversacional: false,
            debeHacerBusqueda: false,
            esPedidoPlataforma: false,
            infoPedidoPlataforma: null,
            tieneMultiplesProductos: false,
            terminosIndividuales: [],
            terminoBusqueda: '',
            terminoNormalizado: '',
            variantesBusqueda: [],
            terminosNormalizados: [],
            timestamp: whatsappMsg?.sendTime
        }
    }];
}

// =====================================================
// MANEJO DE RESPUESTAS DE BOTONES
// =====================================================
if (esRespuestaBoton) {
    return [{
        json: {
            from, to, customerName, saludo,
            esMediaNoSoportado: false,
            esMedia: false,
            tipoMensaje: 'interactive',
            messageText: botonTexto, // El texto del botón como mensaje
            esRespuestaBoton: true,
            botonId: botonId,
            botonTexto: botonTexto,
            esSoloSaludo: false,
            esPreguntaConversacional: false,
            debeHacerBusqueda: false,
            esPedidoPlataforma: false,
            infoPedidoPlataforma: null,
            tieneMultiplesProductos: false,
            terminosIndividuales: [],
            terminoBusqueda: '',
            terminoNormalizado: '',
            variantesBusqueda: [],
            terminosNormalizados: [],
            timestamp: whatsappMsg?.sendTime
        }
    }];
}

// =====================================================
// VALIDAR MENSAJE DE TEXTO
// =====================================================
if (!whatsappMsg || messageType !== 'text') {
    return [{
        json: {
            esMediaNoSoportado: true,
            from, to, customerName, saludo,
            tipoMensaje: messageType,
            messageText: '',
            esRespuestaBoton: false,
            botonId: '',
            botonTexto: ''
        }
    }];
}

// =====================================================
// A PARTIR DE AQUÍ: SOLO MENSAJES DE TEXTO
// =====================================================
const messageText = whatsappMsg.text?.body || '';
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
// =====================================================
const esPedidoPlataforma = [
    /acabo\s+de\s+hacer\s+un\s+pedido/i,
    /hice\s+un\s+pedido\s+en\s+(la\s+)?tienda/i,
    /tus-aguacates\.vercel\.app/i,
    /mi\s+pedido:.*\n.*total/is,
    /quedo\s+atent[oa]\s+a\s+la\s+confirmaci[oó]n/i
].some(p => p.test(messageText));

let infoPedidoPlataforma = null;
if (esPedidoPlataforma) {
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
// =====================================================
const esPreguntaConversacional = [
    /c[oó]mo\s+(veo|entro|accedo|visito|llego|abro)/i,
    /d[oó]nde\s+(est[aá]|queda|encuentro|veo)/i,
    /tienda\s+(en\s+)?l[ií]nea/i,
    /tienda\s+(online|virtual|web)/i,
    /ver\s+(la\s+)?tienda/i,
    /p[aá]gina\s+web/i,
    /\b(link|enlace|url)\b/i,
    /\bhorario/i,
    /a\s+qu[eé]\s+hora/i,
    /hasta\s+qu[eé]\s+hora/i,
    /\benv[ií]o/i,
    /\bentrega/i,
    /\bdomicilio/i,
    /hacen\s+env[ií]o/i,
    /zona\s+de\s+(cobertura|entrega)/i,
    /m[eé]todo(s)?\s+de\s+pago/i,
    /forma(s)?\s+de\s+pago/i,
    /aceptan\s+(tarjeta|nequi|daviplata|efectivo)/i,
    /puedo\s+pagar\s+con/i,
    /\bcontacto/i,
    /\bubicaci[oó]n/i,
    /\bdirecci[oó]n/i,
    /d[oó]nde\s+est[aá]n/i,
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
// =====================================================
const palabrasIgnorar = new Set([
    'saber', 'conocer', 'decir', 'informar', 'consultar', 'preguntar',
    'averiguar', 'entender', 'explicar', 'indicar',
    'ver', 'mostrar', 'enseñar', 'mirar', 'observar',
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'de', 'del', 'a', 'al', 'en', 'con', 'por', 'para', 'como', 'cómo',
    'sobre', 'sin', 'hacia', 'desde', 'entre',
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
    'agregar', 'añadir', 'poner', 'meter', 'agrega', 'agregame', 'agrégame',
    'llevar', 'llevo', 'lleva', 'llevamos',
    'comprar', 'compro', 'compra',
    'pedir', 'pedido', 'pido',
    'hola', 'buenos', 'buenas', 'días', 'dias', 'tardes', 'noches',
    'hey', 'oye', 'disculpa', 'perdón', 'perdon', 'perdone',
    'por', 'favor', 'porfavor', 'gracias', 'muchas',
    'me', 'te', 'se', 'nos', 'les', 'lo', 'la',
    'yo', 'tu', 'tú', 'usted', 'ustedes', 'nosotros',
    'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'eso',
    'algo', 'más', 'mas', 'otro', 'otra', 'otros', 'otras',
    'todo', 'todos', 'toda', 'todas',
    'también', 'tambien', 'además', 'ademas',
    'ser', 'sería', 'seria', 'son', 'es', 'era',
    'están', 'esta', 'está', 'estan',
    'puede', 'puedo', 'puedes', 'poder', 'podría',
    'bueno', 'buena', 'buenos', 'buenas',
    'mejor', 'mejores', 'peor', 'peores',
    'grande', 'pequeño', 'pequeña',
    'fresco', 'fresca', 'frescos', 'frescas',
    'uno', 'dos', 'tres', 'cuatro', 'cinco',
    'kilo', 'kilos', 'gramos', 'grs', 'libra', 'libras',
    'unidad', 'unidades', 'paquete', 'paquetes',
    'bandeja', 'bandejas', 'caja', 'cajas',
    'pero', 'aunque', 'entonces', 'pues', 'bueno', 'mira', 'oiga',
    'digame', 'dígame', 'cuéntame', 'cuentame', 'dime',
    'porfa', 'xfa', 'please', 'plz', 'plis',
    'okay', 'vale', 'listo', 'dale', 'aja', 'ajá',
    'solo', 'sólo', 'solamente', 'únicamente', 'unicamente',
    'siempre', 'nunca', 'ahora', 'después', 'despues', 'antes',
    'aquí', 'aqui', 'acá', 'aca', 'allá', 'alla', 'ahí', 'ahi'
]);

let terminoBusqueda = msgLower
    .replace(/[^\w\sáéíóúñü]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !palabrasIgnorar.has(w))
    .join(' ')
    .trim();

// =====================================================
// PASO 4: DETECTAR MÚLTIPLES PRODUCTOS
// =====================================================
const separadores = /\s+(?:y|o|,)\s+/gi;
const tieneMultiplesProductos = separadores.test(terminoBusqueda);

let terminosIndividuales = [];
if (tieneMultiplesProductos) {
    terminosIndividuales = terminoBusqueda
        .split(/\s*(?:y|o|,)\s*/gi)
        .map(t => t.trim())
        .filter(t => t.length > 0);
} else if (terminoBusqueda) {
    terminosIndividuales = [terminoBusqueda];
}

// =====================================================
// PASO 5: NORMALIZACIÓN DE PLURALES
// =====================================================
let terminoNormalizado = terminoBusqueda;
let variantesBusqueda = [];
let terminosNormalizados = [];

terminosIndividuales.forEach(termino => {
    const palabras = termino.split(' ');
    const palabrasNormalizadas = palabras.map(palabra => {
        if (palabra.endsWith('s') && palabra.length > 3) {
            return palabra.slice(0, -1);
        }
        if (palabra.endsWith('es') && palabra.length > 4) {
            return palabra.slice(0, -2);
        }
        return palabra;
    });
    terminosNormalizados.push(palabrasNormalizadas.join(' '));
});

terminoNormalizado = terminosNormalizados.join(' ');
variantesBusqueda = [...new Set([...terminosIndividuales, ...terminosNormalizados])];

// =====================================================
// PASO 6: DECISIÓN DE BÚSQUEDA
// =====================================================
const debeHacerBusqueda =
    !esSoloSaludo &&
    !esPreguntaConversacional &&
    terminoBusqueda.length > 0;

// =====================================================
// RESULTADO FINAL
// =====================================================
return [{
    json: {
        from, to, messageText, customerName, saludo,
        esMediaNoSoportado: false,
        esMedia: false,
        esImagen: false,
        esDocumento: false,
        esAudio: false,
        esVideo: false,
        esSticker: false,
        tipoMensaje: 'text',
        captionImagen: '',
        // NUEVO: Botones
        esRespuestaBoton: false,
        botonId: '',
        botonTexto: '',
        // Flags
        esSoloSaludo,
        esPreguntaConversacional,
        debeHacerBusqueda,
        esPedidoPlataforma,
        infoPedidoPlataforma,
        tieneMultiplesProductos,
        terminosIndividuales,
        terminosNormalizados,
        terminoBusqueda,
        terminoNormalizado,
        variantesBusqueda,
        timestamp: whatsappMsg.sendTime
    }
}];
