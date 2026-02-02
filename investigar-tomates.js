// Script para buscar productos de tomate en pedidos recientes y ver cómo se están registrando
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigarTomates() {
    console.log('🔍 Buscando pedidos con productos de tomate...\n');

    // Obtener pedidos recientes - sin order_items porque esa columna no existe
    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, created_at, order_data')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('❌ Error obteniendo pedidos:', error);
        return;
    }

    const tomateSummary = new Map();

    console.log(`📦 Analizando ${orders.length} pedidos recientes...\n`);

    for (const order of orders) {
        let items = [];

        // Extraer items solo de order_data
        if (order.order_data?.items) {
            items = order.order_data.items.map(item => ({
                product_name: item.productName || item.product_name || '',
                variantName: item.variantName || item.variant_name || 'Sin variante',
                variant_value: item.variantValue || item.variant_value || '',
                quantity: item.quantity || 1
            }));
        }

        // Buscar items que contengan "tomate"
        for (const item of items) {
            const productName = item.product_name || '';
            if (productName.toLowerCase().includes('tomate')) {
                const variantName = item.variantName || item.variant_value || 'Sin variante';
                const key = `${productName} | ${variantName}`;

                if (!tomateSummary.has(key)) {
                    tomateSummary.set(key, {
                        nombre: productName,
                        variante: variantName,
                        count: 0,
                        ordersCount: 0,
                        orders: []
                    });
                }

                const summary = tomateSummary.get(key);
                summary.count += item.quantity || 1;
                summary.ordersCount += 1;
                summary.orders.push({
                    order_number: order.order_number,
                    customer: order.customer_name,
                    date: new Date(order.created_at).toLocaleDateString('es-CO')
                });
            }
        }
    }

    console.log('🍅 RESUMEN DE PRODUCTOS DE TOMATE ENCONTRADOS:\n');
    console.log('═'.repeat(80));

    const sortedEntries = Array.from(tomateSummary.entries())
        .sort((a, b) => b[1].ordersCount - a[1].ordersCount);

    for (const [key, data] of sortedEntries) {
        console.log(`\n📌 Nombre exacto: "${data.nombre}"`);
        console.log(`   Variante: "${data.variante}"`);
        console.log(`   Total vendido: ${data.count} unidades en ${data.ordersCount} pedidos`);
        console.log(`   Últimos pedidos:`);
        data.orders.slice(0, 3).forEach(order => {
            console.log(`     - ${order.date}: ${order.customer} (${order.order_number})`);
        });
    }

    console.log('\n' + '═'.repeat(80));
    console.log(`\n✅ Total de tipos de tomate distintos: ${tomateSummary.size}`);

    // Detectar posibles duplicados por normalización
    console.log('\n⚠️  ANÁLISIS DE POSIBLES DUPLICADOS:\n');
    const normalized = new Map();
    for (const [key, data] of tomateSummary.entries()) {
        // Simular la normalización actual
        const norm = data.nombre.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s*\([^)]*\)\s*$/, '').trim();
        if (!normalized.has(norm)) {
            normalized.set(norm, []);
        }
        normalized.get(norm).push(data.nombre);
    }

    for (const [normName, originalNames] of normalized.entries()) {
        if (originalNames.length > 1) {
            console.log(`🔴 DUPLICADO DETECTADO por normalización:`);
            console.log(`   Normalizado: "${normName}"`);
            console.log(`   Se agrupa con:`);
            originalNames.forEach(name => console.log(`     - "${name}"`));
            console.log();
        }
    }
}

investigarTomates().catch(console.error);
