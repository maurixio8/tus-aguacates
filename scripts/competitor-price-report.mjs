#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const OWN_CATALOG_URL = 'https://tus-aguacates.vercel.app/api/agent/products?limit=500&active_only=true';
const AGENT_KEY = process.env.TA_AGENT_KEY || process.env.AGENT_KEY;
const MAX_PRODUCTS = Number(process.env.COMPETITOR_MAX_PRODUCTS || 300);
const COMPETITORS = [
  {
    name: 'Carulla',
    searchUrl: 'https://www.carulla.com/api/catalog_system/pub/products/search?ft=',
  },
  {
    name: 'Éxito',
    searchUrl: 'https://www.exito.com/api/catalog_system/pub/products/search?ft=',
  },
];
const PRIORITY_CATEGORIES = [
  'Aguacates',
  'Frutas Tropicales',
  'Frutas Rojas',
  'Gourmet',
];
const ALLOWED_OWN_CATEGORIES = new Set(PRIORITY_CATEGORIES);
const STOPWORDS = new Set([
  'de','la','el','y','con','sin','x','extra','premium','nacional','importada','importado',
  'economica','europea','por','para','del','las','los','unidad','unidades','combo','baby'
]);
const EXEMPT_PRODUCTS = new Set(['Pasta de Ajo']);
const BLOCKED_OWN_TERMS = ['zumo', 'concentrado', 'aceite', 'injerto', 'perejil', 'cilantro', 'cebollin'];
const BLOCKED_MATCH_TERMS = [
  'te ', 'té ', 'sabor', 'pulpa', 'congel', 'maras', 'mitades', 'almibar',
  'bebida', 'jugo', 'yogurt', 'helado', 'mermelada', 'vino', 'vinagre', 'gel ', 'libreta',
  'marco ', 'vodka', 'cereal', 'dulce', 'barra', 'bola', 'enlat', 'azucar', 'almi', 'mix '
];

if (!AGENT_KEY) {
  console.error('Missing TA_AGENT_KEY env');
  process.exit(1);
}

