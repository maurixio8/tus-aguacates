/**
 * Utilidad Maestra de Emojis de Productos
 * Centraliza el mapeo de nombres de productos a visuales (emojis)
 * para garantizar consistencia en resúmenes, WhatsApp y reportes.
 *
 * REGLA DE ORO: SOLO emojis de frutas y verduras reales (compatibles con WhatsApp).
 * Nada de abstractos, símbolos, objetos, flores, animales ni emojis nuevos 🫐🫑🫛🫘🫚🪵🎃⭐🥤.
 */

// Emojis SEGUROS para WhatsApp (frutas + verduras reales):
// 🍇🍈🍉🍊🍋🍌🍍🍎🍏🍐🍑🍒🍓🥝🥭🥥🥑🥒🥔🥕🥬🥦🌽🍅🥗🍠🍄🥜

export const PRODUCT_EMOJIS: Record<string, string> = {
  // --- AGUACATES (claves específicas primero) ---
  'hass': '🥑',
  'injerto': '🥑',
  'papelillo': '🥑',
  'caja de 24': '🥑',
  'caja de 12': '🥑',
  'caja de 7': '🥑',
  'caja de 35': '🥑',
  'nueva maya': '🥑',
  'aceite de aguacate': '🥑',
  'aceite de oliva': '🥑',
  'botella de aceite': '🥑',
  'aceite': '🥑',

  // --- UVAS ---
  'red globe': '🍇',
  'uva isabelina': '🍇',
  'uva chilena': '🍇',
  'uva': '🍇',

  // --- FRUTAS ---
  'aguacate': '🥑',
  'fresa': '🍓',
  'frambuesa': '🍓',
  'mango': '🥭',
  'banano': '🍌',
  'banana': '🍌',
  'platano': '🍌',
  'pina': '🍍',
  'limon': '🍋',
  'naranja': '🍊',
  'mandarina': '🍊',
  'toronja': '🍊',
  'cereza': '🍒',
  'coco': '🥥',
  'kiwi': '🥝',
  'pera': '🍐',
  'cidra': '🍈',
  'durazno': '🍑',
  'melocoton': '🍑',
  'ciruela': '🍑',
  'sandia': '🍉',
  'melon': '🍈',
  'manzana': '🍎',
  'arandano': '🍇',
  'mora real': '🍓',
  'mora': '🍓',
  'agraz': '🍇',

  // Claves compuestas (específicas primero para evitar falsos positivos)
  'mazorca desgranada': '🌽',
  'arveja desgranada': '🥒',
  'habas desgranadas': '🥒',
  'zumo lulo': '🍊',
  'zumo maracuya': '🍑',

  'granada': '🍎',
  'maracuya': '🍑',
  'lulo': '🍏',
  'pitahaya': '🍈',
  'pitaya': '🍈',
  'uchuva': '🍑',
  'tamarindo': '🥥',
  'gulupa': '🍇',
  'feijoa': '🍈',
  'anon': '🍈',
  'corozo': '🍒',
  'mangostino': '🍇',
  'rambutan': '🍓',
  'borojo': '🥥',
  'carambolo': '🍊',
  'datil': '🍯',
  'papaya': '🍈',
  'guanabana': '🍈',
  'granadilla': '🍈',
  'guayaba': '🍈',

  // --- VERDURAS / TUBÉRCULOS ---
  'cebolla': '🥬',
  'cebollin': '🥬',
  'cebollín': '🥬',
  'cebolla cabezona': '🥬',
  'cebolla roja': '🥬',
  'cebolla blanca': '🥬',
  'ajo': '🥬',
  'pasta de ajo': '🥬',
  'tomate': '🍅',
  'tomate chonto': '🍅',
  'tomate larga vida': '🍅',
  'papa': '🥔',
  'cubios': '🥔',
  'sabanera': '🥔',
  'criolla': '🥔',
  'papa sabanera': '🥔',
  'papa criolla': '🥔',
  'zanahoria': '🥕',
  'maiz': '🌽',
  'mazorca': '🌽',
  'pimenton': '🍅',
  'pepino': '🥒',
  'calabacin': '🥒',
  'zucchini': '🥒',
  'brocoli': '🥦',
  'coliflor': '🥦',
  'espinaca': '🥬',
  'lechuga': '🥬',
  'repollo': '🥬',
  'apio': '🥬',
  'berenjena': '🍇',
  'acelga': '🥬',
  'alcachofa': '🥬',
  'col bruselas': '🥬',
  'kale': '🥬',
  'rucula': '🥬',
  'arveja': '🥒',
  'guisante': '🥒',
  'habas': '🥒',
  'frijol': '🥜',
  'habichuela': '🥒',
  'abichuelin': '🥒',
  'champinon': '🍄',
  'hongo': '🍄',
  'esparrago': '🥬',
  'remolacha': '🍠',
  'rabano': '🥕',
  'ahuyama': '🍠',
  'auyama': '🍠',
  'batata': '🍠',
  'yacon': '🍠',
  'jengibre': '🍋',
  'curcuma': '🍋',

  // --- HIERBAS (mapear a verduras de color similar) ---
  'cilantro': '🥬',
  'perejil': '🥬',
  'guasca': '🥬',
  'albahaca': '🥬',
  'romero': '🥬',
  'tomillo': '🥬',
  'oregano': '🥬',
  'finas hierbas': '🥬',
  'hierba procesada': '🥬',
  'menta': '🥬',
  'hierbabuena': '🥬',
  'laurel': '🥬',
  'canela': '🥥',
  'moringa': '🥬',
  'stevia': '🥬',

  // --- ESPECIAS (mapear a frutas/verduras por color) ---
  'pimienta': '🍇',
  'chile': '🍅',
  'aji': '🍅',
  'jalapeno': '🍅',
  'achiote': '🍅',
  'paprika': '🍅',
  'comino': '🍌',
  'manzanilla': '🍌',
  'calendula': '🍌',
  'diente de leon': '🍌',
  'flor de jamaica': '🍎',
  'eucalipto': '🥒',

  // --- OTROS (mapear a frutas/verduras) ---
  'semilla': '🥜',
  'chia': '🥜',
  'germinados': '🥒',
  'raices chinas': '🥕',
  'linaza': '🍌',
  'miel': '🍯',
  'aceite de coco': '🥥',
  'zumo': '🍊',
  'polen': '🍌',
  'vino': '🍇',
  'ancheta': '🍎',
  'regalo': '🍎',
  'caja': '🥑',
  'combo': '🥗',
  'paquete': '🥗',
  'picados para sopa': '🥗',
  'sabila': '🥬',
  'pistachos': '🥜',
  'bicarbonato': '🍌',

  // --- NUEVOS: Tubérculos y raíces ---
  'yuca': '🥔',
  'yukita': '🥔',
  'ñame': '🥔',
  'name': '🥔',
  'arracacha': '🥔',

  // --- NUEVOS: Calabazas y auyamas ---
  'calabaza': '🍠',
  'zapallo': '🍠',

  // --- NUEVOS: Pepinos ---
  'pepino cohombro': '🥒',
  'pepino de rellenar': '🥒',

  // --- NUEVOS: Tomates ---
  'tomate de arbol': '🍅',
  'tomate arbol': '🍅',

  // --- NUEVOS: Pimentones ---
  'pimenton rojo': '🍅',
  'pimenton verde': '🍅',
  'pimenton amarillo': '🍅',

  // --- NUEVOS: Ajo y cebollas ---
  'ajo pelado': '🥬',
  'ajo entero': '🥬',
  'cebolla larga': '🥬',
  'cebolla junca': '🥬',
  'cebolla de huevo': '🥬',
  'cebolleta': '🥬',

  // --- NUEVOS: Lechugas y espinacas ---
  'espinaca baby': '🥬',
  'lechuga crespa': '🥬',
  'lechuga romana': '🥬',
  'mix de lechugas': '🥬',

  // --- NUEVOS: Coles y repollos ---
  'coliflor morada': '🥦',
  'repollo morado': '🥬',
  'repollo verde': '🥬',
  'col morada': '🥬',
  'col china': '🥬',
  'bok choy': '🥬',
  'pak choi': '🥬',

  // --- NUEVOS: Apio y cilantro ---
  'apio españa': '🥬',
  'cilantro en pasta': '🥬',

  // --- NUEVOS: Proteínas ---
  'huevo': '🥚',
  'huevos': '🥚',
  'huevos de codorniz': '🥚',
  'pollo': '🍗',
  'pollo entero': '🍗',
  'pollo en piezas': '🍗',
  'pechuga': '🍗',
  'carne': '🥩',
  'res': '🥩',
  'cerdo': '🥩',
  'pescado': '🐟',
  'tilapia': '🐟',
  'bagre': '🐟',
  'salmon': '🐟',
  'atun': '🐟',
  'camaron': '🦐',
  'camarones': '🦐',
  'langostinos': '🦐',

  // --- NUEVOS: Panadería y granos ---
  'pan': '🍞',
  'pan artesanal': '🍞',
  'tostadas': '🍞',
  'arepa': '🌽',
  'arepas': '🌽',
  'galletas': '🍪',
  'harina': '🌾',
  'harina de trigo': '🌾',
  'harina de maiz': '🌽',
  'harina pan': '🌽',
  'avena': '🌾',
  'granola': '🌾',
  'cereal': '🌾',
  'pasta': '🍝',
  'espagueti': '🍝',
  'fideos': '🍝',
  'tallarines': '🍝',
  'lasaña': '🍝',
  'arroz': '🍚',
  'arroz integral': '🍚',
  'arroz basmati': '🍚',
  'arroz jazmin': '🍚',
  'quinoa': '🍚',
  'quinua': '🍚',

  // --- NUEVOS: Lácteos ---
  'leche': '🥛',
  'queso': '🧀',
  'quesito': '🧀',

  // --- NUEVOS: Dulces ---
  'chocolate': '🍫',
  'cacao': '🍫',
  'brownie': '🍫',
  'dulces': '🍬',
  'ponque': '🍰',
  'torta': '🍰',
  'gelatina': '🍮',

  // --- NUEVOS: Bebidas ---
  'cafe': '☕',
  'café': '☕',
  'te': '🍵',
  'té': '🍵',

  // --- NUEVOS: Condimentos ---
  'azucar': '🍚',
  'sal': '🧂',
  'sal del himalaya': '🧂',
  'sal marina': '🧂',
  'vinagre': '🍊',
  'salsa de soya': '🍊',
  'salsa de tomate': '🍅',
  'mayonesa': '🍊',
  'mostaza': '🍊',
  'aceitunas': '🫒',
  'aceituna': '🫒',
  'pepinillos': '🥒',
  'alcaparras': '🥒',
  'crispetas': '🌽',
  'pasas': '🍇',

  // --- NUEVOS: Papas específicas ---
  'papa pastusa': '🥔',
  'papa amarilla': '🥔',
  'papa r-12': '🥔',
  'papa suprema': '🥔',
  'papa unica': '🥔',
  'papa tocarreña': '🥔',
  'papa negra': '🥔',
  'papa santana': '🥔',
  'papa larroque': '🥔',
  'papa mambera': '🥔',
  'puré de papa': '🥔',

  // --- NUEVOS: Frutos secos y semillas ---
  'lenteja': '🥜',
  'lentejas': '🥜',
  'garbanzo': '🥜',
  'garbanzos': '🥜',
  'almendra': '🥜',
  'almendras': '🥜',
  'nuez': '🥜',
  'nueces': '🥜',
  'mani': '🥜',
  'avellana': '🥜',
  'avellanas': '🥜',
  'linaza molida': '🥜',
  'semilla de calabaza': '🥜',
  'semilla de girasol': '🥜',
  'semilla de sesamo': '🥜',
  'ajonjoli': '🥜',
  'frijol bola roja': '🥜',
  'frijol cargamanto': '🥜',
  'frijol radical': '🥜',

  // --- NUEVOS: Legumbres verdes ---
  'frijol verde': '🥒',
  'frijol abono': '🥒',
  'brotes de soya': '🥒',

  // --- NUEVOS: Coco ---
  'coco rallado': '🥥',
  'leche de coco': '🥥',
  'crema de coco': '🥥',

  // --- NUEVOS: Maíz ---
  'maiz peto': '🌽',
  'maiz trillado': '🌽',
  'maiz pira': '🌽',
  'palomitas': '🌽',
  'panca': '🌽',
  'hoja de maiz': '🌽',

  // --- NUEVOS: Frutas deshidratadas ---
  'ciruela pasa': '🍑',
  'orejones': '🍑',

  // --- NUEVOS: Verduras de hoja ---
  'cimarrón': '🥬',
  'cimarron': '🥬',
  'berros': '🥬',
  'berro': '🥬',
  'eneldo': '🥬',
  'estragon': '🥬',
  'microverdes': '🥬',
  'brotes': '🥬',
  'hoja de platano': '🥬',
  'palmito': '🥬',
  'corazon de alcachofa': '🥬',

  // --- NUEVOS: Hongos ---
  'hongos': '🍄',
  'setas': '🍄',
  'portobello': '🍄',
  'champinones': '🍄',
  'shitake': '🍄',
  'orejitas': '🍄',

  // --- NUEVOS: Proteínas vegetales ---
  'tofu': '🥗',
  'tempeh': '🥗',
  'seitan': '🥗',
};

