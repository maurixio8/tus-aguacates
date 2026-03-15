/**
 * Lista productos activos desde Supabase.
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... node scripts/list-active-products.js
 */

const { createClient } = require('@supabase/supabase-js');

function getRequiredEnv(name) {
  const value = (process.env[name] || '').trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const supabase = createClient(
  getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
  getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
);

async function listActiveProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('name, id, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      process.exit(1);
    }

    console.log('\n=== PRODUCTOS ACTIVOS EN LA BASE DE DATOS ===\n');

    const productNameCounts = {};

    data.forEach((product) => {
      const name = product.name;
      productNameCounts[name] = (productNameCounts[name] || 0) + 1;
      console.log(`- ${name} (ID: ${product.id.substring(0, 8)}...)`);
    });

    console.log('\n=== RESUMEN ===');
    console.log(`Total productos unicos: ${Object.keys(productNameCounts).length}`);
    console.log(`Total productos listados: ${data.length}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listActiveProducts();
