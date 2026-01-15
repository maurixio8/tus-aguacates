// =====================================================
// 🧠 PRE-PROCESAMIENTO v15 - CON BUFFER Y ESTADOS
// =====================================================
// Última actualización: 2026-01-10
// CAMBIOS:
// - Buffer de mensajes (30 segundos)
// - Auto-reset de COMPLETADO
// - Pausa en estado ESCALADO
// - Detección de esPedidoPlataforma para bypass de buffer
// =====================================================

const body = $input.item.json.body;
const whatsappMsg = body.whatsappInboundMessage;

// =====================================================
// 🛡️ DETECTAR MODO ADMIN/CLIENTE (MAURICIO)
// =====================================================
const NUMEROS_DIRECTOR = ['573203062007', '3203062007'];
const BUFFER_TIMEOUT_SECONDS = 30; // Configurable

const fromRaw = whatsappMsg?.from || '';
const fromNormalizado = fromRaw.replace(/[+\s-]/g, '');
const from = (whatsappMsg?.from || '').replace('+', '');
const to = (whatsappMsg?.to || '').replace('+', '');
const customerName = whatsappMsg?.customerProfile?.name || 'Cliente';
const messageType = whatsappMsg?.type || 'unknown';
const messageTextRaw = whatsappMsg?.text?.body || '';

// Saludo según hora (COLOMBIA UTC-5)
const now = new Date();
const horaCol = new Date(now.getTime() - 5 * 60 * 60 * 1000).getHours();
let saludo;
if (horaCol < 12) saludo = 'Buenos días';
else if (horaCol < 19) saludo = 'Buenas tardes';
else saludo = 'Buenas noches';

const esNumeroDirector = NUMEROS_DIRECTOR.some(num =>
    fromNormalizado === num || fromNormalizado.endsWith(num)
);

// =====================================================
// 🔄 PREFIJO: > para modo CLIENTE (pruebas)
// =====================================================
const mensajeEmpiezaConPrefijo = messageTextRaw.trim().startsWith('>');
const mensajeSinPrefijo = mensajeEmpiezaConPrefijo
    ? messageTextRaw.trim().substring(1).trim()
    : messageTextRaw;