function normalize(str = '') {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseGrams(text = '') {
  const s = normalize(String(text)).replace(/,/g, '.');
  const matches = [...s.matchAll(/(\d+(?:\.\d+)?)\s*(kg|kilo|kilos|gr|grs|g)\b/g)];
  if (matches.length) {
    return Math.max(...matches.map((m) => {
      let n = parseFloat(m[1]);
      if (String(m[2]).startsWith('k')) n *= 1000;
      return n;
    }));
  }
  if (/^\d+(?:\.\d+)?$/.test(s)) return parseFloat(s);
  return null;
}

function tokens(str = '') {
  return normalize(str)
    .split(' ')
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function categoryPriority(name = '') {
  const i = PRIORITY_CATEGORIES.indexOf(name);
  return i === -1 ? 999 : i;
}

function ownProductAllowed(product) {
  const category = product?.category?.name || '';
  if (!ALLOWED_OWN_CATEGORIES.has(category)) return false;
  const name = normalize(product?.name || '');
  return !BLOCKED_OWN_TERMS.some((term) => name.includes(term));
}

function pickReferenceVariant(product) {
  const variants = (product.variants || [])
    .filter((v) => v && v.is_active !== false && Number(v.price || 0) > 0)
    .map((v) => ({ ...v, grams: parseGrams(v.variant_value) }))
    .filter((v) => Number.isFinite(v.grams));

  if (!variants.length) return null;
  variants.sort((a, b) => a.grams - b.grams);
  return variants[0];
}

function competitorPrice(product) {
  return Number(product?.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || 0) || null;
}

function competitorGrams(product) {
  return (
    parseGrams(product.productName || '') ||
    parseGrams(product?.items?.[0]?.nameComplete || '') ||
    parseGrams(product?.items?.[0]?.name || '') ||
    null
  );
}

function candidateCategoryFamily(product) {
  const cats = normalize((product.categories || []).join(' '));
  if (/(despensa|conservas|dulces|licores|papeleria|cuidado personal|panaderia|bebidas)/.test(cats)) return 'processed';
  if (/(frutos secos|nueces|semillas|pasabocas)/.test(cats)) return 'dry';
  if (/(especias|condimentos)/.test(cats)) return 'spice';
  if (/(frutas y verduras| frutas | verduras |aromatica|hierbas)/.test(` ${cats} `)) return 'fresh';
  return 'other';
}

function expectedFamiliesForCategory(ourCategory = '') {
  const s = normalize(ourCategory);
  if (/(salud|semilla|nuez)/.test(s)) return new Set(['dry', 'fresh']);
  if (/(especia)/.test(s)) return new Set(['spice']);
  return new Set(['fresh']);
}

function candidateLooksProcessed(product) {
  const name = ` ${normalize(product.productName || '')} `;
  return BLOCKED_MATCH_TERMS.some((term) => name.includes(normalize(term))) || candidateCategoryFamily(product) === 'processed';
}

function categoryLooksRelevant(product, ourCategory) {
  const family = candidateCategoryFamily(product);
  return expectedFamiliesForCategory(ourCategory).has(family);
}

function scoreMatch(ourName, ourGrams, candidate, ourCategory) {
  if (candidateLooksProcessed(candidate)) return null;

  const ourTokens = new Set(tokens(ourName));
  const candidateTokens = new Set(tokens(candidate.productName || ''));
  const overlap = [...ourTokens].filter((t) => candidateTokens.has(t)).length;
  if (!overlap) return null;

  const grams = competitorGrams(candidate);
  if (!grams || !ourGrams) return null;

  const ratio = grams / ourGrams;
  if (ratio < 0.45 || ratio > 2.4) return null;

  const gramPenalty = Math.abs(Math.log(ratio));
  if (!categoryLooksRelevant(candidate, ourCategory)) return null;

  const categoryBonus = 0.8;
  const firstToken = normalize(ourName).split(' ')[0];
  const nameBonus = normalize(candidate.productName || '').includes(firstToken) ? 0.5 : 0;

  return overlap * 2 + categoryBonus + nameBonus - gramPenalty;
}

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers, redirect: 'follow' });
  if (!res.ok && res.status !== 206) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

async function fetchOwnCatalog() {
  return getJson(OWN_CATALOG_URL, {
    'x-agent-key': AGENT_KEY,
    'Accept': 'application/json',
  });
}

async function searchCompetitor(competitor, query) {
  return getJson(`${competitor.searchUrl}${encodeURIComponent(query)}`, {
    'User-Agent': 'Mozilla/5.0',
    'Accept': 'application/json',
  });
}

function buildMarkdown(report) {
  const lines = [];
  lines.push('# Reporte competencia — Tus Aguacates');
  lines.push('');
  lines.push(`- Generado: ${report.generatedAt}`);
  lines.push(`- Productos evaluados: ${report.productsEvaluated}`);
  lines.push(`- Matches encontrados: ${report.matches}`);
  lines.push(`- Competidores: ${report.competitors.join(', ')}`);
  lines.push('');

  lines.push('## Más caros que competencia');
  lines.push('');
  lines.push('| Producto | Variante | Competidor | Producto comp. | Gap % |');
  lines.push('|---|---|---|---|---:|');
  for (const row of report.topMoreExpensive) {
    lines.push(`| ${row.ownProduct} | ${row.ownVariant} | ${row.competitor} | ${row.competitorProduct} | ${row.gapPct}% |`);
  }
  lines.push('');

  lines.push('## Más baratos que competencia');
  lines.push('');
  lines.push('| Producto | Variante | Competidor | Producto comp. | Gap % |');
  lines.push('|---|---|---|---|---:|');
  for (const row of report.topCheaper) {
    lines.push(`| ${row.ownProduct} | ${row.ownVariant} | ${row.competitor} | ${row.competitorProduct} | ${row.gapPct}% |`);
  }
  lines.push('');

  lines.push('## Sin match');
  lines.push('');
  for (const row of report.unmatched.slice(0, 30)) {
    lines.push(`- ${row.ownProduct} (${row.competitor})`);
  }
  lines.push('');

  return lines.join('\n');
}

