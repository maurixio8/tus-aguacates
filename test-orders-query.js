const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function inspectOrders() {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        order_number,
        order_items (
          product_snapshot,
          quantity,
          unit_price
        )
      `)
      .limit(3);

    if (error) throw error;

    console.log('=== PEDIDOS DE EJEMPLO ===');
    orders.forEach((order, i) => {
      console.log('\n--- Pedido ' + (i + 1) + ': ' + order.order_number + ' ---');
      order.order_items?.forEach((item, j) => {
        console.log('\nItem ' + (j + 1) + ':');
        console.log('  product_snapshot:', JSON.stringify(item.product_snapshot, null, 2));
        console.log('  quantity:', item.quantity);
        console.log('  unit_price:', item.unit_price);
      });
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

inspectOrders();
