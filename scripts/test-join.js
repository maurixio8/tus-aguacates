// Test the exact query used by the API
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gxqkmaaqoehydulksudj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDI5NDQsImV4cCI6MjA3ODAxODk0NH0.XAR-ysQgt0ZkRZfIZx_DvpYMzmEMFsdAYK3EP1tc0mw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testQuery() {
  console.log('Testing exact API query...\n');

  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      price,
      categories:category_id (
        id,
        name,
        slug
      ),
      product_variants (
        id,
        variant_name,
        variant_value,
        price_adjustment,
        stock_quantity,
        is_active
      )
    `)
    .ilike('name', '%caja%')
    .limit(3);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Results:');
  data.forEach(p => {
    console.log(`\n${p.name}:`);
    console.log(`  Category: ${p.categories?.name}`);
    console.log(`  Variants: ${p.product_variants?.length || 0}`);
    if (p.product_variants?.length > 0) {
      p.product_variants.forEach(v => {
        console.log(`    - ${v.variant_value}: ${v.price_adjustment} COP`);
      });
    }
  });
}

testQuery();
