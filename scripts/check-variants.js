// Verificar variantes en Supabase
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gxqkmaaqoehydulksudj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDI5NDQsImV4cCI6MjA3ODAxODk0NH0.XAR-ysQgt0ZkRZfIZx_DvpYMzmEMFsdAYK3EP1tc0mw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkVariants() {
  console.log('🔍 Verificando variantes en Supabase...\n');

  // Contar variantes
  const { count, error: countError } = await supabase
    .from('product_variants')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error contando variantes:', countError);
    return;
  }

  console.log(`📊 Total de variantes en la tabla: ${count}\n`);

  // Obtener algunas variantes de ejemplo
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select('*, products:product_id(name)')
    .limit(5);

  if (error) {
    console.error('❌ Error obteniendo variantes:', error);
    return;
  }

  console.log('📋 Ejemplos de variantes:');
  variants.forEach(v => {
    console.log(`   - ${v.products?.name || 'Sin producto'}: ${v.variant_value} (${v.price_adjustment} COP)`);
  });

  // Verificar productos con variantes
  const { data: productsWithVariants, error: prodError } = await supabase
    .from('products')
    .select(`
      id,
      name,
      product_variants(id, variant_value, price_adjustment)
    `)
    .not('product_variants', 'is', null)
    .limit(5);

  if (prodError) {
    console.error('\n❌ Error en query con join:', prodError);
  } else {
    console.log('\n📦 Productos con variantes (usando join):');
    productsWithVariants?.forEach(p => {
      if (p.product_variants && p.product_variants.length > 0) {
        console.log(`   - ${p.name}: ${p.product_variants.length} variantes`);
      }
    });
  }
}

checkVariants().catch(console.error);
