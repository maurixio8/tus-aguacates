// Edge Function para notificaciones WhatsApp duales
// Envía notificación a empresa y cliente

interface OrderData {
  id: string;
  items: Array<{
    productName: string;
    variantName?: string;
    quantity: number;
    price: number;
  }>;
  total: number;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  deliveryDate?: string;
  deliveryTime?: string;
}

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

    // Números configurados según BMAD Spec
    const businessPhone = Deno.env.get('WHATSAPP_COMPANY_NUMBER') || '573042582777';
    const customerPhone = customerInfo.phone;

    // Formatear productos
    const productLines = orderData.items.map((item) => {
      const variantInfo = item.variantName ? ` (${item.variantName})` : '';
      return `${item.productName}${variantInfo} x${item.quantity} - $${(item.price * item.quantity).toLocaleString('es-CO')}`;
    }).join('\n');

    // Mensaje para la EMPRESA
    const businessMessage = `
🔔 *NUEVO PEDIDO - TUS AGUACATES*

*Cliente:* ${customerInfo.name}
*Telefono:* ${customerInfo.phone}
*Email:* ${customerInfo.email}

📦 *PRODUCTOS:*
${productLines}

💰 *TOTAL:* $${orderData.total.toLocaleString('es-CO')}

🏠 *DIRECCIÓN DE ENTREGA:*
${customerInfo.address}

${orderData.deliveryDate ? `📅 *Fecha:* ${orderData.deliveryDate}` : ''}
${orderData.deliveryTime ? `⏰ *Horario:* ${orderData.deliveryTime === 'mañana' ? 'Mañana (8am-12pm)' : 'Tarde (2pm-6pm)'}` : '⏰ *Horario:* Por definir'}

🚚 *Entregas:* Martes y Viernes en Bogotá
    `.trim();

    // Mensaje para el CLIENTE
    const customerMessage = `
✅ *PEDIDO CONFIRMADO - TUS AGUACATES*

¡Hola ${customerInfo.name}! Tu pedido ha sido recibido exitosamente.

📋 *RESUMEN DE TU PEDIDO:*
*Pedido ID:* #${orderData.id}

📦 *Productos:*
${productLines}

💰 *Total:* $${orderData.total.toLocaleString('es-CO')}

🏠 *Dirección de Entrega:*
${customerInfo.address}

${orderData.deliveryDate ? `📅 *Fecha:* ${orderData.deliveryDate}` : ''}
${orderData.deliveryTime ? `⏰ *Horario:* ${orderData.deliveryTime === 'mañana' ? 'Mañana (8am-12pm)' : 'Tarde (2pm-6pm)'}` : ''}

🙏 *Gracias por tu compra!*
Te contactaremos pronto para confirmar detalles de entrega.
    `.trim();

    // Generar URLs de WhatsApp
    const encodedBusinessMessage = encodeURIComponent(businessMessage);
    const encodedCustomerMessage = encodeURIComponent(customerMessage);

    const businessWhatsAppUrl = `https://wa.me/${businessPhone}?text=${encodedBusinessMessage}`;
    const customerWhatsAppUrl = `https://wa.me/57${customerPhone.replace(/\D/g, '')}?text=${encodedCustomerMessage}`;

    return new Response(
      JSON.stringify({
        success: true,
        businessWhatsAppUrl,
        customerWhatsAppUrl,
        businessMessage,
        customerMessage,
        message: 'Notificaciones WhatsApp generadas exitosamente'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error en notificación WhatsApp:', error);
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