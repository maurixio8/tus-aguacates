/**
 * Limpieza de catálogo: normaliza variantes, resuelve familias partidas
 * y limpia nombres con empaque embebido.
 *
 * Uso:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/cleanup-catalog.js
 *
 * El script es idempotente: ejecutar múltiples veces no causa daño.
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

function normalizeVariantName(variantName) {
  return normalizeText(variantName)
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

// ═══════════════════════════════════════════════════════════════
// FASE 1: Normalizar variantes inconsistentes
// ═══════════════════════════════════════════════════════════════

const VARIANT_FIXES = [
  // Aceite de coco: unificar variantes duplicadas
  {
    productName: 'Aceite de coco',
    targetValues: ['105ml', '250ml', '500ml'],
  },
  // Frijol desgranado: unificar variantes duplicadas
  {
    productName: 'Frijol desgranado',
    targetValues: ['1000gr'],
  },
  // Fresa Económica: unificar variantes duplicadas
  {
    productName: 'Fresa Economica',
    targetValues: ['500gr', '1000gr'],
  },
];

async function normalizeVariants() {
  console.log('\n═══ FASE 1: Normalizar variantes inconsistentes ═══\n');

  for (const fix of VARIANT_FIXES) {
    console.log(`\n📦 Procesando: ${fix.productName}`);

    // Buscar producto con variantes
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, product_variants(id, variant_name, variant_value, is_active)')
      .ilike('name', fix.productName)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      console.log(`   ⚠️  Producto no encontrado: ${fix.productName}`);
      continue;
    }

    const allVariants = product.product_variants || [];
    console.log(`   ✅ Producto encontrado: ${product.name} (${allVariants.length} variantes total)`);

    if (allVariants.length === 0) {
      console.log(`   ⏭️  Sin variantes, saltando`);
      continue;
    }

    // Para cada valor target, buscar variantes que normalicen a ese valor
    for (const targetValue of fix.targetValues) {
      const normalizedTarget = normalizeVariantName(targetValue);
      
      // Encontrar todas las variantes que normalizan a este valor
      const matchingVariants = allVariants.filter(v => {
        const vValue = v.variant_value || v.variant_name || '';
        return normalizeVariantName(vValue) === normalizedTarget;
      });

      if (matchingVariants.length <= 1) {
        console.log(`   ✅  ${targetValue}: ${matchingVariants.length} variante (OK)`);
        continue;
      }

      console.log(`   🔄  ${targetValue}: ${matchingVariants.length} variantes duplicadas encontradas`);

      // Mantener la primera activa, desactivar las demás
      const [keep, ...duplicates] = matchingVariants;

      // Asegurar que la que mantenemos esté activa
      if (!keep.is_active) {
        await supabase
          .from('product_variants')
          .update({ is_active: true, variant_value: targetValue })
          .eq('id', keep.id);
        console.log(`   ✅  Activada: ${keep.variant_value || keep.variant_name}`);
      }

      // Desactivar duplicados
      for (const dup of duplicates) {
        const { error: deactivateError } = await supabase
          .from('product_variants')
          .update({ is_active: false })
          .eq('id', dup.id);

        if (deactivateError) {
          console.log(`   ❌  Error desactivando ${dup.variant_value || dup.variant_name}: ${deactivateError.message}`);
        } else {
          console.log(`   ✅  Desactivada: ${dup.variant_value || dup.variant_name}`);
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// FASE 2: Resolver familias partidas
// ═══════════════════════════════════════════════════════════════

// Las familias partidas requieren decisión humana.
// Solo documentamos cuáles son para que el usuario decida.

const FAMILIES_TO_REVIEW = [
  { family: 'apio', products: ['Apio Entero paquete', 'Apio tallos bandeja'] },
  { family: 'ciruela importada', products: ['Ciruela Importada', 'Ciruela importada bandeja'] },
  { family: 'toronja', products: ['Toronja x1000 grs', 'Toronja x1kilo'] },
  { family: 'zanahoria', products: ['Zanahoria', 'Zanahoria baby'] },
];

async function reviewFamilies() {
  console.log('\n═══ FASE 2: Familias partidas (requieren revisión manual) ═══\n');

  for (const family of FAMILIES_TO_REVIEW) {
    console.log(`\n👨‍👩‍👧‍👦 Familia: ${family.family}`);

    for (const productName of family.products) {
      const { data: product, error } = await supabase
        .from('products')
        .select('id, name, product_variants(id, variant_name, is_active)')
        .ilike('name', productName)
        .eq('is_active', true)
        .single();

      if (error || !product) {
        console.log(`   ❓  ${productName}: NO ENCONTRADO`);
      } else {
        const activeVariants = product.product_variants?.filter(v => v.is_active) || [];
        console.log(`   📦  ${productName}: ${activeVariants.length} variantes activas`);
        activeVariants.forEach(v => {
          console.log(`      - ${v.variant_name}`);
        });
      }
    }
  }

  console.log('\n⚠️  DECISIÓN REQUERIDA:');
  console.log('   Para cada familia, decidir si:');
  console.log('   1. Son productos DIFERENTES → dejar como están');
  console.log('   2. Son el MISMO producto → unificar y desactivar duplicado');
  console.log('   3. Son variantes de un producto → migrar variantes y desactivar');
}

// ═══════════════════════════════════════════════════════════════
// FASE 3: Limpiar nombres con empaque embebido
// ═══════════════════════════════════════════════════════════════

// Estos son renames de productos donde el empaque está en el nombre.
// Ejemplo: "Banano criollo Kilo" → "Banano criollo"

const NAME_CLEANUPS = [
  { from: 'Ajo importado malla', to: 'Ajo importado' },
  { from: 'Apio Entero paquete', to: 'Apio Entero' },
  { from: 'Apio tallos bandeja', to: 'Apio tallos' },
  { from: 'Banano bocadillo kilo', to: 'Banano bocadillo' },
  { from: 'Banano criollo Kilo', to: 'Banano criollo' },
  { from: 'Cebolla larga malla', to: 'Cebolla larga' },
  { from: 'Champiñones tajados bandeja', to: 'Champiñones tajados' },
  { from: 'Cilantro fresco paquete', to: 'Cilantro fresco' },
  { from: 'Ciruela importada bandeja', to: 'Ciruela importada' },
  { from: 'Espinaca paquete x1 Kilo', to: 'Espinaca' },
  { from: 'Guisantes Bandeja', to: 'Guisantes' },
  { from: 'Jalapeños bandeja', to: 'Jalapeños' },
  { from: 'Mangostinos kilo', to: 'Mangostinos' },
  { from: 'Manzana bandeja combinada', to: 'Manzana combinada' },
  { from: 'Manzana roja Bandeja', to: 'Manzana roja' },
  { from: 'Manzana verde Bandeja', to: 'Manzana verde' },
  { from: 'Manzanilla paquete', to: 'Manzanilla' },
  { from: 'Mazorca sabanera x3 uni', to: 'Mazorca sabanera' },
  { from: 'Nueva Maya paquete x 7 premium', to: 'Nueva Maya premium' },
  { from: 'Nueva Maya paquete x 8 Mediano', to: 'Nueva Maya mediano' },
  { from: 'Paquete 4 Unidades injerto', to: 'Injerto 4 unidades' },
  { from: 'Paquete x 8 unidades mediano', to: 'Paquete 8 unidades mediano' },
  { from: 'Paquete x4 unidades premium', to: 'Paquete 4 unidades premium' },
  { from: 'Pitahaya morada kilo', to: 'Pitahaya morada' },
  { from: 'Platano verde x 4 Unidades', to: 'Platano verde' },
  { from: 'Rabanos x Bandeja', to: 'Rábanos' },
  { from: 'Rugula Bandeja', to: 'Rúcula' },
  { from: 'Yacon bandeja', to: 'Yacon' },
];

async function cleanNames() {
  console.log('\n═══ FASE 3: Limpiar nombres con empaque embebido ═══\n');

  for (const cleanup of NAME_CLEANUPS) {
    const { data: product, error: findError } = await supabase
      .from('products')
      .select('id, name')
      .ilike('name', cleanup.from)
      .eq('is_active', true)
      .single();

    if (findError || !product) {
      console.log(`   ⏭️  ${cleanup.from}: no encontrado`);
      continue;
    }

    if (product.name === cleanup.to) {
      console.log(`   ✅  ${cleanup.from}: ya limpio`);
      continue;
    }

    console.log(`   🔄  "${product.name}" → "${cleanup.to}"`);

    const { error: updateError } = await supabase
      .from('products')
      .update({ name: cleanup.to })
      .eq('id', product.id);

    if (updateError) {
      console.log(`   ❌  Error: ${updateError.message}`);
    } else {
      console.log(`   ✅  Renombrado`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('🧹 INICIANDO LIMPIEZA DE CATÁLOGO');
  console.log('='.repeat(50));

  try {
    await normalizeVariants();
    await reviewFamilies();
    await cleanNames();

    console.log('\n' + '='.repeat(50));
    console.log('✅ LIMPIEZA COMPLETADA');
    console.log('\n⚠️  PASOS MANUALES PENDIENTES:');
    console.log('   1. Revisar familias partidas (Fase 2) y decidir');
    console.log('   2. Ejecutar auditoría para verificar: node scripts/audit-catalog-normalization.js');
    console.log('   3. Probar en admin: lista-compras, pedidos, crear-pedido');

  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error.message);
    process.exit(1);
  }
}

main();
