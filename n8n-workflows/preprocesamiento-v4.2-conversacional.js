// =====================================================
// 🧠 PRE-PROCESAMIENTO v4.2 - CONVERSACIONAL + ROBUSTA
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
// 🚫 PASO 0: DETECTAR PREGUNTAS CONVERSACIONALES
// (No son búsqueda de productos)
// =====================================================
const preguntasConversacionales = [
    // Tienda online / web
    /c[oó]mo\s+(veo|entro|accedo|visito|llego|abro)/i,
    /d[oó]nde\s+(est[aá]|queda|encuentro|veo)/i,
    /cu[aá]l\s+es\s+(la|el|tu)\s+(p[aá]gina|sitio|web|link|tienda)/i,
    /tienda\s+(en\s+)?l[ií]nea/i,
    /tienda\s+(online|virtual|web)/i,
    /sitio\s+web/i,
    /p[aá]gina\s+web/i,
    /\b(link|enlace|url)\b/i,
    /ver\s+(la\s+)?tienda/i,
    /visitar\s+(la\s+)?tienda/i,

    // Horarios
    /\bhorario/i,
    /\bhora\s+de\s+(atenci[oó]n|apertura|cierre)/i,
    /\babierto/i,
    /\bcerrado/i,
    /a\s+qu[eé]\s+hora/i,
    /hasta\s+qu[eé]\s+hora/i,

    // Envío y entrega
    /\benv[ií]o/i,
    /\bentrega/i,
    /\bdomicilio/i,
    /\bdespacho/i,
    /hacen\s+env[ií]o/i,
    /llegan\s+a/i,
    /entregan\s+en/i,
    /zona\s+de\s+(cobertura|entrega)/i,

    // Pagos
    /\bpago\b/i,
    /\bpagar\b/i,
    /m[eé]todo(s)?\s+de\s+pago/i,
    /forma(s)?\s+de\s+pago/i,
    /aceptan\s+(tarjeta|nequi|daviplata|efectivo|transferencia)/i,
    /puedo\s+pagar\s+con/i,

    // Contacto
    /\bcontacto/i,
    /\btel[eé]fono/i,
    /\bwhatsapp/i,
    /\bcorreo/i,
    /\bemail/i,
    /c[oó]mo\s+(los|te|les)\s+contacto/i,

    // Ubicación
    /\bubicaci[oó]n/i,
    /\bdirecci[oó]n/i,
    /d[oó]nde\s+est[aá]n/i,
    /d[oó]nde\s+quedan/i,

    // Información general
    /qui[eé]n(es)?\s+son/i,
    /qu[eé]\s+es\s+tus\s+aguacates/i,
    /informaci[oó]n\s+(de|sobre|del|general)/i,
    /cu[eé]ntame\s+(de|sobre)/i,

    // Ayuda
    /\bayuda\b/i,
    /c[oó]mo\s+funciona/i,
    /c[oó]mo\s+puedo/i,
    /qu[eé]\s+puedo\s+hacer/i,

    // Pedido actual / carrito
    /mi\s+pedido/i,
    /mi\s+carrito/i,
    /qu[eé]\s+llevo/i,
    /qu[eé]\s+tengo/i,
    /ver\s+mi\s+pedido/i,
    /estado\s+de(l)?\s+pedido/i,

    // Finalización
    /eso\s+es\s+todo/i,
    /ya\s+no\s+m[aá]s/i,
    /finalizar/i,
    /terminar/i,
    /confirmar\s+pedido/i,
    /total\s+(del\s+)?pedido/i,
    /cu[aá]nto\s+es\s+(el\s+)?total/i,
    /cu[aá]nto\s+ser[ií]a/i,
    /cu[aá]nto\s+te\s+debo/i
];

const esPreguntaConversacional = preguntasConversacionales.some(p => p.test(msgLower));

// =====================================================
// MÉTODO 1: PATRONES DE PREGUNTAS DE PRODUCTOS
// =====================================================
const patronesPrecio = [
    /qu[eé]\s+(vale|cuesta|precio)/i,
    /cu[aá]nto\s+(vale|cuesta|es|me\s+sale)/i,
    /a\s+c[oó]mo\s+(est[aá]|el|la|los|las)/i,
    /precio\s+(de|del)/i,
    /\bcosto\s+de/i
];

const patronesDisponibilidad = [
    /\btien(e|es|en)\s+\w+/i,  // Requiere palabra después
    /\bhay\s+\w+/i,
    /\bvend(e|es|en)\s+\w+/i
];

const patronesCompra = [
    /\bquier(o|e)\s+\w+/i,
    /\bquisiera\s+\w+/i,
    /\bdam(e|a)\s+\w+/i,
    /\bnecesit(o|a)\s+\w+/i,
    /\bbusc(o|a|ando)\s+\w+/i,
    /\bagrega(r|me)?\s+\w+/i,
    /\ba[ñn]ad(e|ir)\s+\w+/i,
    /\bllev(o|ar)\s+\w+/i
];

const tienePatronProducto = [
    ...patronesPrecio,
    ...patronesDisponibilidad,
    ...patronesCompra
].some(p => p.test(msgLower));

