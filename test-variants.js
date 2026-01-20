const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function inspectOrdersWithVariants() {
  try {
    // Buscar pedidos con variantes
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
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    console.log('=== BUSCANDO PRODUCTOS CON VARIANTES DE PESO ===\n');

    let foundVariants = false;
    orders.forEach((order, i) => {
      order.order_items?.forEach((item, j) => {
        const snapshot = item.product_snapshot;
        const hasVariant = snapshot?.variant_name || snapshot?.variant_value;

        // Buscar productos que parezcan tener variantes de peso
        const name = snapshot?.name || '';
        const hasWeightKeyword = /gramos|kg|kilos|libras|gr|g\b/i.test(name);

        if (hasVariant || hasWeightKeyword) {
          foundVariants = true;
          console.log(`--- ${order.order_number} - Item ${j + 1} ---`);
          console.log('Producto:', name);
          console.log('Nombre variante:', snapshot?.variant_name || 'N/A');
          console.log('Valor variante:', snapshot?.variant_value || 'N/A');
          console.log('Cantidad unidades:', item.quantity);
          console.log('Precio unitario:', item.unit_price);
          console.log('---');
        }
      });
    });

    if (!foundVariants) {
      console.log('No se encontraron productos con variantes de peso en los pedidos.');
      console.log('\nMostrando todos los items para análisis:');
      orders.slice(0, 2).forEach((order, i) => {
        console.log(`\n=== Pedido ${order.order_number} ===`);
        order.order_items?.forEach((item, j) => {
          console.log(`Item ${j + 1}:`);
          console.log('  Nombre:', item.product_snapshot?.name);
          console.log('  Variantes:', JSON.stringify({
            variant_name: item.product_snapshot?.variant_name,
            variant_value: item.product_snapshot?.variant_value
          }));
        });
      });
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

inspectOrdersWithVariants();
