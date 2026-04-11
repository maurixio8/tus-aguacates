const fs = require('fs');
const f = fs.readFileSync('app/admin/pedidos/page.tsx', 'utf8');
const lines = f.split('\n');

const replacement = [
  '    // Tabla Maestra de emojis - Claves sin acentos para matching robusto',
  '    const EMOJI_TABLE: Record<string, string> = {',
  "      'aguacate':'\u{1F951}','fresa':'\u{1F353}','frambuesa':'\u{1F353}','mango':'\u{1F96D}',",
  "      'banano':'\u{1F34C}','banana':'\u{1F34C}','platano':'\u{1F34C}','pina':'\u{1F34D}',",
  "      'uva':'\u{1F347}','limon':'\u{1F34B}','naranja':'\u{1F34A}','mandarina':'\u{1F34A}',",
  "      'cereza':'\u{1F352}','coco':'\u{1F965}','kiwi':'\u{1F95D}','pera':'\u{1F350}',",
  "      'durazno':'\u{1F351}','melocoton':'\u{1F351}','ciruela':'\u{1F351}','sandia':'\u{1F349}',",
  "      'melon':'\u{1F348}','manzana':'\u{1F34E}','arandano':'\u{1FAD0}','mora':'\u{1FAD0}',",
  "      'granada':'\u{1F534}','maracuya':'\u{1F7E1}','lulo':'\u{1F7E2}','pitahaya':'\u{1F409}',",
  "      'pitaya':'\u{1F409}','uchuva':'\u{1F7E1}','tamarindo':'\u{1F7EB}','gulupa':'\u{1F7E3}',",
  "      'feijoa':'\u{1F348}','anon':'\u{1F348}','corozo':'\u{1F534}','mangostino':'\u{1F7E3}',",
  "      'rambutan':'\u{1F534}','borojo':'\u{1F7E4}','carambolo':'\u{2B50}','datil':'\u{1F7EB}',",
  "      'papaya':'\u{1F348}','guanabana':'\u{1F348}','granadilla':'\u{1F348}','guayaba':'\u{1F348}',",
  "      'cebolla':'\u{1F9C5}','ajo':'\u{1F9C4}','pasta de ajo':'\u{1F9C4}','tomate':'\u{1F345}',",
  "      'papa':'\u{1F954}','cubios':'\u{1F954}','zanahoria':'\u{1F955}','maiz':'\u{1F33D}',",
  "      'mazorca':'\u{1F33D}','pimenton':'\u{1FAD1}','pepino':'\u{1F952}','calabacin':'\u{1F952}',",
  "      'zucchini':'\u{1F952}','brocoli':'\u{1F966}','coliflor':'\u{1F966}','espinaca':'\u{1F96C}',",
  "      'lechuga':'\u{1F96C}','repollo':'\u{1F96C}','apio':'\u{1F96C}','berenjena':'\u{1F346}',",
  "      'arveja':'\u{1FADB}','guisante':'\u{1FADB}','habas':'\u{1FADB}','frijol':'\u{1FAD8}',",
  "      'champinon':'\u{1F344}','hongo':'\u{1F344}','esparrago':'\u{1F33F}','remolacha':'\u{1F7E4}',",
  "      'rabano':'\u{1F955}','ahuyama':'\u{1F383}','auyama':'\u{1F383}','batata':'\u{1F360}','yacon':'\u{1F360}',",
  "      'jengibre':'\u{1FADA}','curcuma':'\u{1FADA}','cilantro':'\u{1F33F}','perejil':'\u{1F33F}',",
  "      'albahaca':'\u{1F33F}','romero':'\u{1F33F}','tomillo':'\u{1F33F}','oregano':'\u{1F33F}',",
  "      'menta':'\u{1F33F}','hierbabuena':'\u{1F33F}','laurel':'\u{1F33F}','canela':'\u{1FAB5}',",
  "      'pimienta':'\u{26AB}','chile':'\u{1F336}\u{FE0F}','aji':'\u{1F336}\u{FE0F}','jalapeno':'\u{1F336}\u{FE0F}',",
  "      'semilla':'\u{1F331}','chia':'\u{1F331}','germinados':'\u{1F331}','quinoa':'\u{1F33E}','linaza':'\u{1F33E}',",
  "      'miel':'\u{1F36F}','aceite':'\u{1FAD2}','zumo':'\u{1F964}','polen':'\u{1F41D}','vino':'\u{1F377}',",
  "      'ancheta':'\u{1F381}','regalo':'\u{1F381}','caja':'\u{1F4E6}','combo':'\u{1F6CD}\u{FE0F}','paquete':'\u{1F6CD}\u{FE0F}',",
  "      'cafe':'\u{2615}','huevo':'\u{1F95A}','leche':'\u{1F95B}','queso':'\u{1F9C0}',",
  "      'carne':'\u{1F969}','pollo':'\u{1F357}','pescado':'\u{1F41F}','salmon':'\u{1F41F}','camaron':'\u{1F990}',",
  '    };',
  '    const getProductEmoji = (productName: string): string => {',
  "      const n = productName.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');",
  "      for (const k of Object.keys(EMOJI_TABLE)) { if (n.includes(k)) return EMOJI_TABLE[k]; }",
  "      return '\u{1F4E6}';",
  '    };',
];

// Replace lines 334-376 (0-indexed: 333-375)
const before = lines.slice(0, 333);
const after = lines.slice(376);
const newLines = [...before, ...replacement.map(l => l + '\r'), ...after];
fs.writeFileSync('app/admin/pedidos/page.tsx', newLines.join('\n'), 'utf8');
console.log('Done! Replaced lines 334-376 with', replacement.length, 'new lines');
