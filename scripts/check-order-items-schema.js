/**
 * Script para consultar la estructura de la tabla order_items.
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/check-order-items-schema.js
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
  getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function checkOrderItemsSchema() {
  console.log('Consultando estructura de la tabla order_items...\n');

  try {
    const { data: sampleData, error: sampleError } = await supabase
      .from('order_items')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log('Error obteniendo muestra:', sampleError.message);
      return;
    }

    if (sampleData && sampleData.length > 0) {
      console.log('Columnas encontradas en order_items:');
      console.log(Object.keys(sampleData[0]));
      console.log('\nRegistro de ejemplo:');
      console.log(JSON.stringify(sampleData[0], null, 2));
      return;
    }

    console.log('La tabla order_items no tiene registros para inspeccionar.');
  } catch (err) {
    console.error('Error:', err);
  }
}

checkOrderItemsSchema().catch(console.error);
