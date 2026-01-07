import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

(async () => {
  console.log('🔍 Verificando categorías B2B...\n');

  const { data: categories } = await supabase
    .from('b2b_categories')
    .select('*')
    .order('slug');

  console.log('Categorías:');
  categories?.forEach((c: any) => {
    console.log(`  - ${c.name}`);
    console.log(`    ID: ${c.id}`);
    console.log(`    Slug: ${c.slug}`);
    console.log('');
  });

  console.log('\n🔍 Verificando productos Aguacate Hass...');
  const { data: hassProducts } = await supabase
    .from('b2b_products')
    .select('*')
    .ilike('name', '%Hass%');

  console.log(`\nProductos con "Hass" en el nombre: ${hassProducts?.length || 0}`);
  hassProducts?.forEach((p: any) => {
    console.log(`  - ${p.name}`);
    console.log(`    SKU: ${p.sku}`);
    console.log(`    ID: ${p.id}`);
    console.log(`    Category ID: ${p.category_id}`);
    console.log(`    Deleted at: ${p.deleted_at || 'NULL'}`);
    console.log(`    Imagen: ${p.main_image_url || 'SIN IMAGEN'}`);
    console.log('');
  });

  console.log('\n🔍 Probando API pública con category_id de Aguacates...');
  const aguacatesCat = categories?.find((c: any) => c.slug === 'aguacates');
  if (aguacatesCat) {
    console.log(`\nUsando category_id: ${aguacatesCat.id}`);

    const { data: publicProducts } = await supabase
      .from('b2b_products')
      .select('*')
      .eq('category_id', aguacatesCat.id)
      .eq('is_active', true)
      .is('deleted_at', null);

    console.log(`Productos devueltos por query pública: ${publicProducts?.length || 0}`);
    publicProducts?.forEach((p: any) => {
      console.log(`  - ${p.name}`);
      console.log(`    Imagen: ${p.main_image_url ? 'SÍ' : 'NO'}`);
    });
  }
})();
