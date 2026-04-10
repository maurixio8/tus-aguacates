
const fieldNames = ['peso', 'cantidad', 'presentación', 'presentacion', 'volumen', 'unidad', 'unidades'];

const extractWeightFromVariant = (variantName) => {
    if (!variantName) return undefined;
    const text = variantName.toLowerCase().trim();
    const patterns = [
      /(\d+(?:\.\d+)?)\s*(?:grs|gramas|gramos|gr)\b/i,
      /(\d+(?:\.\d+)?)\s*(?:kg|kilos?)\b/i,
      /(\d+(?:\.\d+)?)grs/i,
      /x(\d+(?:\.\d+)?)grs/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const value = parseFloat(match[1]);
        if (/kg|kilos?/i.test(text)) return value * 1000;
        return value;
      }
    }
    return undefined;
};

const normalizeProductName = (name, variant) => {
    if (!name) return 'producto sin nombre';
    const stripAccents = (str) =>
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    let normalized = stripAccents(name);
    normalized = normalized.replace(/\s*\([^)]*\)\s*$/, '').trim();
    normalized = normalized.replace(/\s*\d+\s*(grs?|gramas|gramos|kg|kilos?|unidades?|bandeja?s?)\b.*$/i, '').trim();
    normalized = normalized.replace(/\s+/g, ' ');
    return normalized;
};

const extractQuantityFromName = (productName) => {
    const name = productName.toLowerCase();
    const unitsMatch = productName.match(/(\d+)\s*unidad(es)?/i);
    if (unitsMatch) return `${unitsMatch[1]} unidades`;
    const weightMatch = productName.match(/(\d+(?:\.\d+)?)\s*(gr|grs|kg|kilos?|gramos)/i);
    if (weightMatch) return `${weightMatch[1]} ${weightMatch[2].toLowerCase()}`;
    return null;
};

// TEST CASE 1: Tomate 1 Kilo (info in name, not in variant)
const name1 = "Tomate Chonto 1 Kilo";
const variant1 = null;
const norm1 = normalizeProductName(name1, variant1);
const quant1 = extractQuantityFromName(name1);
console.log(`Input: "${name1}"`);
console.log(`Normalized Name: "${norm1}"`);
console.log(`Extracted Quantity: "${quant1}"`);
console.log(`Resulting Display: "${norm1}${quant1 ? ` (${quant1})` : ''}"`);
console.log('---');

// TEST CASE 2: Tomate 1 Libra (info in name, not in variant)
const name2 = "Tomate Chonto 1 Libra";
const variant2 = null;
const norm2 = normalizeProductName(name2, variant2);
const quant2 = extractQuantityFromName(name2);
console.log(`Input: "${name2}"`);
console.log(`Normalized Name: "${norm2}"`);
console.log(`Extracted Quantity: "${quant2}"`);
console.log(`Resulting Display: "${norm2}${quant2 ? ` (${quant2})` : ''}"`);
console.log('---');
