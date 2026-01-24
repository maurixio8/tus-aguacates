
// import { Order, OrderItem } from '../app/types'; // We might need to mock types if not available

// Mock types locally to avoid import issues in script
interface OrderItem {
    id: string;
    product_id: string;
    product_snapshot?: {
        name?: string;
        price?: number;
        main_image_url?: string;
        variant_name?: string;
        variant_value?: string;
    };
    quantity: number;
    unit_price: number;
    subtotal?: number;
    products?: {
        name?: string;
    };
    product_name?: string;
    productName?: string;
    variantName?: string;
}

interface Order {
    id: string;
    order_number: string;
    customer_name?: string;
    status: string;
    created_at: string;
    order_items?: OrderItem[];
    items?: OrderItem[];
    order_type?: 'registered' | 'guest';
    order_data?: any;
}

// COPIED LOGIC FROM page.tsx
const COMBO_COMPONENTS: Record<string, Array<{ name: string; quantity: number; unit: string; variant?: string }>> = {
    'combo ahorro #1': [
        { name: 'Fresas premium', quantity: 1, unit: 'kg', variant: '1000 gr' }
    ],
    'combo ahorro #2': [
        { name: 'Caja de 24 unidades hass mediano', quantity: 1, unit: 'caja', variant: '24 unidades' },
        { name: 'Arándanos Orgánicos', quantity: 1, unit: 'paq', variant: 'X250grs' }
    ],
    'combo ahorro #3': [
        { name: 'Fresa Económica', quantity: 1, unit: 'paq', variant: '500grs' },
        { name: 'Arándanos Orgánicos', quantity: 1, unit: 'paq', variant: 'X250grs' },
        { name: 'Paquete 4 Unidades injerto', quantity: 1, unit: 'paq', variant: '4 unidades' }
    ],
    'nuevo combo 4': [
        { name: 'Arándanos Orgánicos', quantity: 1, unit: 'paq', variant: 'X250grs' },
        { name: 'Fresas premium', quantity: 1, unit: 'kg', variant: '1000 gr' },
        { name: 'Caja de 24 unidades hass mediano', quantity: 1, unit: 'caja', variant: '24 unidades' }
    ],
    'combo mercado semanal completo': [
        { name: 'Caja de 24 unidades hass mediano', quantity: 1, unit: 'caja', variant: '24 unidades' },
        { name: 'Fresa Económica', quantity: 1, unit: 'paq', variant: '500grs' },
        { name: 'Banano criollo', quantity: 1, unit: 'kg', variant: '1 Kilo' },
        { name: 'Tomate chonto', quantity: 1, unit: 'lb', variant: '500 gr' },
        { name: 'Cebolla cabezona', quantity: 1, unit: 'lb', variant: '500 gr' },
        { name: 'Papa Sabanera', quantity: 1, unit: 'lb', variant: 'X 500 grs' },
        { name: 'Zanahoria', quantity: 1, unit: 'lb', variant: '500 gr' },
        { name: 'Pasta de Ajo', quantity: 1, unit: 'unidad', variant: 'x100 gr' },
        { name: 'Arándanos Orgánicos', quantity: 1, unit: 'paq', variant: 'X125grs' }, // NOTE: 125g here
        { name: 'Uva isabelina', quantity: 1, unit: 'bandeja', variant: '400grs' },
        { name: 'Duraznos', quantity: 1, unit: 'lb', variant: '500 gr' },
        { name: 'Limón Tahiti', quantity: 1, unit: 'kg', variant: '1000 gr' }
    ],
    'combo navideño premium': [
        { name: 'Caja de 12 unidades Premium', quantity: 1, unit: 'caja', variant: '12 unidades' },
        { name: 'Uva chilena importada', quantity: 1, unit: 'paq', variant: '500 grs' },
        { name: 'Cerezas', quantity: 1, unit: 'paq', variant: '125 grs' }
    ]
};

const normalizeProductName = (name: string, variant?: string | null): string => {
    if (!name) return 'Producto sin nombre';
    let normalized = name.trim();
    normalized = normalized.replace(/\s*\([^)]*\)\s*$/, '').trim();
    normalized = normalized.replace(/\s+/g, ' ');
    return normalized;
};

const extractItemsFromOrder = (order: Order): OrderItem[] => {
    if (order.order_items && order.order_items.length > 0) return order.order_items;
    if (order.items && order.items.length > 0) return order.items;

    // Mock guest data logic if needed, but for test we'll use order_items
    return [];
};

