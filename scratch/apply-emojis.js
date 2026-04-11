const fs = require('fs');

const SUPER_DICT = `    'hass': '🥑', 'injerto': '🥑', 'caja de 24': '🥑', 'caja de 12': '🥑',
    'caja de 7': '🥑', 'caja de 35': '🥑', 'nueva maya': '🥑', 'red globe': '🍇', 'uva isabelina': '🍇',
    'aguacate': '🥑', 'fresa': '🍓', 'frambuesa': '🍓', 'mango': '🥭',
    'banano': '🍌', 'banana': '🍌', 'platano': '🍌', 'pina': '🍍',
    'uva': '🍇', 'limon': '🍋', 'naranja': '🍊', 'mandarina': '🍊', 'toronja': '🍊',
    'cereza': '🍒', 'coco': '🥥', 'kiwi': '🥝', 'pera': '🍐', 'cidra': '🍈',
    'durazno': '🍑', 'melocoton': '🍑', 'ciruela': '🍑', 'sandia': '🍉',
    'melon': '🍈', 'manzana': '🍎', 'arandano': '🫐', 'mora': '🫐', 'agraz': '🫐',
    'granada': '🔴', 'maracuya': '🟡', 'lulo': '🟢', 'pitahaya': '🐉',
    'pitaya': '🐉', 'uchuva': '🟡', 'tamarindo': '🟫', 'gulupa': '🟣',
    'feijoa': '🍈', 'anon': '🍈', 'corozo': '🔴', 'mangostino': '🟣',
    'rambutan': '🔴', 'borojo': '🟤', 'carambolo': '⭐', 'datil': '🟫',
    'papaya': '🍈', 'guanabana': '🍈', 'granadilla': '🍈', 'guayaba': '🍈',
    'cebolla': '🧅', 'cebollin': '🌿', 'ajo': '🧄', 'pasta de ajo': '🧄', 'tomate': '🍅',
    'papa': '🥔', 'cubios': '🥔', 'zanahoria': '🥕', 'maiz': '🌽',
    'mazorca': '🌽', 'pimenton': '🫑', 'pepino': '🥒', 'calabacin': '🥒',
    'zucchini': '🥒', 'brocoli': '🥦', 'coliflor': '🥦', 'espinaca': '🥬',
    'lechuga': '🥬', 'repollo': '🥬', 'apio': '🥬', 'berenjena': '🍆', 'acelga': '🥬',
    'alcachofa': '🥬', 'col bruselas': '🥬', 'kale': '🥬', 'rucula': '🥬',
    'arveja': '🫛', 'guisante': '🫛', 'habas': '🫛', 'frijol': '🫘', 'habichuela': '🫛', 'abichuelin': '🫛',
    'champinon': '🍄', 'hongo': '🍄', 'esparrago': '🌿', 'remolacha': '🟤',
    'rabano': '🥕', 'ahuyama': '🎃', 'auyama': '🎃', 'batata': '🍠', 'yacon': '🍠',
    'jengibre': '🫚', 'curcuma': '🫚', 'cilantro': '🌿', 'perejil': '🌿', 'guasca': '🌿',
    'albahaca': '🌿', 'romero': '🌿', 'tomillo': '🌿', 'oregano': '🌿', 'finas hierbas': '🌿',
    'menta': '🌿', 'hierbabuena': '🌿', 'laurel': '🌿', 'canela': '🪵', 'moringa': '🌿', 'stevia': '🌿',
    'pimienta': '⚫', 'chile': '🌶️', 'aji': '🌶️', 'jalapeno': '🌶️', 'achiote': '🔴', 'paprika': '🌶️', 'comino': '🟤',
    'semilla': '🌱', 'chia': '🌱', 'germinados': '🌱', 'raices chinas': '🌱', 'quinoa': '🌾', 'linaza': '🌾',
    'miel': '🍯', 'aceite': '🫒', 'zumo': '🥤', 'polen': '🐝', 'vino': '🍷',
    'ancheta': '🎁', 'regalo': '🎁', 'caja': '📦', 'combo': '🛍️', 'paquete': '🛍️',
    'picados para sopa': '🥗', 'sabila': '🌵', 'flor de jamaica': '🌺', 
    'manzanilla': '🌼', 'calendula': '🌼', 'diente de leon': '🌼', 'eucalipto': '🌿',
    'pistachos': '🥜', 'bicarbonato': '🧂'`;

// 1. Update lista-compras
let ls = fs.readFileSync('app/admin/lista-compras/page.tsx', 'utf8');
let st1 = ls.indexOf('const PRODUCT_EMOJIS: Record<string, string> = {');
let end1 = ls.indexOf('};', st1);
if (st1 > -1 && end1 > -1) {
  ls = ls.substring(0, st1) + 'const PRODUCT_EMOJIS: Record<string, string> = {\n' + SUPER_DICT + '\n  ' + ls.substring(end1);
  fs.writeFileSync('app/admin/lista-compras/page.tsx', ls);
  console.log('lista-compras updated');
}

// 2. Update pedidos
let pd = fs.readFileSync('app/admin/pedidos/page.tsx', 'utf8');
let st2 = pd.indexOf('const EMOJI_TABLE: Record<string, string> = {');
let end2 = pd.indexOf('};', st2);
if (st2 > -1 && end2 > -1) {
  pd = pd.substring(0, st2) + 'const EMOJI_TABLE: Record<string, string> = {\n' + SUPER_DICT + '\n    ' + pd.substring(end2);
  fs.writeFileSync('app/admin/pedidos/page.tsx', pd);
  console.log('pedidos updated');
}

// 3. Update orderSummaryGenerator
let og = fs.readFileSync('utils/orderSummaryGenerator.ts', 'utf8');
let st3 = og.indexOf('const PRODUCT_EMOJIS: Record<string, string> = {');
let end3 = og.indexOf('};', st3);
if (st3 > -1 && end3 > -1) {
  og = og.substring(0, st3) + 'const PRODUCT_EMOJIS: Record<string, string> = {\n' + SUPER_DICT + '\n  ' + og.substring(end3);
  fs.writeFileSync('utils/orderSummaryGenerator.ts', og);
  console.log('orderSummaryGenerator updated');
}
