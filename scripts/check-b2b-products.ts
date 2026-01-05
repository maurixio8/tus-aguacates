/**
 * Script de diagnóstico para verificar productos B2B en la base de datos
 * Ejecutar con: npx tsx scripts/check-b2b-products.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: No se encontraron las variables de entorno');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

async function checkB2BProducts() {
  console.log('🔍 Verificando productos B2B en la base de datos...\n');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Contar total de productos
  console.log('1️⃣ Contando productos en b2b_products...');
  const { count: totalCount, error: countError } = await supabase
    .from('b2b_products')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error contando productos:', countError);
    return;
  }
  console.log(`   Total de productos: ${totalCount || 0}\n`);

  // 2. Contar productos sin deleted_at (activos)
  console.log('2️⃣ Contando productos activos (sin deleted_at)...');
  const { count: activeCount, error: activeCountError } = await supabase
    .from('b2b_products')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  if (activeCountError) {
    console.error('❌ Error contando productos activos:', activeCountError);
  } else {
    console.log(`   Productos activos: ${activeCount || 0}\n`);
  }

  // 3. Obtener muestra de productos (todos)
  console.log('3️⃣ Obteniendo muestra de productos (todos)...');
  const { data: allProducts, error: allProductsError } = await supabase
    .from('b2b_products')
    .select('*')
    .limit(5);

  if (allProductsError) {
    console.error('❌ Error obteniendo productos:', allProductsError);
  } else {
    console.log(`   Muestra de productos (${allProducts?.length || 0} registros):`);
    allProducts?.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.sku} - ${p.name}`);
      console.log(`      - ID: ${p.id}`);
      console.log(`      - Precio: $${p.base_price}`);
      console.log(`      - Stock: ${p.stock_quantity}`);
      console.log(`      - Activo: ${p.is_active}`);
      console.log(`      - Deleted_at: ${p.deleted_at || 'NULL'}`);
      console.log(`      - Categoría: ${p.category_id || 'NULL'}`);
      console.log('');
    });
  }

  // 4. Obtener solo productos activos
  console.log('4️⃣ Obteniendo productos activos (deleted_at IS NULL)...');
  const { data: activeProducts, error: activeProductsError } = await supabase
    .from('b2b_products')
    .select('*')
    .is('deleted_at', null)
    .limit(5);

  if (activeProductsError) {
    console.error('❌ Error obteniendo productos activos:', activeProductsError);
  } else {
    console.log(`   Productos activos: ${activeProducts?.length || 0} registros`);
    if (activeProducts && activeProducts.length > 0) {
      activeProducts.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.sku} - ${p.name}`);
      });
    }
    console.log('');
  }

  // 5. Verificar si hay productos con deleted_at
  console.log('5️⃣ Buscando productos con deleted_at (borrados)...');
  const { data: deletedProducts, error: deletedError } = await supabase
    .from('b2b_products')
    .select('*')
    .not('deleted_at', 'is', null)
    .limit(5);

  if (deletedError) {
    console.error('❌ Error obteniendo productos borrados:', deletedError);
  } else {
    console.log(`   Productos borrados: ${deletedProducts?.length || 0} registros`);
    if (deletedProducts && deletedProducts.length > 0) {
      deletedProducts.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.sku} - ${p.name} (borrado: ${p.deleted_at})`);
      });
    }
    console.log('');
  }

  // 6. Verificar categorías
  console.log('6️⃣ Verificando categorías B2B...');
  const { data: categories, error: categoriesError } = await supabase
    .from('b2b_categories')
    .select('*');

  if (categoriesError) {
    console.error('❌ Error obteniendo categorías:', categoriesError);
  } else {
    console.log(`   Total de categorías: ${categories?.length || 0}`);
    categories?.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} (${c.slug})`);
    });
  }

  console.log('\n✅ Diagnóstico completado');
}

checkB2BProducts().catch(console.error);
