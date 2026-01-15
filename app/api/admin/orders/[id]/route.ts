import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
    const { id: orderId } = await params;

    console.log('🗑️ [DELETE ORDER] Intentando eliminar pedido:', orderId);

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID del pedido es requerido' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Primero, verificar si el pedido existe
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('id', orderId)
      .single();

    console.log('🔍 [DELETE ORDER] Búsqueda de pedido:', { order, error: fetchError?.message });

    if (fetchError || !order) {
      console.error('❌ [DELETE ORDER] Pedido no encontrado:', orderId, fetchError);
      return NextResponse.json(
        { error: 'Pedido no encontrado', details: fetchError?.message },
        { status: 404, headers: corsHeaders }
      );
    }

    // Primero eliminar los order_items relacionados
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('⚠️ [DELETE ORDER] Error eliminando items (puede ser normal si no hay items):', itemsError);
      // No retornar error aquí, algunos pedidos pueden no tener items en esta tabla
    }

    // Luego eliminar el pedido
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (orderError) {
      console.error('❌ [DELETE ORDER] Error eliminando pedido:', orderError);
      return NextResponse.json(
        { error: 'Error al eliminar el pedido', details: orderError.message },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('✅ [DELETE ORDER] Pedido eliminado exitosamente:', order.order_number);

    return NextResponse.json({
      success: true,
      message: `Pedido ${order.order_number} eliminado exitosamente`
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ [DELETE ORDER] Error fatal:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: corsHeaders }
    );
  }
}