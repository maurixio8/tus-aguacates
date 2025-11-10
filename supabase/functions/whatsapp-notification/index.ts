// Edge Function para generar mensaje de WhatsApp
// No envía directamente, genera URL de WhatsApp Web con mensaje pre-formateado

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
    const { orderData, customerInfo } = await req.json();

    // Número de WhatsApp del negocio (configurado según BMAD Spec)
    const businessPhone = Deno.env.get('WHATSAPP_BUSINESS_NUMBER') || '573042582777';

    // Formatear productos
    const productLines = orderData.items.map((item: any) => {
      const variantInfo = item.variantName ? ` (${item.variantName})` : '';
      return `${item.productName}${variantInfo} x${item.quantity} - $${(item.price * item.quantity).toLocaleString('es-CO')}`;
    }).join('\n');

    // Crear mensaje estructurado
    const message = `
*NUEVO PEDIDO - TUS AGUACATES*

*Cliente:* ${customerInfo.name}
*Telefono:* ${customerInfo.phone}
*Email:* ${customerInfo.email}

*PRODUCTOS:*
${productLines}

*TOTAL:* $${orderData.total.toLocaleString('es-CO')}

*DIRECCION DE ENTREGA:*
${customerInfo.address}

${orderData.deliveryDate ? `*Fecha solicitada:* ${orderData.deliveryDate}` : ''}
${orderData.deliveryTime ? `*Horario:* ${orderData.deliveryTime === 'mañana' ? 'Mañana (8am-12pm)' : 'Tarde (2pm-6pm)'}` : ''}

Entregas: Martes y Viernes en Bogota
    `.trim();

    // Generar URL de WhatsApp Web
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${businessPhone}?text=${encodedMessage}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        whatsappUrl,
        message: 'URL de WhatsApp generada exitosamente' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error:', error);
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
