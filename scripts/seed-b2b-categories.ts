import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

(async () => {
  console.log('🌱 Creando categorías B2B...');

  // Crear categorías con columnas correctas según el esquema
  const categories = [
    { name: 'Aguacates', slug: 'aguacates', description: 'Aguacates premium al por mayor', sort_order: 1, is_active: true },
    { name: 'Frutas Tropicales', slug: 'tropicales', description: 'Frutas tropicales frescas', sort_order: 2, is_active: true },
    { name: 'Verduras', slug: 'verduras', description: 'Verduras de hoja y raíz', sort_order: 3, is_active: true },
    { name: 'Cítricos', slug: 'citricos', description: 'Naranjas, limones y más', sort_order: 4, is_active: true },
    { name: 'Hortalizas', slug: 'hortalizas', description: 'Hortalizas variadas', sort_order: 5, is_active: true },
    { name: 'Frutas de Hueso', slug: 'frutas-hueso', description: 'Duraznos, ciruelas, etc.', sort_order: 6, is_active: true },
    { name: 'Bolsos y Cajas', slug: 'bolsos-cajas', description: 'Presentaciones en empaque', sort_order: 7, is_active: true },
  ];

  const { data, error } = await supabase
    .from('b2b_categories')
    .insert(categories)
    .select();

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Categorías creadas:', data?.length || 0);
    data?.forEach((c: any, i: number) => {
      console.log(`   ${i + 1}. ${c.name} (ID: ${c.id})`);
    });
  }

  // Actualizar productos con categoría correcta
  console.log('\n🔗 Asignando categorías a productos...');

  const aguacatesCat = data?.find((c: any) => c.slug === 'aguacates');
  const tropicalesCat = data?.find((c: any) => c.slug === 'tropicales');

  if (aguacatesCat) {
    await supabase
      .from('b2b_products')
      .update({ category_id: aguacatesCat.id })
      .like('sku', 'B2B-AGUACATE%');
    console.log('✅ Aguacates asignados a categoría Aguacates');
  }

  if (tropicalesCat) {
    await supabase
      .from('b2b_products')
      .update({ category_id: tropicalesCat.id })
      .in('sku', ['B2B-MANGO-TOMMY', 'B2B-PIña-MD2']);
    console.log('✅ Tropicales asignados a categoría Tropicales');
  }

  console.log('\n✅ Listo');
})();
