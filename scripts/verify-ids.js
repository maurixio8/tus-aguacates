// Verificar que los IDs de productos coinciden
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gxqkmaaqoehydulksudj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDI5NDQsImV4cCI6MjA3ODAxODk0NH0.XAR-ysQgt0ZkRZfIZx_DvpYMzmEMFsdAYK3EP1tc0mw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verify() {
  // Get a variant
  const { data: variant } = await supabase
    .from('product_variants')
    .select('product_id, variant_value')
    .eq('variant_value', '24 unidades')
    .single();

  console.log('Variant "24 unidades":');
  console.log('  product_id:', variant?.product_id);

  // Check if that product exists
  const { data: product } = await supabase
    .from('products')
    .select('id, name')
    .eq('id', variant?.product_id)
    .single();

  console.log('\nProduct with that ID:');
  console.log('  ', product);

  // Also check the product by name
  const { data: productByName } = await supabase
    .from('products')
    .select('id, name')
    .ilike('name', '%24 unidades%')
    .single();

  console.log('\nProduct by name search:');
  console.log('  ', productByName);
}

verify();
