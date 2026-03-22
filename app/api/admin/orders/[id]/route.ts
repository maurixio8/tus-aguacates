import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient, requireAdminRole } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

// Configuración CORS para permitir el dashboard
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Cookie, Set-Cookie',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

// Manejar solicitudes OPTIONS para CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminAccess = await requireAdminRole(request, 'super_admin', corsHeaders);
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const { id: orderId } = await params;

    console.log('🗑️ [DELETE ORDER] Intentando eliminar pedido:', orderId);

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID del pedido es requerido' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Crear cliente de Supabase
    const supabase = createSupabaseClient();

    // Intentar buscar primero en la tabla 'orders'
    let orderSource: 'orders' | 'guest_orders' = 'orders';
    let orderNumber = '';

    const { data: regularOrder, error: regularError } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('id', orderId)
      .single();

    console.log('🔍 [DELETE ORDER] Búsqueda en orders:', { found: !!regularOrder, error: regularError?.message });

    if (!regularOrder) {
      // Si no está en orders, buscar en guest_orders
      console.log('🔍 [DELETE ORDER] No encontrado en orders, buscando en guest_orders...');

      const { data: guestOrder, error: guestError } = await supabase
        .from('guest_orders')
        .select('id')
        .eq('id', orderId)
        .single();

      console.log('🔍 [DELETE ORDER] Búsqueda en guest_orders:', { found: !!guestOrder, error: guestError?.message });

      if (!guestOrder) {
        console.error('❌ [DELETE ORDER] Pedido no encontrado en ninguna tabla:', orderId);
        return NextResponse.json(
          { error: 'Pedido no encontrado', details: 'No existe en orders ni guest_orders' },
          { status: 404, headers: corsHeaders }
        );
      }

      orderSource = 'guest_orders';
      orderNumber = `INV-${orderId.slice(-8)}`;
    } else {
      orderNumber = regularOrder.order_number || orderId.slice(-8);
    }

    console.log(`🗑️ [DELETE ORDER] Pedido encontrado en tabla: ${orderSource}`);

    // Eliminar según la tabla de origen
    if (orderSource === 'orders') {
      // Primero eliminar los order_items relacionados
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('⚠️ [DELETE ORDER] Error eliminando items:', itemsError);
        // No es crítico, continuar
      }

      // Luego eliminar el pedido
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) {
        console.error('❌ [DELETE ORDER] Error eliminando pedido de orders:', orderError);
        return NextResponse.json(
          { error: 'Error al eliminar el pedido', details: orderError.message },
          { status: 500, headers: corsHeaders }
        );
      }
    } else {
      // Eliminar de guest_orders
      const { error: guestDeleteError } = await supabase
        .from('guest_orders')
        .delete()
        .eq('id', orderId);

      if (guestDeleteError) {
        console.error('❌ [DELETE ORDER] Error eliminando pedido de guest_orders:', guestDeleteError);
        return NextResponse.json(
          { error: 'Error al eliminar el pedido', details: guestDeleteError.message },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    console.log('✅ [DELETE ORDER] Pedido eliminado exitosamente:', orderNumber, `(de ${orderSource})`);

    return NextResponse.json({
      success: true,
      message: `Pedido ${orderNumber} eliminado exitosamente`
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ [DELETE ORDER] Error fatal:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: corsHeaders }
    );
  }
}
