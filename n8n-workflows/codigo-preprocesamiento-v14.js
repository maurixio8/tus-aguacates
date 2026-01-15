// =====================================================
// 🧠 PRE-PROCESAMIENTO v14 - FILTRO ENRIQUECIDO
// =====================================================
// Última actualización: 2026-01-10
// MEJORAS: Lista completa de palabras a ignorar
// =====================================================

const body = $input.item.json.body;
const whatsappMsg = body.whatsappInboundMessage;

// =====================================================
// 🛡️ DETECTAR MODO ADMIN/CLIENTE (MAURICIO)
// =====================================================
const NUMEROS_DIRECTOR = ['573203062007', '3203062007'];

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
// 🔄 PREFIJO: > para modo CLIENTE
// =====================================================
const mensajeEmpiezaConPrefijo = messageTextRaw.trim().startsWith('>');
const mensajeSinPrefijo = mensajeEmpiezaConPrefijo
    ? messageTextRaw.trim().substring(1).trim()
    : messageTextRaw;

// SI ES DIRECTOR
if (esNumeroDirector) {
    if (mensajeEmpiezaConPrefijo) {
        // Continúa como cliente
    } else {
        // MODO COPILOTO
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

// DETECTAR PEDIDO DESDE PLATAFORMA
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
// 🔤 EXTRACCIÓN DE TÉRMINO DE BÚSQUEDA - v14 ENRIQUECIDO
// =====================================================
const palabrasIgnorar = new Set([
    // === PALABRAS DE PRUEBA ===
    'test', 'prueba', 'testing', 'probando', 'probar',

    // === PALABRAS DE VARIANTES/PRESENTACIONES (NUEVAS) ===
    'presentaciones', 'presentación', 'presentacion',
    'variantes', 'variante', 'variedad', 'variedades',
    'tamaño', 'tamaños', 'tamano', 'tamanos',
    'peso', 'pesos', 'gramaje', 'gramos',
    'viene', 'vienen', 'vienes', 'venir',
    'disponible', 'disponibles',
    'opciones', 'opción', 'opcion',

    // === PREGUNTAS ===
    'cuales', 'cuáles', 'cual', 'cuál', 'donde', 'dónde',
    'cuando', 'cuándo', 'porque', 'porqué', 'como', 'cómo',

    // === VERBOS PODER (todas conjugaciones) ===
    'poder', 'puedo', 'puedes', 'puede', 'podemos', 'pueden',
    'podría', 'podrías', 'podríamos', 'podrían',
    'pudiera', 'pudieras', 'pudieran', 'pude', 'pudiste',

    // === VERBOS QUERER (todas conjugaciones) ===
    'querer', 'quiero', 'quieres', 'quiere', 'queremos', 'quieren',
    'quisiera', 'quisieras', 'quisieran', 'quisiéramos',
    'querría', 'querrías', 'querríamos', 'querrían',

    // === VERBOS AGREGAR/AÑADIR (todas conjugaciones) ===
    'agregar', 'agrego', 'agregas', 'agrega', 'agregamos', 'agregan',
    'agregame', 'agrégame', 'agregarme', 'agregarle', 'agregale', 'agrégale',
    'añadir', 'añado', 'añades', 'añade', 'añadimos', 'añaden',
    'añademe', 'añádeme', 'añadirme', 'añadirle',

    // === VERBOS DAR (todas conjugaciones) ===
    'dar', 'doy', 'das', 'da', 'damos', 'dan',
    'dame', 'deme', 'darme', 'darle', 'dámelo', 'démelo',
    'dándome', 'dándole',

    // === VERBOS TRAER/ENVIAR ===
    'traer', 'traigo', 'traes', 'trae', 'traemos', 'traen',
    'traeme', 'tráeme', 'traerme', 'traerle',
    'enviar', 'envío', 'envías', 'envía', 'enviamos', 'envían',
    'enviame', 'envíame', 'enviarme', 'enviarle',

    // === VERBOS PONER/METER ===
    'poner', 'pongo', 'pones', 'pone', 'ponemos', 'ponen',
    'ponme', 'ponle', 'ponerme', 'ponerle',
    'meter', 'meto', 'metes', 'mete', 'metemos', 'meten',
    'meteme', 'meterme', 'meterle',

    // === VERBOS CONSEGUIR ===
    'conseguir', 'consigo', 'consigues', 'consigue', 'conseguimos', 'consiguen',
    'conseguirme', 'conseguirle',

    // === VERBOS TENER/HABER ===
    'tener', 'tengo', 'tienes', 'tiene', 'tenemos', 'tienen',
    'tendría', 'tendrías', 'tendríamos', 'tendrían', 'tendrán',
    'haber', 'hay', 'había', 'habrá', 'habría',

    // === VERBOS BUSCAR ===
    'buscar', 'busco', 'buscas', 'busca', 'buscamos', 'buscan',
    'buscando', 'búscame', 'buscarme',

    // === VERBOS VENDER/MANEJAR ===
    'vender', 'vendo', 'vendes', 'vende', 'vendemos', 'venden',
    'manejar', 'manejo', 'manejas', 'maneja', 'manejamos', 'manejan',
    'ofrecer', 'ofrezco', 'ofreces', 'ofrece', 'ofrecemos', 'ofrecen',

    // === VERBOS NECESITAR ===
    'necesitar', 'necesito', 'necesitas', 'necesita', 'necesitamos', 'necesitan',

    // === VERBOS LLEVAR/COMPRAR/PEDIR ===
    'llevar', 'llevo', 'llevas', 'lleva', 'llevamos', 'llevan',
    'comprar', 'compro', 'compras', 'compra', 'compramos', 'compran',
    'pedir', 'pido', 'pides', 'pide', 'pedimos', 'piden', 'pedido',

    // === VERBOS SER/ESTAR ===
    'ser', 'soy', 'eres', 'es', 'somos', 'son', 'era', 'fue',
    'sería', 'serías', 'seríamos', 'serían',
    'estar', 'estoy', 'estás', 'está', 'estamos', 'están',
    'estaría', 'estarías', 'estaríamos', 'estarían',

    // === VERBOS VER/MOSTRAR ===
    'ver', 'veo', 'ves', 've', 'vemos', 'ven',
    'mostrar', 'muestro', 'muestras', 'muestra', 'mostramos', 'muestran',
    'enseñar', 'enseño', 'enseñas', 'enseña', 'enseñamos', 'enseñan',
    'mirar', 'miro', 'miras', 'mira', 'miramos', 'miran',

    // === VERBOS SABER/CONOCER ===
    'saber', 'sé', 'sabes', 'sabe', 'sabemos', 'saben',
    'conocer', 'conozco', 'conoces', 'conoce', 'conocemos', 'conocen',
    'decir', 'digo', 'dices', 'dice', 'decimos', 'dicen',
    'informar', 'consultar', 'preguntar', 'averiguar', 'entender', 'explicar',

    // === ARTÍCULOS ===
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',

    // === PRONOMBRES DEMOSTRATIVOS ===
    'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'eso',
    'aquel', 'aquella', 'aquellos', 'aquellas',

    // === PRONOMBRES INDEFINIDOS ===
    'alguno', 'alguna', 'algunos', 'algunas', 'algo',
    'ninguno', 'ninguna', 'ningunos', 'ningunas', 'nada',
    'otro', 'otra', 'otros', 'otras',
    'todo', 'toda', 'todos', 'todas',
    'cualquier', 'cualquiera', 'cualesquiera',

    // === PRONOMBRES PERSONALES ===
    'yo', 'tu', 'tú', 'usted', 'él', 'ella', 'nosotros', 'ustedes', 'ellos', 'ellas',
    'me', 'te', 'se', 'nos', 'les', 'lo', 'la',

    // === PREPOSICIONES ===
    'de', 'del', 'a', 'al', 'en', 'con', 'por', 'para',
    'sobre', 'sin', 'hacia', 'desde', 'entre', 'hasta', 'según',

    // === INTERROGATIVOS ===
    'que', 'qué', 'cuanto', 'cuánto', 'cuanta', 'cuánta',
    'cuantos', 'cuántos', 'cuantas', 'cuántas',

    // === PRECIOS ===
    'vale', 'valen', 'cuesta', 'cuestan', 'costar', 'costaría',
    'precio', 'precios', 'costo', 'costos', 'valor', 'valores',

    // === SALUDOS ===
    'hola', 'buenos', 'buenas', 'días', 'dias', 'tardes', 'noches',
    'hey', 'oye', 'oiga', 'disculpa', 'disculpe', 'perdón', 'perdon', 'perdone',

    // === CORTESÍA ===
    'por', 'favor', 'porfavor', 'porfa', 'xfa', 'please', 'plz', 'plis',
    'gracias', 'muchas', 'mil',

    // === ADJETIVOS/ADVERBIOS ===
    'más', 'mas', 'menos', 'muy', 'mucho', 'mucha', 'muchos', 'muchas',
    'poco', 'poca', 'pocos', 'pocas',
    'también', 'tambien', 'además', 'ademas', 'incluso',
    'bueno', 'buena', 'buenos', 'buenas',
    'mejor', 'mejores', 'peor', 'peores',
    'grande', 'pequeño', 'pequeña',
    'fresco', 'fresca', 'frescos', 'frescas',

    // === NÚMEROS ===
    'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
    'primero', 'segundo', 'tercero',

    // === UNIDADES ===
    'kilo', 'kilos', 'gramos', 'grs', 'libra', 'libras',
    'unidad', 'unidades', 'paquete', 'paquetes',
    'bandeja', 'bandejas', 'caja', 'cajas',

    // === CONECTORES ===
    'pero', 'aunque', 'entonces', 'pues', 'bueno', 'mira', 'oiga',
    'digame', 'dígame', 'cuéntame', 'cuentame', 'dime',
    'okay', 'vale', 'listo', 'dale', 'aja', 'ajá',

    // === ADVERBIOS TIEMPO/LUGAR ===
    'solo', 'sólo', 'solamente', 'únicamente', 'unicamente',
    'siempre', 'nunca', 'ahora', 'después', 'despues', 'antes',
    'aquí', 'aqui', 'acá', 'aca', 'allá', 'alla', 'ahí', 'ahi',
    'hoy', 'mañana', 'ayer', 'pronto', 'luego', 'ya'
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

// RESULTADO FINAL (CLIENTE NORMAL)
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
        timestamp: whatsappMsg.sendTime
    }
}];