async function main() {
  const own = await fetchOwnCatalog();
  const catalog = (own.data || [])
    .filter((p) => p && p.name && !EXEMPT_PRODUCTS.has(p.name) && ownProductAllowed(p))
    .map((product) => ({ product, variant: pickReferenceVariant(product) }))
    .filter((x) => x.variant)
    .sort((a, b) => {
      const delta = categoryPriority(a.product.category?.name) - categoryPriority(b.product.category?.name);
      return delta || a.product.name.localeCompare(b.product.name, 'es');
    })
    .slice(0, MAX_PRODUCTS);

  const rows = [];
  const unmatched = [];

  for (const { product, variant } of catalog) {
    const query = tokens(product.name).slice(0, 3).join(' ') || product.name;
    for (const competitor of COMPETITORS) {
      try {
        const results = await searchCompetitor(competitor, query);
        let best = null;
        let bestScore = -Infinity;

        for (const candidate of results.slice(0, 15)) {
          const price = competitorPrice(candidate);
          if (!price) continue;
          const score = scoreMatch(product.name, variant.grams, candidate, product.category?.name || '');
          if (score == null || score < 1.6) continue;
          if (score > bestScore) {
            best = candidate;
            bestScore = score;
          }
        }

        if (!best) {
          unmatched.push({ ownProduct: product.name, competitor: competitor.name });
          continue;
        }

        const compPrice = competitorPrice(best);
        const compGrams = competitorGrams(best);
        const ownPpg = Number(variant.price) / variant.grams;
        const compPpg = compPrice / compGrams;
        const gapPct = Number((((ownPpg / compPpg) - 1) * 100).toFixed(1));

        rows.push({
          ownProduct: product.name,
          ownCategory: product.category?.name || null,
          ownVariant: variant.variant_value,
          ownPrice: Number(variant.price),
          ownGrams: variant.grams,
          competitor: competitor.name,
          competitorProduct: best.productName,
          competitorPrice: compPrice,
          competitorGrams: compGrams,
          ourPricePerKg: Number((ownPpg * 1000).toFixed(2)),
          competitorPricePerKg: Number((compPpg * 1000).toFixed(2)),
          gapPct,
          matchScore: Number(bestScore.toFixed(2)),
          query,
        });
      } catch (error) {
        unmatched.push({ ownProduct: product.name, competitor: competitor.name, error: error.message });
      }
    }
  }

  const sortedDesc = [...rows].sort((a, b) => b.gapPct - a.gapPct);
  const sortedAsc = [...rows].sort((a, b) => a.gapPct - b.gapPct);

  const report = {
    generatedAt: new Date().toISOString(),
    competitors: COMPETITORS.map((c) => c.name),
    maxProducts: MAX_PRODUCTS,
    productsEvaluated: catalog.length,
    matches: rows.length,
    topMoreExpensive: sortedDesc.slice(0, 15),
    topCheaper: sortedAsc.slice(0, 15),
    unmatched,
    rows,
  };

  const reportsDir = path.resolve(process.cwd(), 'reports');
  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(path.join(reportsDir, 'competitor-price-report-latest.json'), JSON.stringify(report, null, 2));
  await fs.writeFile(path.join(reportsDir, 'competitor-price-report-latest.md'), buildMarkdown(report));

  console.log(JSON.stringify({
    ok: true,
    generatedAt: report.generatedAt,
    productsEvaluated: report.productsEvaluated,
    matches: report.matches,
    topMoreExpensive: report.topMoreExpensive.slice(0, 5).map((r) => ({
      ownProduct: r.ownProduct,
      competitor: r.competitor,
      gapPct: r.gapPct,
    })),
    topCheaper: report.topCheaper.slice(0, 5).map((r) => ({
      ownProduct: r.ownProduct,
      competitor: r.competitor,
      gapPct: r.gapPct,
    })),
    reportJson: path.join(reportsDir, 'competitor-price-report-latest.json'),
    reportMd: path.join(reportsDir, 'competitor-price-report-latest.md'),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
