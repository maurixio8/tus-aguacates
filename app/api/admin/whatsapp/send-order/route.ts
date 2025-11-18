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

// POST - Enviar resumen por WhatsApp
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
      order_id,
      items,
      subtotal,
      tax,
      shipping_fee,
      total,
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

    // Formatear el mensaje de WhatsApp
    const formattedPhone = formatPhoneForWhatsApp(customer_phone);
    const itemsList = items
      .map(
        (item: any) =>
          `🥑 ${item.product_name}\n   Cantidad: ${item.quantity} × ${formatPrice(item.product_price)} = ${formatPrice(item.product_price * item.quantity)}`
      )
      .join('\n\n');

    const message = `¡Hola ${customer_name}! 👋

Resumen de tu pedido:

${itemsList}

═══════════════════════════════
Subtotal: ${formatPrice(subtotal)}
Impuesto: ${formatPrice(tax)}
Envío: ${formatPrice(shipping_fee)}
═══════════════════════════════
*Total: ${formatPrice(total)}*

📍 Estado: Pendiente de confirmación
🆔 Pedido: ${order_id}

¿Confirmas este pedido?

*Tus Aguacates* 🥑
Productos frescos garantizados`;

    // Crear el link de WhatsApp
    // Format: https://api.whatsapp.com/send?phone=PHONENUMBER&text=URLENCODEDTEXT
    const whatsappLink = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;

    console.log('✅ [WhatsApp API] Mensaje generado exitosamente:', {
      customer: customer_name,
      phone: formattedPhone,
      messageLength: message.length,
      orderId: order_id,
    });

    return NextResponse.json({
      success: true,
      whatsappLink,
      message, // Para preview/debug
      customer_name,
      customer_phone: formattedPhone,
      order_id,
    });
  } catch (error) {
    console.error('❌ [WhatsApp API] Error:', error);
    return NextResponse.json(
      { error: 'Error al generar el link de WhatsApp' },
      { status: 500 }
    );
  }
}
