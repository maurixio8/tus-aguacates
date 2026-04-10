
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTomatoes() {
    console.log('🔍 Deep inspecting tomato variants...\n');

    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, order_data')
        .order('created_at', { ascending: false })
        .limit(200);

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    let found = 0;
    orders.forEach(order => {
        const items = order.order_data?.items || [];
        items.forEach(item => {
            const name = (item.productName || item.product_name || '').toLowerCase();
            if (name.includes('tomate')) {
                found++;
                console.log(`Order: ${order.order_number} (${order.customer_name})`);
                console.log(`  Product: "${item.productName || item.product_name}"`);
                console.log(`  item.variantName: "${item.variantName}"`);
                console.log(`  item.variant_name: "${item.variant_name}"`);
                console.log(`  item.variantValue: "${item.variantValue}"`);
                console.log(`  item.variant_value: "${item.variant_value}"`);
                if (item.variant) {
                   console.log(`  item.variant: ${JSON.stringify(item.variant)}`);
                }
                console.log('---');
            }
        });
    });
    console.log(`Done. Found ${found} tomato items.`);
}

inspectTomatoes();