/**
 * Obtiene el emoji correspondiente para un producto basado en su nombre.
 * Prioriza los nombres más largos (más específicos) primero.
 */
export const getProductEmoji = (productName: string): string => {
  if (!productName) return '🥬';

  const normalizedName = productName.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Ordenar claves por longitud descendente para que "caja de 24" gane a "caja"
  const sortedKeys = Object.keys(PRODUCT_EMOJIS).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    if (normalizedName.includes(key)) {
      return PRODUCT_EMOJIS[key];
    }
  }

  return '🥬';
};

/**
 * Defense-in-depth: fuerza CUALQUIER emoji a fruta/verdura segura para WhatsApp.
 * Esto atrapa cualquier emoji que se escape del catálogo principal.
 */
const FORCE_WHATSAPP_SAFE: Record<string, string> = {
  // Emojis nuevos/nicho que NO son frutas → mapear a frutas
  '🫐': '🍇', '🫑': '🍅', '🫛': '🥒', '🫘': '🥜', '🫚': '🍋',
  '🪵': '🥥', '🫒': '🥑', '🎃': '🍠', '⭐': '🍊', '🥤': '🍊',
  '🧂': '🍌', '🐝': '🍯', '🌾': '🍌', '🌶️': '🍅', '👻': '🍇',
  // Símbolos abstractos (colores, corazones, etc.)
  '🔴': '🍎', '🟡': '🍌', '🟢': '🥒', '🔵': '🍇', '🟠': '🍊',
  '🟣': '🍇', '⚫': '🍇', '⚪': '🍈', '🟤': '🥥', '🟫': '🥥',
  '💚': '🥑', '❤️': '🍎', '💛': '🍌', '🧡': '🍊', '💜': '🍇',
  '🖤': '🍇', '🤍': '🍈', '🤎': '🥥', '💙': '🍇', '🩷': '🍎',
  // Objetos/símbolos
  '🎁': '🍎', '📦': '🥑', '🚚': '🍊', '✅': '🥑', '📍': '🍄',
  '📅': '🍅', '👋': '🥑',
  // Plantas/flores → frutas
  '🌿': '🥬', '🌼': '🍌', '🌺': '🍎', '🌵': '🥬', '🌸': '🍎',
  '🌱': '🥬',
};

/**
 * Obtiene un emoji seguro para WhatsApp.
 * Si el emoji del catálogo no está en la lista de seguros, lo fuerza a uno seguro.
 */
export const getWhatsAppSafeEmoji = (productName: string): string => {
  const emoji = getProductEmoji(productName);
  // Si ya es fruta/verdura conocida, devolverla; si no, forzar a una segura
  return FORCE_WHATSAPP_SAFE[emoji] || emoji;
};
