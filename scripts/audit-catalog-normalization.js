/**
 * Audita el catalogo activo para detectar deuda de normalizacion.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/audit-catalog-normalization.js
 *   node scripts/audit-catalog-normalization.js
 *
 * El script usa variables ya presentes en el entorno o intenta cargar `.env.production`.
 */

require('dotenv').config({ path: '.env.production' });

const { createClient } = require('@supabase/supabase-js');

function getRequiredEnv(name) {
  const value = (process.env[name] || '').trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getSupabaseKey() {
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  if (!key) {
    throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return key;
}

const supabase = createClient(
  getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
  getSupabaseKey()
);

function normalizeText(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeVariant(value) {
  return normalizeText(value)
    .replace(/^x\s*/i, '')
    .replace(/\bgramos\b/g, 'gr')
    .replace(/\bgrs\b/g, 'gr')
    .replace(/\bkilos\b/g, 'kg')
    .replace(/\bkilo\b/g, 'kg')
    .replace(/\bkilogramos\b/g, 'kg')
    .replace(/\buna unidad\b/g, '1 unidad')
    .replace(/\bunidades\b/g, 'unidad')
    .replace(/\bbandejas\b/g, 'bandeja')
    .replace(/\s+/g, ' ')
    .replace(/(\d)\s+(gr|kg|ml|unidad|bandeja)/g, '$1$2')
    .trim();
}

function hasEmbeddedPackagingInName(name) {
  return /\b(kilo|kilos|kg|gr|gram|ml|bandeja|bandejas|paquete|malla|x\d|x \d|\d+\s*uni)\b/i.test(name || '');
}

function buildFamilyKey(name) {
  return normalizeText(name)
    .replace(/\b(x\s*\d+\s*(uni|unidad|unidades|g|gr|grs|kg|kilo|kilos)|\d+\s*(uni|unidad|unidades|g|gr|grs|kg|kilo|kilos|ml))\b/g, ' ')
    .replace(/\b(kilo|kilos|kg|gramos|gramo|gr|grs|ml|bandeja|bandejas|paquete|malla|unidad|unidades|entero|tallos|baby|fresca|fresco)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function runAudit() {
  const { data, error } = await supabase
    .from('products')
    .select('id,name,is_active,product_variants(id,variant_name,variant_value,is_active)')
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(1000);

  if (error) {
    throw error;
  }

  const summary = {
    activeProducts: data.length,
    noVariants: 0,
    singleVariant: 0,
    multipleVariants: 0,
  };

  const inconsistentVariantFormatting = [];
  const embeddedPackagingNames = [];
  const familyCollisions = new Map();

  data.forEach((product) => {
    const variants = (product.product_variants || [])
      .filter((variant) => variant.is_active !== false)
      .map((variant) => variant.variant_value || variant.variant_name || '')
      .filter(Boolean);

    if (variants.length === 0) {
      summary.noVariants += 1;
    } else if (variants.length === 1) {
      summary.singleVariant += 1;
    } else {
      summary.multipleVariants += 1;
    }

    const normalizedVariantMap = new Map();
    variants.forEach((variant) => {
      const normalized = normalizeVariant(variant);
      const bucket = normalizedVariantMap.get(normalized) || new Set();
      bucket.add(variant);
      normalizedVariantMap.set(normalized, bucket);
    });

    const duplicateMeanings = Array.from(normalizedVariantMap.entries())
      .filter(([, rawValues]) => rawValues.size > 1)
      .map(([normalized, rawValues]) => ({
        normalized,
        rawValues: Array.from(rawValues).sort(),
      }));

    if (duplicateMeanings.length > 0) {
      inconsistentVariantFormatting.push({
        product: product.name,
        issues: duplicateMeanings,
      });
    }

    if (variants.length > 0 && hasEmbeddedPackagingInName(product.name)) {
      embeddedPackagingNames.push({
        product: product.name,
        variants,
      });
    }

    const familyKey = buildFamilyKey(product.name);
    if (familyKey) {
      const bucket = familyCollisions.get(familyKey) || new Set();
      bucket.add(product.name);
      familyCollisions.set(familyKey, bucket);
    }
  });

  const likelySplitFamilies = Array.from(familyCollisions.entries())
    .filter(([, names]) => names.size > 1)
    .map(([family, names]) => ({
      family,
      names: Array.from(names).sort(),
    }))
    .sort((a, b) => b.names.length - a.names.length || a.family.localeCompare(b.family));

  console.log(`\n=== AUDITORIA DE CATALOGO ACTIVO ===`);
  console.log(`Productos activos: ${summary.activeProducts}`);
  console.log(`Sin variantes: ${summary.noVariants}`);
  console.log(`Con una sola variante: ${summary.singleVariant}`);
  console.log(`Con multiples variantes: ${summary.multipleVariants}`);

  console.log(`\n=== VARIANTES CON FORMATO INCONSISTENTE (${inconsistentVariantFormatting.length}) ===`);
  inconsistentVariantFormatting.forEach((entry) => {
    console.log(`- ${entry.product}`);
    entry.issues.forEach((issue) => {
      console.log(`  ${issue.normalized}: ${issue.rawValues.join(' | ')}`);
    });
  });

  console.log(`\n=== NOMBRES CON EMPAQUE CARGADO EN EL PRODUCTO (${embeddedPackagingNames.length}) ===`);
  embeddedPackagingNames.forEach((entry) => {
    console.log(`- ${entry.product} => ${entry.variants.join(' | ')}`);
  });

  console.log(`\n=== FAMILIAS QUE PARECEN PARTIDAS EN VARIOS PRODUCTOS (${likelySplitFamilies.length}) ===`);
  likelySplitFamilies.forEach((entry) => {
    console.log(`- ${entry.family}: ${entry.names.join(' | ')}`);
  });
}

runAudit().catch((error) => {
  console.error('Catalog audit failed:', error);
  process.exit(1);
});
