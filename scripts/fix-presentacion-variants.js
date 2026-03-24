/**
 * Renombra variant_name de "Presentación" a algo descriptivo
 * basado en el variant_value.
 *
 * Uso:
 *   node scripts/fix-presentacion-variants.js
 */

require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function inferVariantName(variantValue) {
  const val = (variantValue || '').toLowerCase().trim();

  // Peso en gramos
  if (/\d+\s*(gr|g|gramos)/.test(val)) return 'Peso';
  
  // Peso en kilos
  if (/\d+\s*(kg|kilo)/.test(val)) return 'Peso';
  
  // Volumen en ml
  if (/\d+\s*ml/.test(val)) return 'Volumen';
  
  // Unidades
  if (/\d+\s*(uni|unidad)/.test(val)) return 'Cantidad';
  if (/^\d+$/.test(val)) return 'Cantidad'; // Solo número
  
  // Presentaciones específicas
  if (/bandeja/.test(val)) return 'Presentación';
  if (/paquete/.test(val)) return 'Presentación';
  if (/malla/.test(val)) return 'Presentación';
  if (/caja/.test(val)) return 'Presentación';
  
  // Casos especiales
  if (val === 'unidad') return 'Cantidad';
  if (/^x\d/.test(val)) return 'Tamaño'; // Formato "x500gr"
  
  // Default
  return 'Presentación';
}

async function main() {
  console.log('🔧 Renombrando variant_name de "Presentación" a nombres descriptivos\n');

  // Obtener todas las variantes con variant_name = "Presentación"
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select('id, variant_name, variant_value, product_id, products(name)')
    .ilike('variant_name', 'Presentación')
    .eq('is_active', true);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total variantes con "Presentación": ${variants.length}\n`);

  const updates = [];
  const stats = {};

  variants.forEach(v => {
    const newName = inferVariantName(v.variant_value);
    if (newName !== 'Presentación') {
      updates.push({
        id: v.id,
        oldName: v.variant_name,
        newName: newName,
        value: v.variant_value,
        product: v.products?.name
      });
    }
    
    stats[newName] = (stats[newName] || 0) + 1;
  });

  console.log('Distribución resultante:');
  Object.entries(stats).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
    console.log(`  ${name}: ${count}`);
  });

  console.log(`\nVariantes a actualizar: ${updates.length}`);
  console.log('(Las que quedan como "Presentación" son correctas)\n');

  // Actualizar en lotes de 50
  const BATCH_SIZE = 50;
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    
    for (const update of batch) {
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({ variant_name: update.newName })
        .eq('id', update.id);

      if (updateError) {
        console.error(`❌ Error updating ${update.product}: ${updateError.message}`);
        errors++;
      } else {
        updated++;
      }
    }

    console.log(`Progreso: ${updated}/${updates.length} actualizadas`);
  }

  console.log(`\n✅ Completado:`);
  console.log(`   Actualizadas: ${updated}`);
  console.log(`   Errores: ${errors}`);
  console.log(`   Sin cambios (ya correctas): ${variants.length - updates.length}`);
}

main();
