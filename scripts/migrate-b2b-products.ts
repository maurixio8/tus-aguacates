/**
 * Migrar los 31 productos HARDCODED de lib/business-products.ts
 * a la tabla b2b_products de Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function migrateB2BProducts() {
  console.log('🔄 Migrando 31 productos B2B a Supabase...\n');

  // 1. Borrar los 4 productos de prueba que creé
  console.log('1️⃣ Limpiando productos de prueba...');
  const { data: existingProducts } = await supabase
    .from('b2b_products')
    .select('id, sku');

  if (existingProducts && existingProducts.length > 0) {
    for (const product of existingProducts) {
      await supabase.from('b2b_pricing_tiers').delete().eq('product_id', product.id);
    }
    await supabase.from('b2b_products').delete().in('sku', [
      'B2B-AGUACATE-HASS',
      'B2B-AGUACATE-FUERTE',
      'B2B-MANGO-TOMMY',
      'B2B-PIña-MD2'
    ]);
    console.log('✅ Productos de prueba eliminados');
  }

  // 2. Borrar categorías existentes y crear las correctas
  console.log('\n2️⃣ Recreando categorías...');
  await supabase.from('b2b_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const categories = [
    { name: 'Aguacates', slug: 'aguacates', description: '4 variedades × 3 estados de maduración', sort_order: 1, is_active: true },
    { name: 'Frutas Tropicales', slug: 'frutas-tropicales', description: 'Frutas tropicales frescas', sort_order: 2, is_active: true },
    { name: 'Frutos Rojos', slug: 'frutos-rojos', description: 'Alta demanda en pastelería', sort_order: 3, is_active: true },
    { name: 'Gourmet', slug: 'gourmet', description: 'Verduras esenciales en cocina', sort_order: 4, is_active: true },
    { name: 'Aromáticas', slug: 'aromaticas', description: 'Hierbas frescas aromáticas', sort_order: 5, is_active: true },
    { name: 'Saludables', slug: 'saludables', description: 'Superfoods y productos saludables', sort_order: 6, is_active: true },
    { name: 'Desgranados', slug: 'desgranados', description: 'Verduras desgranadas frescas', sort_order: 7, is_active: true },
  ];

  const { data: createdCategories } = await supabase
    .from('b2b_categories')
    .insert(categories)
    .select();

  console.log(`✅ ${createdCategories?.length || 0} categorías creadas`);

  // Obtener IDs de categorías
  const aguacatesCat = createdCategories?.find((c: any) => c.slug === 'aguacates');
  const tropicalesCat = createdCategories?.find((c: any) => c.slug === 'frutas-tropicales');
  const rojosCat = createdCategories?.find((c: any) => c.slug === 'frutos-rojos');
  const gourmetCat = createdCategories?.find((c: any) => c.slug === 'gourmet');
  const aromaticasCat = createdCategories?.find((c: any) => c.slug === 'aromaticas');
  const saludablesCat = createdCategories?.find((c: any) => c.slug === 'saludables');
  const desgranadosCat = createdCategories?.find((c: any) => c.slug === 'desgranados');

  // 3. Crear los 31 productos
  console.log('\n3️⃣ Creando 31 productos B2B...');

  // AGUACATES - 12 productos (4 variedades × 3 estados)
  const aguacates = [
    // Hass
    {
      sku: 'B2B-HASS-VERDE', name: 'Aguacate Hass Verde',
      description: 'Aguacate Hass en estado verde, ideal para maduración controlada. Madura en 4-7 días.',
      category_id: aguacatesCat?.id,
      base_price: 9000, cost_price: 6500, stock_quantity: 200, minimum_order_quantity: 5, unit: 'kg',
      is_active: true, is_featured: true,
      specifications: { variedad: 'Hass', madurez: 'verde', dias_maduracion: '4-7 días' },
    },
    {
      sku: 'B2B-HASS-PINTON', name: 'Aguacate Hass Pintón',
      description: 'Aguacate Hass pintón, listo para consumo en 1-3 días.',
      category_id: aguacatesCat?.id,
      base_price: 10000, cost_price: 7500, stock_quantity: 150, minimum_order_quantity: 5, unit: 'kg',
      is_active: true, is_featured: true,
      specifications: { variedad: 'Hass', madurez: 'pintón', dias_maduracion: '1-3 días' },
    },
    {
      sku: 'B2B-HASS-MADURO', name: 'Aguacate Hass Maduro',
      description: 'Aguacate Hass maduro, listo para consumo inmediato. Máximo 2-3 días.',
      category_id: aguacatesCat?.id,
      base_price: 11000, cost_price: 8500, stock_quantity: 100, minimum_order_quantity: 5, unit: 'kg',
      is_active: true, is_featured: true,
      specifications: { variedad: 'Hass', madurez: 'maduro', dias_maduracion: '0-2 días' },
    },
    // Papelillo/Lorena
    {
      sku: 'B2B-PAPELILLO-VERDE', name: 'Aguacate Papelillo Verde',
      description: 'Aguacate Papelillo (Lorena) verde. Madura en ~5 días.',
      category_id: aguacatesCat?.id,
      base_price: 8000, cost_price: 6000, stock_quantity: 150, minimum_order_quantity: 5, unit: 'kg',
      is_active: true, is_featured: false,
      specifications: { variedad: 'Papelillo/Lorena', madurez: 'verde', dias_maduracion: '~5 días' },
    },
    {
      sku: 'B2B-PAPELILLO-PINTON', name: 'Aguacate Papelillo Pintón',
      description: 'Aguacate Papelillo (Lorena) pintón. Listo en 1-3 días.',
      category_id: aguacatesCat?.id,
      base_price: 9000, cost_price: 7000, stock_quantity: 120, minimum_order_quantity: 5, unit: 'kg',
      is_active: true, is_featured: false,
      specifications: { variedad: 'Papelillo/Lorena', madurez: 'pintón', dias_maduracion: '1-3 días' },
    },
    {
      sku: 'B2B-PAPELILLO-MADURO', name: 'Aguacate Papelillo Maduro',
      description: 'Aguacate Papelillo (Lorena) maduro, consumo inmediato.',
      category_id: aguacatesCat?.id,
      base_price: 10000, cost_price: 8000, stock_quantity: 80, minimum_order_quantity: 5, unit: 'kg',
      is_active: true, is_featured: false,
      specifications: { variedad: 'Papelillo/Lorena', madurez: 'maduro', dias_maduracion: '0-2 días' },
    },
    // Semil
    {
      sku: 'B2B-SEMIL-VERDE', name: 'Aguacate Semil Verde',
      description: 'Aguacate Semil verde. Madura en ~6 días.',
      category_id: aguacatesCat?.id,
      base_price: 8400, cost_price: 6400, stock_quantity: 150, minimum_order_quantity: 5, unit: 'kg',
      is_active: true, is_featured: false,
      specifications: { variedad: 'Semil', madurez: 'verde', dias_maduracion: '~6 días' },
    },
    {
      sku: 'B2B-SEMIL-PINTON', name: 'Aguacate Semil Pintón',
      description: 'Aguacate Semil pintón. Listo en 1-3 días.',
      category_id: aguacatesCat?.id,
      base_price: 9400, cost_price: 7400, stock_quantity: 120, minimum_order_quantity: 5, unit: 'kg',
      is_active: true, is_featured: false,
      specifications: { variedad: 'Semil', madurez: 'pintón', dias_maduracion: '1-3 días' },
    },
    {
      sku: 'B2B-SEMIL-MADURO', name: 'Aguacate Semil Maduro',
      description: 'Aguacate Semil maduro, consumo inmediato.',
      category_id: aguacatesCat?.id,
      base_price: 10400, cost_price: 8400, stock_quantity: 80, minimum_order_quantity: 5, unit: 'kg',
      is_active: true, is_featured: false,
      specifications: { variedad: 'Semil', madurez: 'maduro', dias_maduracion: '0-2 días' },
    },
    // Choquette
    {
      sku: 'B2B-CHOQUETTE-VERDE', name: 'Aguacate Choquette Verde',
      description: 'Aguacate Choquette verde, variedad grande y cremosa.',
      category_id: aguacatesCat?.id,
      base_price: 9600, cost_price: 7600, stock_quantity: 120, minimum_order_quantity: 5, unit: 'kg',
      is_active: true, is_featured: false,
      specifications: { variedad: 'Choquette', madurez: 'verde', dias_maduracion: '5-7 días' },
    },
    {
      sku: 'B2B-CHOQUETTE-PINTON', name: 'Aguacate Choquette Pintón',
      description: 'Aguacate Choquette pintón. Listo en 1-3 días.',
      category_id: aguacatesCat?.id,
      base_price: 10600, cost_price: 8600, stock_quantity: 100, minimum_order_quantity: 5, unit: 'kg',
      is_active: true, is_featured: false,
      specifications: { variedad: 'Choquette', madurez: 'pintón', dias_maduracion: '1-3 días' },
    },
    {
      sku: 'B2B-CHOQUETTE-MADURO', name: 'Aguacate Choquette Maduro',
      description: 'Aguacate Choquette maduro, textura cremosa excepcional.',
      category_id: aguacatesCat?.id,
      base_price: 11600, cost_price: 9600, stock_quantity: 80, minimum_order_quantity: 5, unit: 'kg',
      is_active: true, is_featured: false,
      specifications: { variedad: 'Choquette', madurez: 'maduro', dias_maduracion: '0-2 días' },
    },
  ];

  // FRUTAS TROPICALES - 5 productos
  const tropicales = [
    {
      sku: 'B2B-LIMON-TAHITI', name: 'Limón Tahití',
      description: 'Limón Tahití fresco, ideal para bebidas, coctelería y cocina.',
      category_id: tropicalesCat?.id,
      base_price: 7000, cost_price: 5000, stock_quantity: 200, minimum_order_quantity: 3, unit: 'kg',
      is_active: true, is_featured: true,
    },
    {
      sku: 'B2B-NARANJA-VALENCIA', name: 'Naranja Valencia',
      description: 'Naranja Valencia para jugo, ideal para desayunos en hoteles.',
      category_id: tropicalesCat?.id,
      base_price: 6000, cost_price: 4000, stock_quantity: 180, minimum_order_quantity: 5, unit: 'kg',
      is_active: true, is_featured: false,
    },
    {
      sku: 'B2B-BANANO-CRIOLLO', name: 'Banano Criollo',
      description: 'Banano criollo colombiano, esencial para desayunos y postres.',
      category_id: tropicalesCat?.id,
      base_price: 4000, cost_price: 2500, stock_quantity: 250, minimum_order_quantity: 5, unit: 'kg',
      is_active: true, is_featured: false,
    },
    {
      sku: 'B2B-MANGO-AZUCAR', name: 'Mango de Azúcar',
      description: 'Mango de azúcar dulce y aromático para postres y jugos.',
      category_id: tropicalesCat?.id,
      base_price: 10000, cost_price: 7000, stock_quantity: 150, minimum_order_quantity: 3, unit: 'kg',
      is_active: true, is_featured: true,
    },
    {
      sku: 'B2B-LULO', name: 'Lulo',
      description: 'Lulo fresco para jugos, una de las frutas más demandadas.',
      category_id: tropicalesCat?.id,
      base_price: 10000, cost_price: 7000, stock_quantity: 120, minimum_order_quantity: 3, unit: 'kg',
      is_active: true, is_featured: false,
    },
  ];

  // FRUTOS ROJOS - 3 productos
  const rojos = [
    {
      sku: 'B2B-FRESAS-PREMIUM', name: 'Fresas Premium',
      description: 'Fresas premium para postres, decoración y coctelería.',
      category_id: rojosCat?.id,
      base_price: 12000, cost_price: 9000, stock_quantity: 100, minimum_order_quantity: 3, unit: 'kg',
      is_active: true, is_featured: true,
    },
    {
      sku: 'B2B-ARANDANOS', name: 'Arándanos Orgánicos',
      description: 'Arándanos orgánicos, superfood muy demandado.',
      category_id: rojosCat?.id,
      base_price: 75000, cost_price: 60000, stock_quantity: 50, minimum_order_quantity: 1, unit: 'kg',
      is_active: true, is_featured: true,
    },
    {
      sku: 'B2B-MORA', name: 'Mora de Castilla',
      description: 'Mora de castilla fresca para jugos, postres y salsas.',
      category_id: rojosCat?.id,
      base_price: 9000, cost_price: 6500, stock_quantity: 120, minimum_order_quantity: 3, unit: 'kg',
      is_active: true, is_featured: false,
    },
  ];

  // GOURMET - 7 productos
  const gourmet = [
    {
      sku: 'B2B-TOMATE-CHONTO', name: 'Tomate Chonto',
      description: 'Tomate chonto fresco, ingrediente básico.',
      category_id: gourmetCat?.id,
      base_price: 4000, cost_price: 2800, stock_quantity: 200, minimum_order_quantity: 5, unit: 'kg',
      is_active: true, is_featured: false,
    },
    {
      sku: 'B2B-CEBOLLA-CABEZONA', name: 'Cebolla Cabezona Blanca',
      description: 'Cebolla cabezona blanca, esencial en cocina profesional.',
      category_id: gourmetCat?.id,
      base_price: 3500, cost_price: 2500, stock_quantity: 180, minimum_order_quantity: 5, unit: 'kg',
      is_active: true, is_featured: false,
    },
    {
      sku: 'B2B-PIMENTON', name: 'Pimentón Mixto',
      description: 'Pimentón rojo, verde y amarillo para todo tipo de platos.',
      category_id: gourmetCat?.id,
      base_price: 9000, cost_price: 6500, stock_quantity: 150, minimum_order_quantity: 3, unit: 'kg',
      is_active: true, is_featured: false,
    },
    {
      sku: 'B2B-ZANAHORIA', name: 'Zanahoria',
      description: 'Zanahoria fresca para ensaladas, sopas y guarniciones.',
      category_id: gourmetCat?.id,
      base_price: 3000, cost_price: 2000, stock_quantity: 200, minimum_order_quantity: 5, unit: 'kg',
      is_active: true, is_featured: false,
    },
    {
      sku: 'B2B-AJO', name: 'Ajo Nacional',
      description: 'Ajo nacional fresco, ingrediente esencial.',
      category_id: gourmetCat?.id,
      base_price: 40000, cost_price: 30000, stock_quantity: 80, minimum_order_quantity: 1, unit: 'kg',
      is_active: true, is_featured: false,
    },
    {
      sku: 'B2B-CHAMPINONES', name: 'Champiñones Enteros',
      description: 'Champiñones blancos frescos, versátiles.',
      category_id: gourmetCat?.id,
      base_price: 30000, cost_price: 22000, stock_quantity: 100, minimum_order_quantity: 2, unit: 'kg',
      is_active: true, is_featured: false,
    },
    {
      sku: 'B2B-LECHUGA', name: 'Lechuga Hidropónica',
      description: 'Lechuga hidropónica premium para ensaladas.',
      category_id: gourmetCat?.id,
      base_price: 4500, cost_price: 3000, stock_quantity: 150, minimum_order_quantity: 10, unit: 'unit',
      is_active: true, is_featured: false,
    },
  ];

  // AROMATICAS - 2 productos
  const aromaticas = [
    {
      sku: 'B2B-CILANTRO', name: 'Cilantro Fresco',
      description: 'Cilantro fresco, aromático esencial.',
      category_id: aromaticasCat?.id,
      base_price: 24000, cost_price: 18000, stock_quantity: 100, minimum_order_quantity: 1, unit: 'kg',
      is_active: true, is_featured: false,
    },
    {
      sku: 'B2B-ALBAHACA', name: 'Albahaca Fresca',
      description: 'Albahaca fresca para pastas y pizzas.',
      category_id: aromaticasCat?.id,
      base_price: 60000, cost_price: 45000, stock_quantity: 60, minimum_order_quantity: 1, unit: 'kg',
      is_active: true, is_featured: false,
    },
  ];

  // SALUDABLES - 1 producto
  const saludables = [
    {
      sku: 'B2B-JENGUIBRE', name: 'Jengibre Fresco',
      description: 'Jengibre fresco, superfood para bebidas y cocina.',
      category_id: saludablesCat?.id,
      base_price: 36000, cost_price: 28000, stock_quantity: 80, minimum_order_quantity: 1, unit: 'kg',
      is_active: true, is_featured: false,
    },
  ];

  // DESGRANADOS - 1 producto
  const desgranados = [
    {
      sku: 'B2B-ARVEJA', name: 'Arveja Desgranada',
      description: 'Arveja desgranada fresca, lista para cocinar.',
      category_id: desgranadosCat?.id,
      base_price: 12000, cost_price: 9000, stock_quantity: 120, minimum_order_quantity: 3, unit: 'kg',
      is_active: true, is_featured: false,
    },
  ];

  // Combinar todos
  const allProducts = [
    ...aguacates,
    ...tropicales,
    ...rojos,
    ...gourmet,
    ...aromaticas,
    ...saludables,
    ...desgranados,
  ];

  console.log(`   Insertando ${allProducts.length} productos...`);

  const { data: createdProducts, error: insertError } = await supabase
    .from('b2b_products')
    .insert(allProducts)
    .select();

  if (insertError) {
    console.error('❌ Error insertando productos:', insertError);
    console.error('   Detalles:', JSON.stringify(insertError, null, 2));
  } else {
    console.log(`✅ ${createdProducts?.length || 0} productos creados`);
  }

  // 4. Crear pricing tiers para cada producto
  console.log('\n4️⃣ Creando pricing tiers...');

  let totalTiers = 0;

  for (const product of (createdProducts || [])) {
    let tiers = [];

    // Definir tiers según el producto
    if (product.name.includes('Hass') || product.name.includes('Papelillo') ||
        product.name.includes('Semil') || product.name.includes('Choquette')) {
      // Aguacates - tiers específicos
      const basePrice = product.base_price;
      tiers = [
        { product_id: product.id, min_quantity: 5, max_quantity: 20, price_per_unit: basePrice, tier_name: '5-20 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 20, max_quantity: 100, price_per_unit: basePrice * 0.89, tier_name: '20-100 kg', discount_percentage: 11 },
        { product_id: product.id, min_quantity: 100, max_quantity: 300, price_per_unit: basePrice * 0.78, tier_name: '100-300 kg', discount_percentage: 22 },
      ];
    } else if (product.name.includes('Limón')) {
      tiers = [
        { product_id: product.id, min_quantity: 3, max_quantity: 10, price_per_unit: 7000, tier_name: '3-10 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 10, max_quantity: 50, price_per_unit: 6500, tier_name: '10-50 kg', discount_percentage: 7 },
        { product_id: product.id, min_quantity: 50, max_quantity: 100, price_per_unit: 6000, tier_name: '50-100 kg', discount_percentage: 14 },
      ];
    } else if (product.name.includes('Naranja')) {
      tiers = [
        { product_id: product.id, min_quantity: 5, max_quantity: 20, price_per_unit: 6000, tier_name: '5-20 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 20, max_quantity: 50, price_per_unit: 5500, tier_name: '20-50 kg', discount_percentage: 8 },
        { product_id: product.id, min_quantity: 50, max_quantity: 100, price_per_unit: 5000, tier_name: '50-100 kg', discount_percentage: 17 },
      ];
    } else if (product.name.includes('Banano')) {
      tiers = [
        { product_id: product.id, min_quantity: 5, max_quantity: 20, price_per_unit: 4000, tier_name: '5-20 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 20, max_quantity: 50, price_per_unit: 3500, tier_name: '20-50 kg', discount_percentage: 13 },
        { product_id: product.id, min_quantity: 50, max_quantity: 100, price_per_unit: 3000, tier_name: '50-100 kg', discount_percentage: 25 },
      ];
    } else if (product.name.includes('Mango') || product.name.includes('Lulo')) {
      tiers = [
        { product_id: product.id, min_quantity: 3, max_quantity: 10, price_per_unit: product.base_price, tier_name: '3-10 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 10, max_quantity: 30, price_per_unit: product.base_price * 0.85, tier_name: '10-30 kg', discount_percentage: 15 },
        { product_id: product.id, min_quantity: 30, max_quantity: 50, price_per_unit: product.base_price * 0.8, tier_name: '30-50 kg', discount_percentage: 20 },
      ];
    } else if (product.name.includes('Fresas')) {
      tiers = [
        { product_id: product.id, min_quantity: 3, max_quantity: 10, price_per_unit: 12000, tier_name: '3-10 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 10, max_quantity: 30, price_per_unit: 10200, tier_name: '10-30 kg', discount_percentage: 15 },
        { product_id: product.id, min_quantity: 30, max_quantity: 50, price_per_unit: 9600, tier_name: '30-50 kg', discount_percentage: 20 },
      ];
    } else if (product.name.includes('Arándanos')) {
      tiers = [
        { product_id: product.id, min_quantity: 1, max_quantity: 5, price_per_unit: 75000, tier_name: '1-5 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 5, max_quantity: 15, price_per_unit: 67500, tier_name: '5-15 kg', discount_percentage: 10 },
        { product_id: product.id, min_quantity: 15, max_quantity: 30, price_per_unit: 60000, tier_name: '15-30 kg', discount_percentage: 20 },
      ];
    } else if (product.name.includes('Mora')) {
      tiers = [
        { product_id: product.id, min_quantity: 3, max_quantity: 10, price_per_unit: 9000, tier_name: '3-10 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 10, max_quantity: 30, price_per_unit: 8500, tier_name: '10-30 kg', discount_percentage: 6 },
        { product_id: product.id, min_quantity: 30, max_quantity: 50, price_per_unit: 8000, tier_name: '30-50 kg', discount_percentage: 11 },
      ];
    } else if (product.name.includes('Tomate') || product.name.includes('Cebolla') ||
               product.name.includes('Zanahoria') || product.name.includes('Arveja')) {
      const basePrice = product.base_price;
      tiers = [
        { product_id: product.id, min_quantity: 5, max_quantity: 20, price_per_unit: basePrice, tier_name: '5-20 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 20, max_quantity: 50, price_per_unit: basePrice * 0.875, tier_name: '20-50 kg', discount_percentage: 13 },
        { product_id: product.id, min_quantity: 50, max_quantity: 100, price_per_unit: basePrice * 0.75, tier_name: '50-100 kg', discount_percentage: 25 },
      ];
    } else if (product.name.includes('Pimentón')) {
      tiers = [
        { product_id: product.id, min_quantity: 3, max_quantity: 10, price_per_unit: 9000, tier_name: '3-10 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 10, max_quantity: 30, price_per_unit: 8500, tier_name: '10-30 kg', discount_percentage: 6 },
        { product_id: product.id, min_quantity: 30, max_quantity: 50, price_per_unit: 8000, tier_name: '30-50 kg', discount_percentage: 11 },
      ];
    } else if (product.name.includes('Ajo')) {
      tiers = [
        { product_id: product.id, min_quantity: 1, max_quantity: 5, price_per_unit: 40000, tier_name: '1-5 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 5, max_quantity: 15, price_per_unit: 35000, tier_name: '5-15 kg', discount_percentage: 13 },
        { product_id: product.id, min_quantity: 15, max_quantity: 30, price_per_unit: 30000, tier_name: '15-30 kg', discount_percentage: 25 },
      ];
    } else if (product.name.includes('Champiñones')) {
      tiers = [
        { product_id: product.id, min_quantity: 2, max_quantity: 5, price_per_unit: 30000, tier_name: '2-5 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 5, max_quantity: 15, price_per_unit: 26000, tier_name: '5-15 kg', discount_percentage: 13 },
        { product_id: product.id, min_quantity: 15, max_quantity: 30, price_per_unit: 24000, tier_name: '15-30 kg', discount_percentage: 20 },
      ];
    } else if (product.name.includes('Lechuga')) {
      tiers = [
        { product_id: product.id, min_quantity: 10, max_quantity: 30, price_per_unit: 4500, tier_name: '10-30 unidades', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 30, max_quantity: 60, price_per_unit: 4000, tier_name: '30-60 unidades', discount_percentage: 11 },
        { product_id: product.id, min_quantity: 60, max_quantity: 100, price_per_unit: 3500, tier_name: '60-100 unidades', discount_percentage: 22 },
      ];
    } else if (product.name.includes('Cilantro')) {
      tiers = [
        { product_id: product.id, min_quantity: 1, max_quantity: 3, price_per_unit: 24000, tier_name: '1-3 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 3, max_quantity: 10, price_per_unit: 20000, tier_name: '3-10 kg', discount_percentage: 17 },
        { product_id: product.id, min_quantity: 10, max_quantity: 20, price_per_unit: 18000, tier_name: '10-20 kg', discount_percentage: 25 },
      ];
    } else if (product.name.includes('Albahaca')) {
      tiers = [
        { product_id: product.id, min_quantity: 0.5, max_quantity: 2, price_per_unit: 60000, tier_name: '0.5-2 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 2, max_quantity: 5, price_per_unit: 50000, tier_name: '2-5 kg', discount_percentage: 17 },
        { product_id: product.id, min_quantity: 5, max_quantity: 10, price_per_unit: 45000, tier_name: '5-10 kg', discount_percentage: 25 },
      ];
    } else if (product.name.includes('Jengibre')) {
      tiers = [
        { product_id: product.id, min_quantity: 1, max_quantity: 3, price_per_unit: 36000, tier_name: '1-3 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 3, max_quantity: 10, price_per_unit: 32000, tier_name: '3-10 kg', discount_percentage: 11 },
        { product_id: product.id, min_quantity: 10, max_quantity: 20, price_per_unit: 28000, tier_name: '10-20 kg', discount_percentage: 22 },
      ];
    } else {
      // Default tiers
      const basePrice = product.base_price;
      tiers = [
        { product_id: product.id, min_quantity: product.minimum_order_quantity, max_quantity: product.minimum_order_quantity * 4, price_per_unit: basePrice, tier_name: `${product.minimum_order_quantity}-${product.minimum_order_quantity * 4} ${product.unit}`, discount_percentage: 0 },
        { product_id: product.id, min_quantity: product.minimum_order_quantity * 4 + 1, max_quantity: product.minimum_order_quantity * 10, price_per_unit: basePrice * 0.9, tier_name: `${product.minimum_order_quantity * 4 + 1}-${product.minimum_order_quantity * 10} ${product.unit}`, discount_percentage: 10 },
        { product_id: product.id, min_quantity: product.minimum_order_quantity * 10 + 1, max_quantity: null, price_per_unit: basePrice * 0.85, tier_name: `${product.minimum_order_quantity * 10 + 1}+ ${product.unit}`, discount_percentage: 15 },
      ];
    }

    const { error: tiersError } = await supabase
      .from('b2b_pricing_tiers')
      .insert(tiers);

    if (!tiersError) {
      totalTiers += tiers.length;
    }
  }

  console.log(`✅ ${totalTiers} pricing tiers creados`);

  console.log('\n✅ MIGRACIÓN COMPLETADA');
  console.log(`📊 Total: ${createdProducts?.length || 0} productos, ${createdCategories?.length || 0} categorías, ${totalTiers} pricing tiers`);
}

migrateB2BProducts().catch(console.error);