// =====================================================
// MÉTODO 2: NOMBRES DE PRODUCTOS/FRUTAS CONOCIDAS
// =====================================================
const productosConocidos = [
    // Aguacates (producto estrella)
    /\baguacate/i, /\bhass\b/i, /\bpapelillo/i,

    // Frutas tropicales
    /\bmango/i, /\bpapaya/i, /\bpi[ñn]a/i, /\bbanano/i, /\bpl[aá]tano/i,
    /\bcoco/i, /\bmaracuy[aá]/i, /\bgulupa/i, /\bgranadilla/i,
    /\bpitahaya/i, /\bpitaya/i, /\blulo/i, /\bguayaba/i,
    /\bguanabana/i, /\bguanábana/i, /\btamarindo/i, /\bborojó/i,

    // Frutos rojos
    /\bfresa/i, /\bfrutilla/i, /\bcereza/i, /\bmora/i,
    /\bar[aá]ndano/i, /\bblueberr/i, /\bframbuesa/i,

    // Frutas comunes
    /\bnaranja/i, /\blim[oó]n/i, /\bmandarina/i, /\btoronja/i,
    /\bmanzana/i, /\bpera/i, /\bdurazno/i, /\bmelocot[oó]n/i,
    /\bkiwi/i, /\buva/i, /\bciruela/i, /\bsand[ií]a/i, /\bmel[oó]n/i,

    // Tomates y vegetales
    /\btomate/i, /\bcherry\b/i, /\bchonto/i, /\bpimentón/i,

    // Aromáticas
    /\balbahaca/i, /\bmenta/i, /\bcilantro/i, /\bperejil/i,
    /\bromero/i, /\btomillo/i, /\bor[eé]gano/i, /\blaurel/i,
    /\bhierba/i, /\barom[aá]tica/i,

    // Especias
    /\bcanela/i, /\bjengibre/i, /\bc[uú]rcuma/i, /\bpimienta/i,
    /\bespecias?\b/i,

    // Saludables
    /\bmiel\b/i, /\bpolen/i, /\bprop[oó]leo/i,

    // Combos y presentaciones
    /\bcaja\b/i, /\bcombo/i, /\bpack\b/i, /\bkit\b/i,
    /\bbandeja/i, /\bcanasta/i, /\bpremium/i, /\bgourmet/i,

    // Desgranados
    /\bdesgranado/i, /\bpelado/i
];

const tieneProductoConocido = productosConocidos.some(r => r.test(msgLower));

// =====================================================
// MÉTODO 3: SALUDOS SIMPLES (NO BUSCAR)
// =====================================================
const soloSaludos = [
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
    /^bien[,!.\s]*$/i,
    /^genial[,!.\s]*$/i
];

const esSoloSaludo = soloSaludos.some(p => p.test(msgLower));

// =====================================================
// DECISIÓN FINAL
// =====================================================
// Es búsqueda de producto SI:
// - NO es pregunta conversacional, Y
// - (Tiene patrón de producto O menciona producto conocido), Y
// - NO es solo un saludo

const esIntentoBusqueda =
    !esPreguntaConversacional &&
    (tienePatronProducto || tieneProductoConocido) &&
    !esSoloSaludo;

// =====================================================
// EXTRACCIÓN DEL TÉRMINO DE BÚSQUEDA
// =====================================================
const palabrasIgnorar = new Set([
    // Artículos
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    // Preposiciones
    'de', 'del', 'a', 'al', 'en', 'con', 'por', 'para', 'como', 'cómo',
    // Verbos comunes
    'que', 'qué', 'cuanto', 'cuánto', 'cual', 'cuál',
    'vale', 'valen', 'cuesta', 'cuestan', 'precio', 'costo', 'valor',
    'tienen', 'tienes', 'tiene', 'hay', 'habrá', 'habra',
    'busco', 'busca', 'buscando', 'quiero', 'quiere', 'quisiera',
    'venden', 'vende', 'manejan', 'ofrecen', 'ofrece',
    'necesito', 'necesita', 'dame', 'deme', 'das', 'dan',
    'agregar', 'añadir', 'poner', 'llevar', 'llevo', 'lleva',
    'comprar', 'compro', 'pedir', 'pedido',
    // Saludos
    'hola', 'buenos', 'buenas', 'días', 'dias', 'tardes', 'noches',
    'hey', 'oye', 'disculpa', 'perdón', 'perdon',
    // Cortesías
    'por', 'favor', 'porfavor', 'gracias', 'muchas',
    // Otros
    'esta', 'está', 'estan', 'están', 'ese', 'eso', 'esa',
    'algo', 'más', 'mas', 'otro', 'otra', 'otros', 'otras',
    'todo', 'todos', 'también', 'tambien'
]);

let terminoBusqueda = '';
if (esIntentoBusqueda) {
    terminoBusqueda = msgLower
        .replace(/[^\w\sáéíóúñü]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !palabrasIgnorar.has(w))
        .join(' ')
        .trim();
}

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
        esPreguntaConversacional,
        terminoBusqueda,
        timestamp: whatsappMsg.sendTime,
        // Debug (eliminar después si quieres)
        _debug: {
            tienePatronProducto,
            tieneProductoConocido,
            esSoloSaludo,
            esPreguntaConversacional
        }
    }
}];
