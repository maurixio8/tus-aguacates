/**
 * Utilidad Maestra de Emojis de Productos
 * Centraliza el mapeo de nombres de productos a visuales (emojis)
 * para garantizar consistencia en resúmenes, WhatsApp y reportes.
 */

export const PRODUCT_EMOJIS: Record<string, string> = {
  // --- AGUACATES (claves específicas primero) ---
  'hass': '🥑',
  'injerto': '🥑',
  'caja de 24': '🥑',
  'caja de 12': '🥑',
  'caja de 7': '🥑',
  'caja de 35': '🥑',
  'nueva maya': '🥑',
  'aceite de aguacate': '🥑',

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
  'arandano': '🫐',
  'mora real': '🫐',
  'mora': '🫐',
  'agraz': '🫐',
  'granada': '🔴',
  'maracuya': '🟡',
  'lulo': '🟢',
  'pitahaya': '🐉',
  'pitaya': '🐉',
  'uchuva': '🟡',
  'tamarindo': '🟫',
  'gulupa': '🟣',
  'feijoa': '🍈',
  'anon': '🍈',
  'corozo': '🔴',
  'mangostino': '🟣',
  'rambutan': '🔴',
  'borojo': '🟤',
  'carambolo': '⭐',
  'datil': '🟫',
  'papaya': '🍈',
  'guanabana': '🍈',
  'granadilla': '🍈',
  'guayaba': '🍈',

  // --- VERDURAS / TUBÉRCULOS ---
  'cebolla': '🧅',
  'cebollin': '🌿',
  'ajo': '🧄',
  'pasta de ajo': '🧄',
  'tomate': '🍅',
  'papa': '🥔',
  'cubios': '🥔',
  'zanahoria': '🥕',
  'maiz': '🌽',
  'mazorca': '🌽',
  'pimenton': '🫑',
  'pepino': '🥒',
  'calabacin': '🥒',
  'zucchini': '🥒',
  'brocoli': '🥦',
  'coliflor': '🥦',
  'espinaca': '🥬',
  'lechuga': '🥬',
  'repollo': '🥬',
  'apio': '🥬',
  'berenjena': '🍆',
  'acelga': '🥬',
  'alcachofa': '🥬',
  'col bruselas': '🥬',
  'kale': '🥬',
  'rucula': '🥬',
  'arveja': '🫛',
  'guisante': '🫛',
  'habas': '🫛',
  'frijol': '🫘',
  'habichuela': '🫛',
  'abichuelin': '🫛',
  'champinon': '🍄',
  'hongo': '🍄',
  'esparrago': '🌿',
  'remolacha': '🟤',
  'rabano': '🥕',
  'ahuyama': '🎃',
  'auyama': '🎃',
  'batata': '🍠',
  'yacon': '🍠',
  'jengibre': '🫚',
  'curcuma': '🫚',

  // --- HIERBAS / ESPECIAS ---
  'cilantro': '🌿',
  'perejil': '🌿',
  'guasca': '🌿',
  'albahaca': '🌿',
  'romero': '🌿',
  'tomillo': '🌿',
  'oregano': '🌿',
  'finas hierbas': '🌿',
  'hierba procesada': '🌿',
  'menta': '🌿',
  'hierbabuena': '🌿',
  'laurel': '🌿',
  'canela': '🪵',
  'moringa': '🌿',
  'stevia': '🌿',
  'pimienta': '⚫',
  'chile': '🌶️',
  'aji': '🌶️',
  'jalapeno': '🌶️',
  'achiote': '🔴',
  'paprika': '🌶️',
  'comino': '🟤',
  'manzanilla': '🌼',
  'calendula': '🌼',
  'diente de leon': '🌼',
  'flor de jamaica': '🌺',
  'eucalipto': '🌿',

  // --- OTROS ---
  'semilla': '🌱',
  'chia': '🌱',
  'germinados': '🌱',
  'raices chinas': '🌱',
  'quinoa': '🌾',
  'linaza': '🌾',
  'miel': '🍯',
  'aceite': '🫒',
  'zumo': '🥤',
  'polen': '🐝',
  'vino': '🍷',
  'ancheta': '🎁',
  'regalo': '🎁',
  'caja': '📦',
  'combo': '🛍️',
  'paquete': '🛍️',
  'picados para sopa': '🥗',
  'sabila': '🌵',
  'pistachos': '🥜',
  'bicarbonato': '🧂'
};

/**
 * Obtiene el emoji correspondiente para un producto basado en su nombre.
 * Prioriza los nombres más largos (más específicos) primero.
 */
export const getProductEmoji = (productName: string): string => {
  if (!productName) return '📦';
  
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

  return '📦';
};
