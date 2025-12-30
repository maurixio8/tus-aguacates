/**
 * Script para poblar datos iniciales B2B
 * Uso: node scripts/populate-b2b-data.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridos');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function populateB2BData() {
  console.log('🚀 Poblando datos iniciales B2B...\n');

  try {
    // 1. Crear categorías B2B
    console.log('📁 Creando categorías B2B...');
    const categories = [
      { id: '11111111-1111-1111-1111-111111111111', name: 'Frutas Frescas', slug: 'frutas-frescas', description: 'Amplia variedad de frutas frescas', sort_order: 1 },
      { id: '22222222-2222-2222-2222-222222222222', name: 'Verduras y Hortalizas', slug: 'verduras-hortalizas', description: 'Verduras y hortalizas de calidad', sort_order: 2 },
      { id: '33333333-3333-3333-3333-333333333333', name: 'Frutas Tropicales', slug: 'frutas-tropicales', description: 'Frutas tropicales colombianas', sort_order: 3 },
      { id: '44444444-4444-4444-4444-444444444444', name: 'Aguacates', slug: 'aguacates', description: 'Aguacates de diferentes variedades', sort_order: 4 },
    ];

    for (const cat of categories) {
      const { error } = await supabase
        .from('b2b_categories')
        .upsert(cat, { onConflict: 'id' });
      if (error) console.error('  ❌ Error categoría', cat.name, error.message);
      else console.log(`  ✓ ${cat.name}`);
    }

    // 2. Importar productos B2C a B2B
    console.log('\n📦 Importando productos B2B desde B2C (top 50)...');
    const { data: b2cProducts, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (fetchError) throw fetchError;

    const categoryMap = {
      'Frutas Tropicales': '33333333-3333-3333-3333-333333333333',
      'Aguacates': '44444444-4444-4444-4444-444444444444',
      'default': '11111111-1111-1111-1111-111111111111',
    };

    let importedCount = 0;
    for (const product of b2cProducts) {
      const categoryId = categoryMap[product.category] || categoryMap['default'];

      const b2bProduct = {
        sku: `B2B-${product.sku}`,
        name: product.name,
        description: product.description,
        category_id: categoryId,
        base_price: Math.round(product.price * 0.80 * 100) / 100, // 20% dto base
        stock_quantity: product.stock || 100,
        minimum_order_quantity: 5,
        unit: product.unit || 'unit',
        is_active: true,
        is_featured: product.is_featured || false,
        main_image_url: product.main_image_url,
        images: product.images || [],
        b2c_product_id: product.id,
      };

      const { error } = await supabase
        .from('b2b_products')
        .upsert(b2bProduct, { onConflict: 'sku' });

      if (!error) importedCount++;
    }
    console.log(`  ✓ ${importedCount} productos importados`);

    // 3. Crear pricing tiers
    console.log('\n💰 Creando pricing tiers (descuentos por volumen)...');
    const { data: b2bProducts } = await supabase
      .from('b2b_products')
      .select('id, base_price')
      .eq('is_active', true);

    const tiers = [];
    for (const product of b2bProducts || []) {
      // Tier 1: 10-25 = 10% dto
      tiers.push({
        product_id: product.id,
        min_quantity: 10,
        max_quantity: 25,
        tier_name: '10% dto (10-25)',
        price_per_unit: Math.round(product.base_price * 0.90 * 100) / 100,
        discount_percentage: 10,
        priority: 1,
      });
      // Tier 2: 26-50 = 20% dto
      tiers.push({
        product_id: product.id,
        min_quantity: 26,
        max_quantity: 50,
        tier_name: '20% dto (26-50)',
        price_per_unit: Math.round(product.base_price * 0.80 * 100) / 100,
        discount_percentage: 20,
        priority: 2,
      });
      // Tier 3: 51+ = 30% dto
      tiers.push({
        product_id: product.id,
        min_quantity: 51,
        max_quantity: null,
        tier_name: '30% dto (51+)',
        price_per_unit: Math.round(product.base_price * 0.70 * 100) / 100,
        discount_percentage: 30,
        priority: 3,
      });
    }

    const { error: tiersError } = await supabase
      .from('b2b_pricing_tiers')
      .insert(tiers);

    if (tiersError) {
      console.log('  ℹ️  Pricing tiers ya existen o error:', tiersError.message);
    } else {
      console.log(`  ✓ ${tiers.length} pricing tiers creados`);
    }

    // 4. Resumen
    console.log('\n📊 Resumen:');
    const { count: catCount } = await supabase.from('b2b_categories').select('*', { count: 'exact', head: true });
    const { count: prodCount } = await supabase.from('b2b_products').select('*', { count: 'exact', head: true });
    const { count: tiersCount } = await supabase.from('b2b_pricing_tiers').select('*', { count: 'exact', head: true });

    console.log(`  Categorías: ${catCount}`);
    console.log(`  Productos: ${prodCount}`);
    console.log(`  Pricing Tiers: ${tiersCount}`);

    console.log('\n✅ Datos B2B iniciales poblados exitosamente!');
    console.log('\n🌐 Visita: http://localhost:3000/empresas');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

populateB2BData();
