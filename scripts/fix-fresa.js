require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function normalizeVariantName(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^x\s*/i, '')
    .replace(/\bgramos\b/g, 'gr')
    .replace(/grs\b/g, 'gr')  // Sin \b al inicio para que funcione después de números
    .replace(/(\d)\s+(gr|kg|ml)/g, '$1$2');
}

async function fixFresa() {
  const { data: product } = await supabase
    .from('products')
    .select('id, name, product_variants(id, variant_value, is_active)')
    .ilike('name', 'Fresa Económica')
    .eq('is_active', true)
    .single();

  console.log('Producto:', product.name);
  console.log('Variantes:');
  
  const normalizedMap = {};
  product.product_variants.forEach(v => {
    const normalized = normalizeVariantName(v.variant_value);
    if (!normalizedMap[normalized]) normalizedMap[normalized] = [];
    normalizedMap[normalized].push(v);
    console.log(`  '${v.variant_value}' → '${normalized}' (active: ${v.is_active})`);
  });

  for (const [normalized, variants] of Object.entries(normalizedMap)) {
    if (variants.length > 1) {
      console.log(`\n🔄 Unificando ${variants.length} variantes a '${normalized}'`);
      const [keep, ...dupes] = variants;
      for (const dup of dupes) {
        await supabase.from('product_variants').update({ is_active: false }).eq('id', dup.id);
        console.log(`  ✅ Desactivada: ${dup.variant_value}`);
      }
    }
  }
}
fixFresa();
