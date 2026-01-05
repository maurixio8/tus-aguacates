import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

(async () => {
  console.log('🔍 INVESTIGACIÓN COMPLETA DE PRODUCTOS B2B\n');
  console.log('='.repeat(60));

  // 1. Verificar tabla b2b_products
  console.log('\n1️⃣ TABLA: b2b_products');
  const { data: b2bProducts, count: b2bCount } = await supabase
    .from('b2b_products')
    .select('*')
    .order('created_at', { ascending: false });

  console.log(`   Total: ${b2bCount || 0} productos`);
  if (b2bProducts && b2bProducts.length > 0) {
    b2bProducts.forEach((p: any, i: number) => {
      console.log(`   ${i + 1}. ${p.sku} - ${p.name}`);
      console.log(`      Creado: ${p.created_at}`);
      console.log(`      ¿Es reciente? ${Date.now() - new Date(p.created_at).getTime() < 3600000 ? 'SÍ (última hora)' : 'NO'}`);
    });
  }

  // 2. Buscar en tabla products si hay productos con metadata B2B
  console.log('\n2️⃣ TABLA: products (buscando productos B2B)');
  const { data: allProducts } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  console.log(`   Total en products: ${allProducts?.length || 0}`);

  // Buscar productos que podrían ser B2B
  const potentialB2B = allProducts?.filter((p: any) => {
    const name = p.name?.toLowerCase() || '';
    const desc = p.description?.toLowerCase() || '';
    const metadata = JSON.stringify(p.metadata || {}).toLowerCase();

    return name.includes('mayorista') ||
           name.includes('empresas') ||
           name.includes('b2b') ||
           desc.includes('mayorista') ||
           desc.includes('empresas') ||
           desc.includes('b2b') ||
           metadata.includes('b2b') ||
           metadata.includes('wholesale');
  }) || [];

  console.log(`   Posibles productos B2B: ${potentialB2B.length}`);
  potentialB2B.forEach((p: any, i: number) => {
    console.log(`   ${i + 1}. ${p.name} (${p.category})`);
  });

  // 3. Verificar productos por categoría (aguacates, tropicales, etc)
  console.log('\n3️⃣ TABLA: products (por categorías comunes B2B)');
  const categories = ['Aguacates', 'Tropicales', 'Frutas', 'Verduras', 'Cítricos'];

  for (const cat of categories) {
    const { data: catProducts } = await supabase
      .from('products')
      .select('*')
      .ilike('category', `%${cat}%`)
      .limit(10);

    if (catProducts && catProducts.length > 0) {
      console.log(`   📦 ${cat}: ${catProducts.length} productos`);
      catProducts.forEach((p: any) => {
        console.log(`      - ${p.name}`);
      });
    }
  }

  // 4. Verificar si hay tablas con nombres similares
  console.log('\n4️⃣ Buscando otras tablas que puedan tener productos...');

  // 5. Verificar logs o cambios recientes
  console.log('\n5️⃣ PRODUCTOS B2B más recientes (si existen):');
  const { data: recentB2B } = await supabase
    .from('b2b_products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (recentB2B && recentB2B.length > 0) {
    recentB2B.forEach((p: any, i: number) => {
      const age = Date.now() - new Date(p.created_at).getTime();
      const ageInMinutes = Math.floor(age / 60000);
      console.log(`   ${i + 1}. ${p.name} (${p.sku})`);
      console.log(`      Creado hace: ${ageInMinutes} minutos`);
      console.log(`      Fecha: ${p.created_at}`);
    });
  }

  // 6. Verificar si hay productos con campo b2b_product_id en products
  console.log('\n6️⃣ Buscando referencias B2B en tabla products...');
  const { data: productsWithB2BRef } = await supabase
    .from('products')
    .select('*')
    .not('metadata', 'is', null)
    .limit(100);

  let foundB2BRef = false;
  productsWithB2BRef?.forEach((p: any) => {
    const metadata = typeof p.metadata === 'string' ? JSON.parse(p.metadata) : (p.metadata || {});
    if (metadata.is_b2b || metadata.b2b || metadata.wholesale || metadata.forBusiness) {
      if (!foundB2BRef) {
        console.log('   Productos con metadata B2B:');
        foundB2BRef = true;
      }
      console.log(`   - ${p.name}`);
      console.log(`     Metadata: ${JSON.stringify(metadata).substring(0, 100)}...`);
    }
  });

  if (!foundB2BRef) {
    console.log('   No se encontraron productos con metadata B2B');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ INVESTIGACIÓN COMPLETADA');
})();