// SIMULATION
const runSimulation = () => {
    console.log('--- STARTING SHOPPING LIST SIMULATION ---');

    // 1. Setup Mock Orders
    const orders: Order[] = [
        // Order 1: Combo Ahorro #2 (Should have 250g Arándanos)
        {
            id: '1', order_number: '001', customer_name: 'User 1', status: 'paid', created_at: '',
            order_items: [
                { id: 'i1', product_id: 'p1', quantity: 1, unit_price: 5000, subtotal: 5000, product_snapshot: { name: 'Combo Ahorro #2', variant_name: 'Standard' } }
            ]
        },
        // Order 2: Combo Mercado Semanal (Should have 125g Arándanos)
        {
            id: '2', order_number: '002', customer_name: 'User 2', status: 'paid', created_at: '',
            order_items: [
                { id: 'i2', product_id: 'p2', quantity: 1, unit_price: 5000, subtotal: 5000, product_snapshot: { name: 'Combo Mercado Semanal Completo', variant_name: 'Standard' } }
            ]
        },
        // Order 3: Buying separate Arándanos 125g (simulating a loose item)
        {
            id: '3', order_number: '003', customer_name: 'User 3', status: 'paid', created_at: '',
            order_items: [
                { id: 'i3', product_id: 'p3', quantity: 1, unit_price: 5000, subtotal: 5000, product_snapshot: { name: 'Arándanos Orgánicos', variant_name: 'X125grs' } }
            ]
        },
        // Order 4: Buying separate Arándanos 250g
        {
            id: '4', order_number: '004', customer_name: 'User 4', status: 'paid', created_at: '',
            order_items: [
                { id: 'i4', product_id: 'p3', quantity: 1, unit_price: 5000, subtotal: 5000, product_snapshot: { name: 'Arándanos Orgánicos', variant_name: 'X250grs' } }
            ]
        }
    ];

    console.log(`Simulating ${orders.length} orders...`);

    // 2. Run Grouping Logic
    const productMap = new Map<string, any>();

    orders.forEach(order => {
        const items = extractItemsFromOrder(order);
        items.forEach(item => {
            const productName = item.product_snapshot?.name || 'Producto';
            const comboKey = productName.toLowerCase();
            const comboComponents = COMBO_COMPONENTS[comboKey] ||
                Object.entries(COMBO_COMPONENTS).find(([key]) => comboKey.includes(key))?.[1];

            if (comboComponents) {
                console.log(`[Order ${order.id}] Found COMBO: ${productName}`);
                comboComponents.forEach(component => {
                    // Logic from page.tsx (SIMULATED)
                    const componentName = component.name;
                    // In the actual code, there is a `groupingKey` logic that uses `createGroupingKey`.
                    // Let's approximate it here: name + variant

                    const componentKey = `${componentName}|${component.variant || 'Sin variante'}`;

                    if (!productMap.has(componentKey)) {
                        productMap.set(componentKey, {
                            name: componentName,
                            variant: component.variant,
                            total_qty: 0,
                            variants_breakdown: {}
                        });
                    }
                    const entry = productMap.get(componentKey);
                    entry.total_qty += component.quantity * item.quantity;

                    const vKey = component.variant || 'No Variant';
                    entry.variants_breakdown[vKey] = (entry.variants_breakdown[vKey] || 0) + (component.quantity * item.quantity);
                });
            } else {
                console.log(`[Order ${order.id}] Found Item: ${productName}`);
                const variantDisplay = item.product_snapshot?.variant_name || null;
                const componentKey = `${productName}|${variantDisplay || 'Sin variante'}`; // Approximate

                if (!productMap.has(componentKey)) {
                    productMap.set(componentKey, {
                        name: productName,
                        variant: variantDisplay,
                        total_qty: 0,
                        variants_breakdown: {}
                    });
                }
                const entry = productMap.get(componentKey);
                entry.total_qty += item.quantity;

                const vKey = variantDisplay || 'No Variant';
                entry.variants_breakdown[vKey] = (entry.variants_breakdown[vKey] || 0) + item.quantity;
            }
        });
    });

    // 3. Print Results for Arándanos
    console.log('\n--- RESULTS FOR ARÁNDANOS ---');
    productMap.forEach((val, key) => {
        if (val.name.toLowerCase().includes('arandanos') || val.name.toLowerCase().includes('arándanos')) {
            console.log(`Product: ${val.name}`);
            console.log(`  Key: ${key}`);
            console.log(`  Total Qty: ${val.total_qty}`);
            console.log(`  Breakdown: ${JSON.stringify(val.variants_breakdown)}`);
            console.log('-------------------');
        }
    });
};

runSimulation();
