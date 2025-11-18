import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

// Verificar autenticación de admin
async function verifyAdminAuth(request: NextRequest): Promise<{ success: boolean; adminId?: string; error?: string }> {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      console.warn(`⚠️ [${requestId}] FALTA COOKIE admin-token`);
      return { success: false, error: 'No autenticado' };
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret) as any;
    } catch (jwtError) {
      console.error(`❌ [${requestId}] JWT verification error:`, jwtError);
      return { success: false, error: 'Token inválido' };
    }

    if (decoded.type !== 'admin') {
      console.warn(`⚠️ [${requestId}] TOKEN SIN CLAIMS DE ADMIN`);
      return { success: false, error: 'No autorizado' };
    }

    return { success: true, adminId: decoded.id };
  } catch (error) {
    console.error(`❌ [${requestId}] Auth error:`, error);
    return { success: false, error: 'Error de autenticación' };
  }
}

// POST - Crear pedido manual
export async function POST(request: NextRequest) {
  try {
    console.log('📝 [Manual Order API] Recibida petición de crear pedido manual');

    // Verificar autenticación
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const {
      guest_name,
      guest_email,
      guest_phone,
      guest_address,
      items,
      subtotal,
      tax,
      shipping_fee,
      total,
    } = body;

    // Validar datos requeridos
    if (!guest_name || !guest_email || !guest_phone) {
      console.warn('⚠️ [Manual Order API] Faltan datos requeridos del cliente');
      return NextResponse.json(
        { error: 'Nombre, email y teléfono del cliente son requeridos' },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      console.warn('⚠️ [Manual Order API] No hay productos en el pedido');
      return NextResponse.json(
        { error: 'El pedido debe contener al menos un producto' },
        { status: 400 }
      );
    }

    if (typeof total !== 'number' || total < 0) {
      console.warn('⚠️ [Manual Order API] Total inválido');
      return NextResponse.json(
        { error: 'El total del pedido debe ser un número válido' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Crear el pedido en guest_orders
    const { data, error } = await supabase
      .from('guest_orders')
      .insert({
        guest_name: guest_name.trim(),
        guest_email: guest_email.trim(),
        guest_phone: guest_phone.trim(),
        guest_address: guest_address?.trim() || '',
        order_data: {
          items: items.map((item: any) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.product_price,
            subtotal: item.product_price * item.quantity,
          })),
          subtotal,
          tax,
          shipping_fee,
          total,
          created_by_admin: true,
          created_by_admin_id: auth.adminId,
          created_at: new Date().toISOString(),
        },
        total_amount: total,
        status: 'pendiente',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    console.log('💾 [Manual Order API] Pedido creation response:', { data, error });

    if (error) {
      console.error('❌ [Manual Order API] Error creating order:', error);
      return NextResponse.json(
        { error: 'Error al crear el pedido' },
        { status: 500 }
      );
    }

    console.log('✅ [Manual Order API] Pedido creado exitosamente:', {
      orderId: data.id,
      customer: guest_name,
      total,
      itemCount: items.length,
    });

    return NextResponse.json({
      success: true,
      orderId: data.id,
      message: 'Pedido creado exitosamente',
      data,
    });
  } catch (error) {
    console.error('❌ [Manual Order API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