// SI ES DIRECTOR SIN PREFIJO → MODO COPILOTO
if (esNumeroDirector && !mensajeEmpiezaConPrefijo) {
    const normalizedText = messageTextRaw.replace(/[^\d]/g, '');
    const phoneMatch = normalizedText.match(/(?:57)?(3\d{9})/);
    const telefono_objetivo = phoneMatch ? phoneMatch[1].replace(/^57/, '') : null;

    let nombre_extraido = null;
    const nombrePatterns = [
        /(?:a|al nombre)\s+["']?([A-Za-zÁ-ÿ\s]+?)["']?(?:\s|$)/i,
        /(?:nombre es|llama)\s+["']?([A-Za-zÁ-ÿ\s]+?)["']?(?:\s+y|\s*$)/i,
    ];
    for (const pattern of nombrePatterns) {
        const match = messageTextRaw.match(pattern);
        if (match && match[1]) {
            nombre_extraido = match[1].trim().replace(/\b(del|cliente|el|la)\b/gi, '').trim();
            if (nombre_extraido.length >= 2) break;
            else nombre_extraido = null;
        }
    }

    return [{
        json: {
            esComandoCopiloto: true,
            from, to, customerName, saludo,
            messageText: messageTextRaw,
            prompt: messageTextRaw,
            mensajeClienteActual: messageTextRaw,
            telefono_objetivo: telefono_objetivo,
            nombre_extraido: nombre_extraido,
            esMediaNoSoportado: false,
            esMedia: false,
            tipoMensaje: messageType,
            timestamp: whatsappMsg?.sendTime
        }
    }];
}

// =====================================================
// RESTO DEL CÓDIGO (CLIENTES NORMALES O DIRECTOR CON >)
// =====================================================
const messageText = esNumeroDirector && mensajeEmpiezaConPrefijo
    ? mensajeSinPrefijo
    : messageTextRaw;

// DETECTAR RESPUESTAS DE BOTONES INTERACTIVOS
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

// MANEJO DE IMÁGENES Y MEDIA
const esImagen = messageType === 'image';
const esDocumento = messageType === 'document';
const esAudio = messageType === 'audio';
const esVideo = messageType === 'video';
const esSticker = messageType === 'sticker';
const esMedia = esImagen || esDocumento || esAudio || esVideo || esSticker;

// =====================================================
// 🖼️ MEDIA: Procesar inmediatamente (sin buffer)
// =====================================================
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
            esComandoCopiloto: false,
            from, to, customerName, saludo,
            esMediaNoSoportado: false,
            esMedia: true,
            esImagen, esDocumento, esAudio, esVideo, esSticker,
            tipoMensaje: messageType,
            messageText: textoMedia,
            captionImagen,
            // ⚡ BYPASS BUFFER: Media se procesa inmediatamente
            debeUsarBuffer: false,
            esRespuestaBoton: false,
            botonId: '',
            botonTexto: '',
            productoIdDelBoton: null,
            accionBoton: '',
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

// MANEJO DE RESPUESTAS DE BOTONES
if (esRespuestaBoton) {
    let productoIdDelBoton = null;
    let accionBoton = 'otro';
    if (botonId.startsWith('agregar_producto_')) {
        productoIdDelBoton = parseInt(botonId.replace('agregar_producto_', ''));
        accionBoton = 'agregar';
    } else if (botonId.startsWith('ver_mas_producto_')) {
        productoIdDelBoton = parseInt(botonId.replace('ver_mas_producto_', ''));
        accionBoton = 'ver_mas';
    } else if (botonId === 'ver_carrito') {
        accionBoton = 'ver_carrito';
    } else if (botonId === 'completar_pedido') {
        accionBoton = 'completar_pedido';
    } else if (botonId === 'cancelar_pedido') {
        accionBoton = 'cancelar_pedido';
    }
    return [{
        json: {
            esComandoCopiloto: false,
            from, to, customerName, saludo,
            esMediaNoSoportado: false,
            esMedia: false,
            tipoMensaje: 'interactive',
            messageText: botonTexto,
            esRespuestaBoton: true,
            botonId: botonId,
            botonTexto: botonTexto,
            productoIdDelBoton: productoIdDelBoton,
            accionBoton: accionBoton,
            // ⚡ BYPASS BUFFER: Botones se procesan inmediatamente
            debeUsarBuffer: false,
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

// VALIDAR MENSAJE DE TEXTO
if (!whatsappMsg || messageType !== 'text') {
    return [{
        json: {
            esComandoCopiloto: false,
            esMediaNoSoportado: true,
            from, to, customerName, saludo,
            tipoMensaje: messageType,
            messageText: '',
            debeUsarBuffer: false,
            esRespuestaBoton: false,
            botonId: '',
            botonTexto: '',
            productoIdDelBoton: null,
            accionBoton: ''
        }
    }];
}

// A PARTIR DE AQUÍ: SOLO MENSAJES DE TEXTO NORMALES
const msgLower = messageText.toLowerCase().trim();

// =====================================================
// DETECTAR PEDIDO DESDE PLATAFORMA (BYPASS BUFFER)
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

// DETECTAR SALUDOS SIMPLES
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

// DETECTAR PREGUNTAS CONVERSACIONALES
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
// 🔤 EXTRACCIÓN DE TÉRMINO DE BÚSQUEDA
// =====================================================
const palabrasIgnorar = new Set([
    // Palabras de prueba
    'test', 'prueba', 'testing', 'probando', 'probar',
    // Preguntas
    'cuales', 'cuáles', 'cual', 'cuál', 'donde', 'dónde',
    'cuando', 'cuándo', 'porque', 'porqué', 'como', 'cómo',
    // Verbos comunes
    'poder', 'puedo', 'puedes', 'puede', 'podemos', 'pueden',
    'querer', 'quiero', 'quieres', 'quiere', 'queremos', 'quieren',
    'agregar', 'agrego', 'agregas', 'agrega', 'agregamos', 'agregan',
    'añadir', 'añado', 'añades', 'añade', 'añadimos', 'añaden',
    'dar', 'doy', 'das', 'da', 'damos', 'dan', 'dame', 'deme',
    'traer', 'traigo', 'traes', 'trae', 'traemos', 'traen',
    'enviar', 'envío', 'envías', 'envía', 'enviamos', 'envían',
    'tener', 'tengo', 'tienes', 'tiene', 'tenemos', 'tienen',
    'haber', 'hay', 'había', 'habrá', 'habría',
    'buscar', 'busco', 'buscas', 'busca', 'buscamos', 'buscan',
    'vender', 'vendo', 'vendes', 'vende', 'vendemos', 'venden',
    'necesitar', 'necesito', 'necesitas', 'necesita',
    'llevar', 'llevo', 'llevas', 'lleva', 'llevamos', 'llevan',
    'comprar', 'compro', 'compras', 'compra', 'compramos', 'compran',
    'pedir', 'pido', 'pides', 'pide', 'pedimos', 'piden',
    'ser', 'soy', 'eres', 'es', 'somos', 'son',
    'estar', 'estoy', 'estás', 'está', 'estamos', 'están',
    'ver', 'veo', 'ves', 've', 'vemos', 'ven',
    'mostrar', 'muestro', 'muestras', 'muestra',
    'saber', 'sé', 'sabes', 'sabe', 'sabemos', 'saben',
    // Artículos
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    // Pronombres
    'yo', 'tu', 'tú', 'usted', 'él', 'ella', 'nosotros', 'ustedes',
    'me', 'te', 'se', 'nos', 'les', 'lo',
    'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas',
    // Preposiciones
    'de', 'del', 'a', 'al', 'en', 'con', 'por', 'para',
    'sobre', 'sin', 'hacia', 'desde', 'entre', 'hasta',
    // Interrogativos
    'que', 'qué', 'cuanto', 'cuánto', 'cuanta', 'cuánta',
    // Precios
    'vale', 'valen', 'cuesta', 'cuestan', 'precio', 'precios',
    // Saludos
    'hola', 'buenos', 'buenas', 'días', 'dias', 'tardes', 'noches',
    // Cortesía
    'por', 'favor', 'porfavor', 'porfa', 'gracias', 'muchas',
    // Adjetivos
    'más', 'mas', 'menos', 'muy', 'mucho', 'mucha',
    'bueno', 'buena', 'mejor', 'mejores',
    'fresco', 'fresca', 'frescos', 'frescas',
    // Números
    'uno', 'dos', 'tres', 'cuatro', 'cinco',
    // Unidades
    'kilo', 'kilos', 'gramos', 'libra', 'libras',
    'unidad', 'unidades', 'paquete', 'paquetes',
    'bandeja', 'bandejas', 'caja', 'cajas',
    // Conectores
    'pero', 'aunque', 'entonces', 'pues',
    'okay', 'vale', 'listo', 'dale',
    // Tiempo/Lugar
    'solo', 'sólo', 'solamente',
    'ahora', 'después', 'antes',
    'aquí', 'aqui', 'acá', 'aca'
]);

let terminoBusqueda = msgLower
    .replace(/[^\w\sáéíóúñü]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !palabrasIgnorar.has(w))
    .join(' ')
    .trim();

// DETECTAR MÚLTIPLES PRODUCTOS
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

// NORMALIZACIÓN DE PLURALES
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

// DECISIÓN DE BÚSQUEDA
const debeHacerBusqueda =
    !esSoloSaludo &&
    !esPreguntaConversacional &&
    terminoBusqueda.length > 0;

// =====================================================
// 📦 DECISIÓN DE BUFFER
// =====================================================
// Usar buffer SOLO para mensajes de texto normales
// NO usar buffer para:
// - Media (fotos, documentos, etc.)
// - Botones
// - Pedidos de plataforma online
const debeUsarBuffer = !esMedia &&
    !esRespuestaBoton &&
    !esPedidoPlataforma &&
    messageType === 'text';

// =====================================================
// RESULTADO FINAL (CLIENTE NORMAL)
// =====================================================
return [{
    json: {
        esComandoCopiloto: false,
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
        esRespuestaBoton: false,
        botonId: '',
        botonTexto: '',
        productoIdDelBoton: null,
        accionBoton: '',
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
        // ⚡ NUEVO: Flag de buffer
        debeUsarBuffer,
        bufferTimeoutSeconds: BUFFER_TIMEOUT_SECONDS,
        timestamp: whatsappMsg.sendTime
    }
}];
