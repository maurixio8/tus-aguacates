import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// Verificar autenticación de admin
async function verifyAdminAuth(request: NextRequest): Promise<{ success: boolean; adminId?: string; error?: string }> {
  try {
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      return { success: false, error: 'No autenticado' };
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret) as any;
    } catch (jwtError) {
      return { success: false, error: 'Token inválido' };
    }

    if (decoded.type !== 'admin') {
      return { success: false, error: 'No autorizado' };
    }

    return { success: true, adminId: decoded.id };
  } catch (error) {
    return { success: false, error: 'Error de autenticación' };
  }
}

// Formatear precio en COP
function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(price);
}

// Formatear teléfono a formato WhatsApp
function formatPhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const withoutZero = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;

  if (withoutZero.length === 10) {
    return `57${withoutZero}`;
  }
  return withoutZero;
}

// Generar ID de orden con timestamp
function generateOrderId(): string {
  return 'CO-' + Date.now();
}

// Traducir tipo de servicio
function translateServiceType(type: string): string {
  const map: Record<string, string> = {
    'domicilio': '🚚 Domicilio',
    'recogida': '🏪 Recogida en tienda',
    'envio': '📦 Envío especial'
  };
  return map[type] || type;
}

// POST - Enviar resumen por WhatsApp con formato profesional
export async function POST(request: NextRequest) {
  try {
    console.log('📱 [WhatsApp API] Recibida petición de enviar resumen por WhatsApp');

    // Verificar autenticación
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_address,
      order_id,
      items,
      subtotal,
      tax,
      shipping_fee,
      total,
      service_type,
      payment_method,
      amount_received,
      change,
      site_url,
    } = body;

    // Validar datos requeridos
    if (!customer_name || !customer_phone) {
      console.warn('⚠️ [WhatsApp API] Faltan datos requeridos del cliente');
      return NextResponse.json(
        { error: 'Nombre y teléfono del cliente son requeridos' },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      console.warn('⚠️ [WhatsApp API] No hay productos en el pedido');
      return NextResponse.json(
        { error: 'El pedido debe contener al menos un producto' },
        { status: 400 }
      );
    }

    // Formatear datos
    const formattedPhone = formatPhoneForWhatsApp(customer_phone);
    const orderNumber = order_id || generateOrderId();
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('es-CO');
    const timeStr = currentDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Construcción del mensaje personalizado
    const itemsList = items
      .map((item: any) => {
        const emoji = getProductEmoji(item.product_name);
        return `*X${item.quantity}* ${emoji}${item.product_name} $ ${item.product_price.toLocaleString('es-CO')}`;
      })
      .join('\n');

    // Información de pago
    let paymentInfo = '';
    if (payment_method === 'efectivo') {
      paymentInfo = `Efectivo ${amount_received?.toLocaleString('es-CO')} (monto recibido ${amount_received?.toLocaleString('es-CO')}, vuelto ${change?.toLocaleString('es-CO')})`;
    } else if (payment_method === 'transferencia') {
      paymentInfo = 'Transferencia bancaria';
    } else if (payment_method === 'tarjeta') {
      paymentInfo = 'Tarjeta de crédito';
    } else {
      paymentInfo = 'Por definir';
    }

    const message = `👋 Hola ${customer_name}  acá en esta tu resumen ✨

Vengo de ${site_url || 'https://tusaguacatescom.ola.click'}
${orderNumber}
🗓️ ${dateStr} ⏰ ${timeStr}

*Tipo de servicio: ${translateServiceType(service_type)}*

*Nombre:* ${customer_name}
*Teléfono:* 57 ${formattedPhone.replace('57', '')}
*Dirección:* ${customer_address}

*📝 Productos*
${itemsList}

*Subtotal:* $ ${subtotal.toLocaleString('es-CO')}
*Entrega:* Por definir
*Total:* $ ${total.toLocaleString('es-CO')}

*💲 Pago*
*Estado del pago:* ${payment_method === 'pendiente' ? 'por definir' : 'Confirmado'}
*Total a pagar:* $ ${total.toLocaleString('es-CO')}
${paymentInfo}

${payment_method === 'efectivo' ? 'El domiciliario recaudara en efectivo o como desees' : ''}

👆 Envíanos este mensaje ahora. En cuanto lo recibamos estaremos atendiéndole.`;

    // Crear el link de WhatsApp
    // Format: https://api.whatsapp.com/send?phone=PHONENUMBER&text=URLENCODEDTEXT
    const whatsappLink = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;

    console.log('✅ [WhatsApp API] Mensaje generado exitosamente:', {
      customer: customer_name,
      phone: formattedPhone,
      messageLength: message.length,
      orderId: orderNumber,
    });

    return NextResponse.json({
      success: true,
      whatsappLink,
      message,
      customer_name,
      customer_phone: formattedPhone,
      order_id: orderNumber,
    });
  } catch (error) {
    console.error('❌ [WhatsApp API] Error:', error);
    return NextResponse.json(
      { error: 'Error al generar el link de WhatsApp' },
      { status: 500 }
    );
  }
}

// Función auxiliar para obtener emoji del producto
function getProductEmoji(productName: string): string {
  const name = productName.toLowerCase();

  if (name.includes('aguacate')) return '🥑';
  if (name.includes('sandía')) return '🍉';
  if (name.includes('durazno')) return '🍑';
  if (name.includes('fresa')) return '🍓';
  if (name.includes('limón')) return '🫒';
  if (name.includes('mango')) return '🥭';
  if (name.includes('tomate')) return '🍅';
  if (name.includes('espárrago')) return '🎋';
  if (name.includes('mora')) return '🫐';
  if (name.includes('papaya')) return '🧡';
  if (name.includes('piña')) return '🍍';
  if (name.includes('naranja')) return '🍊';
  if (name.includes('limón')) return '🍋';
  if (name.includes('cereza')) return '🍒';
  if (name.includes('cereza')) return '🍒';
  if (name.includes('pera')) return '🍐';
  if (name.includes('plátano')) return '🍌';
  if (name.includes('coco')) return '🥥';

  // Default para verduras/frutas genéricas
  return '🟢';
}
