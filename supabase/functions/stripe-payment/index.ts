// Edge Function para procesar pagos con Stripe
// Maneja la creación de Payment Intent y confirmación de pagos

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    const { action, amount, orderId, paymentMethodId, customerEmail } = await req.json();
    
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY no configurada');
    }

    const stripeApiUrl = 'https://api.stripe.com/v1';

    // Acción: crear Payment Intent
    if (action === 'create_payment_intent') {
      // Crear Payment Intent en Stripe
      const paymentIntentParams = new URLSearchParams({
        amount: Math.round(amount * 100).toString(), // Convertir a centavos
        currency: 'cop', // Pesos colombianos
        'automatic_payment_methods[enabled]': 'true',
        'receipt_email': customerEmail || '',
        'metadata[order_id]': orderId || '',
      });

      const paymentIntentResponse = await fetch(`${stripeApiUrl}/payment_intents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: paymentIntentParams.toString(),
      });

      if (!paymentIntentResponse.ok) {
        const errorText = await paymentIntentResponse.text();
        throw new Error(`Error al crear Payment Intent: ${errorText}`);
      }

      const paymentIntent = await paymentIntentResponse.json();

      return new Response(
        JSON.stringify({ 
          success: true, 
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Acción: confirmar pago
    if (action === 'confirm_payment') {
      // Confirmar que el pago se completó
      const paymentIntentResponse = await fetch(`${stripeApiUrl}/payment_intents/${paymentMethodId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        },
      });

      if (!paymentIntentResponse.ok) {
        throw new Error('Error al verificar el pago');
      }

      const paymentIntent = await paymentIntentResponse.json();

      if (paymentIntent.status === 'succeeded') {
        // Actualizar orden en base de datos
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (orderId && supabaseUrl && serviceRoleKey) {
          await fetch(`${supabaseUrl}/rest/v1/guest_orders?id=eq.${orderId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'pagado',
              payment_intent_id: paymentIntent.id,
            }),
          });
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            status: 'succeeded',
            message: 'Pago completado exitosamente'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } else {
        return new Response(
          JSON.stringify({ 
            success: false, 
            status: paymentIntent.status,
            message: 'El pago no se completó'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
    }

    throw new Error('Acción no válida');

  } catch (error) {
    console.error('Error en payment processing:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
