/**
 * Edge Function: create-payment-intent
 * 
 * NOTA: Esta función está preparada para integración con Stripe.
 * Para activarla, necesitas configurar las variables de entorno:
 * - STRIPE_SECRET_KEY
 * 
 * Instrucciones de activación:
 * 1. Obtener las credenciales de Stripe (https://dashboard.stripe.com/apikeys)
 * 2. Configurar la variable de entorno en Supabase:
 *    supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
 * 3. Descomentar el código de Stripe a continuación
 * 4. Redesplegar la función: supabase functions deploy create-payment-intent
 */

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { amount, currency = 'cop', cartItems, customerEmail, shippingAddress, userId } = await req.json();

        console.log('Payment intent request received:', { amount, currency, cartItemsCount: cartItems?.length });

        // Validar parámetros requeridos
        if (!amount || amount <= 0) {
            throw new Error('Se requiere un monto válido');
        }

        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            throw new Error('Se requieren items del carrito');
        }

        // Validar estructura de items del carrito
        for (const item of cartItems) {
            if (!item.product_id || !item.quantity || !item.price || !item.product_name) {
                throw new Error('Cada item debe tener product_id, quantity, price y product_name');
            }
            if (item.quantity <= 0 || item.price <= 0) {
                throw new Error('La cantidad y precio deben ser positivos');
            }
        }

        // Obtener variables de entorno
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Configuración de Supabase faltante');
        }

        // ============================================================
        // STRIPE INTEGRATION - DESCOMENTAR CUANDO TENGAS LAS CREDENCIALES
        // ============================================================
        
        /*
        if (!stripeSecretKey) {
            console.error('Stripe secret key not found in environment');
            throw new Error('Stripe secret key not configured');
        }

        console.log('Environment variables validated, creating payment intent...');

        // Calcular monto total desde items del carrito para verificar
        const calculatedAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (Math.abs(calculatedAmount - amount) > 0.01) {
            throw new Error('Discrepancia de monto: el monto calculado no coincide con el proporcionado');
        }

        // Preparar datos del payment intent de Stripe
        const stripeParams = new URLSearchParams();
        stripeParams.append('amount', Math.round(amount * 100).toString()); // Convertir a centavos
        stripeParams.append('currency', currency);
        stripeParams.append('payment_method_types[]', 'card');
        stripeParams.append('metadata[customer_email]', customerEmail || '');
        stripeParams.append('metadata[cart_items_count]', cartItems.length.toString());
        stripeParams.append('metadata[total_items]', cartItems.reduce((sum, item) => sum + item.quantity, 0).toString());
        stripeParams.append('metadata[user_id]', userId || '');

        // Crear payment intent con Stripe
        const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${stripeSecretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: stripeParams.toString()
        });

        console.log('Stripe API response status:', stripeResponse.status);

        if (!stripeResponse.ok) {
            const errorData = await stripeResponse.text();
            console.error('Stripe API error:', errorData);
            throw new Error(`Stripe API error: ${errorData}`);
        }

        const paymentIntent = await stripeResponse.json();
        console.log('Payment intent created successfully:', paymentIntent.id);
        */

        // ============================================================
        // SOLUCIÓN TEMPORAL - CREAR PEDIDO SIN STRIPE
        // ============================================================
        
        // Generar ID temporal de pedido
        const tempOrderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        console.log('Creating order in database (without payment)...');

        // Crear registro de pedido en la base de datos
        const orderData = {
            order_number: tempOrderNumber,
            user_id: userId || null,
            status: 'pending',
            payment_status: 'pending',
            subtotal: amount,
            shipping_fee: 0,
            tax: 0,
            discount: 0,
            total: amount,
            shipping_address_snapshot: shippingAddress || null,
            notes: 'Pedido en espera de configuración de pagos',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(orderData)
        });

        if (!orderResponse.ok) {
            const errorText = await orderResponse.text();
            console.error('Failed to create order:', errorText);
            throw new Error(`Failed to create order: ${errorText}`);
        }

        const order = await orderResponse.json();
        const orderId = order[0].id;
        console.log('Order created successfully:', orderId);

        // Crear items del pedido
        const orderItems = cartItems.map(item => ({
            order_id: orderId,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.price,
            subtotal: item.price * item.quantity,
            product_snapshot: {
                name: item.product_name,
                image_url: item.product_image_url || null
            },
            created_at: new Date().toISOString()
        }));

        console.log('Creating order items...');

        const orderItemsResponse = await fetch(`${supabaseUrl}/rest/v1/order_items`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderItems)
        });

        if (!orderItemsResponse.ok) {
            const errorText = await orderItemsResponse.text();
            console.error('Failed to create order items:', errorText);
            console.warn('Order created but order items creation failed');
        } else {
            console.log('Order items created successfully');
        }

        // Respuesta temporal (sin Stripe)
        const result = {
            data: {
                // clientSecret: paymentIntent.client_secret, // Descomentar cuando Stripe esté activo
                // paymentIntentId: paymentIntent.id,
                orderId: orderId,
                orderNumber: tempOrderNumber,
                amount: amount,
                currency: currency,
                status: 'pending',
                message: 'Pedido creado - En espera de configuración de pagos',
                paymentConfigured: false
            }
        };

        console.log('Order creation completed successfully (without payment processing)');

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Payment intent creation error:', error);

        const errorResponse = {
            error: {
                code: 'PAYMENT_INTENT_FAILED',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
