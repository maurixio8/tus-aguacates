import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

(async () => {
  console.log('Probando inserción simple...');

  const { data, error } = await supabase
    .from('b2b_products')
    .insert({
      sku: 'TEST-001',
      name: 'Producto de Prueba',
      description: 'Test',
      category_id: null,
      base_price: 1000,
      stock_quantity: 10,
      minimum_order_quantity: 1,
      unit: 'kg',
      is_active: true,
    })
    .select();

  console.log('Error:', JSON.stringify(error, null, 2));
  console.log('Data:', data);
})();
