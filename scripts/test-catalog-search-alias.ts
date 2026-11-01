import { getSearchForms } from '../lib/catalog-search';

const forms = getSearchForms('caja 24');
if (!forms.includes('caja de 24')) {
  throw new Error(`Missing caja de 24 alias: ${JSON.stringify(forms)}`);
}
if (!forms.includes('24 unidades')) {
  throw new Error(`Missing 24 unidades alias: ${JSON.stringify(forms)}`);
}
console.log(JSON.stringify({ query: 'caja 24', forms }));