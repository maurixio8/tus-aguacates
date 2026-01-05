import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function createPricingTiers() {
  console.log('🔄 Creando pricing tiers para 31 productos...\n');

  const { data: products } = await supabase
    .from('b2b_products')
    .select('*')
    .order('sku');

  if (!products || products.length === 0) {
    console.error('❌ No hay productos');
    return;
  }

  console.log(`   ${products.length} productos encontrados`);

  let totalTiers = 0;

  for (const product of products) {
    let tiers = [];

    // Definir tiers según el producto
    if (product.sku.includes('HASS') || product.sku.includes('PAPELILLO') ||
        product.sku.includes('SEMIL') || product.sku.includes('CHOQUETTE')) {
      // Aguacates
      const basePrice = product.base_price;
      tiers = [
        { product_id: product.id, min_quantity: 5, max_quantity: 19, price_per_unit: basePrice, tier_name: '5-19 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 20, max_quantity: 99, price_per_unit: Math.round(basePrice * 0.89), tier_name: '20-99 kg', discount_percentage: 11 },
        { product_id: product.id, min_quantity: 100, max_quantity: 300, price_per_unit: Math.round(basePrice * 0.78), tier_name: '100-300 kg', discount_percentage: 22 },
      ];
    } else if (product.sku.includes('LIMON')) {
      tiers = [
        { product_id: product.id, min_quantity: 3, max_quantity: 9, price_per_unit: 7000, tier_name: '3-9 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 10, max_quantity: 49, price_per_unit: 6500, tier_name: '10-49 kg', discount_percentage: 7 },
        { product_id: product.id, min_quantity: 50, max_quantity: 100, price_per_unit: 6000, tier_name: '50-100 kg', discount_percentage: 14 },
      ];
    } else if (product.sku.includes('NARANJA')) {
      tiers = [
        { product_id: product.id, min_quantity: 5, max_quantity: 19, price_per_unit: 6000, tier_name: '5-19 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 20, max_quantity: 49, price_per_unit: 5500, tier_name: '20-49 kg', discount_percentage: 8 },
        { product_id: product.id, min_quantity: 50, max_quantity: 100, price_per_unit: 5000, tier_name: '50-100 kg', discount_percentage: 17 },
      ];
    } else if (product.sku.includes('BANANO')) {
      tiers = [
        { product_id: product.id, min_quantity: 5, max_quantity: 19, price_per_unit: 4000, tier_name: '5-19 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 20, max_quantity: 49, price_per_unit: 3500, tier_name: '20-49 kg', discount_percentage: 13 },
        { product_id: product.id, min_quantity: 50, max_quantity: 100, price_per_unit: 3000, tier_name: '50-100 kg', discount_percentage: 25 },
      ];
    } else if (product.sku.includes('MANGO') || product.sku.includes('LULO')) {
      tiers = [
        { product_id: product.id, min_quantity: 3, max_quantity: 9, price_per_unit: product.base_price, tier_name: '3-9 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 10, max_quantity: 29, price_per_unit: Math.round(product.base_price * 0.85), tier_name: '10-29 kg', discount_percentage: 15 },
        { product_id: product.id, min_quantity: 30, max_quantity: 50, price_per_unit: Math.round(product.base_price * 0.8), tier_name: '30-50 kg', discount_percentage: 20 },
      ];
    } else if (product.sku.includes('FRESAS')) {
      tiers = [
        { product_id: product.id, min_quantity: 3, max_quantity: 9, price_per_unit: 12000, tier_name: '3-9 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 10, max_quantity: 29, price_per_unit: 10200, tier_name: '10-29 kg', discount_percentage: 15 },
        { product_id: product.id, min_quantity: 30, max_quantity: 50, price_per_unit: 9600, tier_name: '30-50 kg', discount_percentage: 20 },
      ];
    } else if (product.sku.includes('ARANDANOS')) {
      tiers = [
        { product_id: product.id, min_quantity: 1, max_quantity: 4, price_per_unit: 75000, tier_name: '1-4 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 5, max_quantity: 14, price_per_unit: 67500, tier_name: '5-14 kg', discount_percentage: 10 },
        { product_id: product.id, min_quantity: 15, max_quantity: 30, price_per_unit: 60000, tier_name: '15-30 kg', discount_percentage: 20 },
      ];
    } else if (product.sku.includes('MORA')) {
      tiers = [
        { product_id: product.id, min_quantity: 3, max_quantity: 9, price_per_unit: 9000, tier_name: '3-9 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 10, max_quantity: 29, price_per_unit: 8500, tier_name: '10-29 kg', discount_percentage: 6 },
        { product_id: product.id, min_quantity: 30, max_quantity: 50, price_per_unit: 8000, tier_name: '30-50 kg', discount_percentage: 11 },
      ];
    } else if (product.sku.includes('TOMATE') || product.sku.includes('CEBOLLA') ||
               product.sku.includes('ZANAHORIA') || product.sku.includes('ARVEJA')) {
      const basePrice = product.base_price;
      tiers = [
        { product_id: product.id, min_quantity: 5, max_quantity: 19, price_per_unit: basePrice, tier_name: '5-19 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 20, max_quantity: 49, price_per_unit: Math.round(basePrice * 0.875), tier_name: '20-49 kg', discount_percentage: 13 },
        { product_id: product.id, min_quantity: 50, max_quantity: 100, price_per_unit: Math.round(basePrice * 0.75), tier_name: '50-100 kg', discount_percentage: 25 },
      ];
    } else if (product.sku.includes('PIMENTON')) {
      tiers = [
        { product_id: product.id, min_quantity: 3, max_quantity: 9, price_per_unit: 9000, tier_name: '3-9 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 10, max_quantity: 29, price_per_unit: 8500, tier_name: '10-29 kg', discount_percentage: 6 },
        { product_id: product.id, min_quantity: 30, max_quantity: 50, price_per_unit: 8000, tier_name: '30-50 kg', discount_percentage: 11 },
      ];
    } else if (product.sku.includes('AJO')) {
      tiers = [
        { product_id: product.id, min_quantity: 1, max_quantity: 4, price_per_unit: 40000, tier_name: '1-4 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 5, max_quantity: 14, price_per_unit: 35000, tier_name: '5-14 kg', discount_percentage: 13 },
        { product_id: product.id, min_quantity: 15, max_quantity: 30, price_per_unit: 30000, tier_name: '15-30 kg', discount_percentage: 25 },
      ];
    } else if (product.sku.includes('CHAMPINONES')) {
      tiers = [
        { product_id: product.id, min_quantity: 2, max_quantity: 4, price_per_unit: 30000, tier_name: '2-4 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 5, max_quantity: 14, price_per_unit: 26000, tier_name: '5-14 kg', discount_percentage: 13 },
        { product_id: product.id, min_quantity: 15, max_quantity: 30, price_per_unit: 24000, tier_name: '15-30 kg', discount_percentage: 20 },
      ];
    } else if (product.sku.includes('LECHUGA')) {
      tiers = [
        { product_id: product.id, min_quantity: 10, max_quantity: 29, price_per_unit: 4500, tier_name: '10-29 unidades', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 30, max_quantity: 59, price_per_unit: 4000, tier_name: '30-59 unidades', discount_percentage: 11 },
        { product_id: product.id, min_quantity: 60, max_quantity: 100, price_per_unit: 3500, tier_name: '60-100 unidades', discount_percentage: 22 },
      ];
    } else if (product.sku.includes('CILANTRO')) {
      tiers = [
        { product_id: product.id, min_quantity: 1, max_quantity: 2, price_per_unit: 24000, tier_name: '1-2 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 3, max_quantity: 9, price_per_unit: 20000, tier_name: '3-9 kg', discount_percentage: 17 },
        { product_id: product.id, min_quantity: 10, max_quantity: 20, price_per_unit: 18000, tier_name: '10-20 kg', discount_percentage: 25 },
      ];
    } else if (product.sku.includes('ALBAHACA')) {
      tiers = [
        { product_id: product.id, min_quantity: 1, max_quantity: 1, price_per_unit: 60000, tier_name: '1 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 2, max_quantity: 4, price_per_unit: 50000, tier_name: '2-4 kg', discount_percentage: 17 },
        { product_id: product.id, min_quantity: 5, max_quantity: 10, price_per_unit: 45000, tier_name: '5-10 kg', discount_percentage: 25 },
      ];
    } else if (product.sku.includes('JENGUIBRE')) {
      tiers = [
        { product_id: product.id, min_quantity: 1, max_quantity: 2, price_per_unit: 36000, tier_name: '1-2 kg', discount_percentage: 0 },
        { product_id: product.id, min_quantity: 3, max_quantity: 9, price_per_unit: 32000, tier_name: '3-9 kg', discount_percentage: 11 },
        { product_id: product.id, min_quantity: 10, max_quantity: 20, price_per_unit: 28000, tier_name: '10-20 kg', discount_percentage: 22 },
      ];
    } else {
      // Default tiers
      const basePrice = product.base_price;
      const minQty = product.minimum_order_quantity;
      tiers = [
        { product_id: product.id, min_quantity: minQty, max_quantity: minQty * 4 - 1, price_per_unit: basePrice, tier_name: `${minQty}-${minQty * 4 - 1} ${product.unit}`, discount_percentage: 0 },
        { product_id: product.id, min_quantity: minQty * 4, max_quantity: minQty * 10 - 1, price_per_unit: Math.round(basePrice * 0.9), tier_name: `${minQty * 4}-${minQty * 10 - 1} ${product.unit}`, discount_percentage: 10 },
        { product_id: product.id, min_quantity: minQty * 10, max_quantity: null, price_per_unit: Math.round(basePrice * 0.85), tier_name: `${minQty * 10}+ ${product.unit}`, discount_percentage: 15 },
      ];
    }

    const { error: tiersError } = await supabase
      .from('b2b_pricing_tiers')
      .insert(tiers);

    if (tiersError) {
      console.error(`❌ Error creando tiers para ${product.sku}:`, tiersError.message);
    } else {
      totalTiers += tiers.length;
      console.log(`✅ ${tiers.length} tiers creados para ${product.sku}`);
    }
  }

  console.log(`\n✅ ${totalTiers} pricing tiers creados en total`);
}

createPricingTiers().catch(console.error);
