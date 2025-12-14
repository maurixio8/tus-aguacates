import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

// Configuración CORS para permitir el dashboard
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://admin-dashboard-m9p6qyz27-mauricio-s-projects-2bf4b7a2.vercel.app',
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

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID del pedido es requerido' },
        { status: 400, headers: corsHeaders }
      );
    }

  // Crear cliente de Supabase con auth de admin
  const supabase = createSupabaseClient();

  // Primero, verificar si el pedido existe
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Primero eliminar los order_items relacionados
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('Error eliminando items del pedido:', itemsError);
      return NextResponse.json(
        { error: 'Error al eliminar los items del pedido' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Luego eliminar el pedido
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (orderError) {
      console.error('Error eliminando pedido:', orderError);
      return NextResponse.json(
        { error: 'Error al eliminar el pedido' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Pedido ${order.order_number} eliminado exitosamente`
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error en DELETE /api/admin/orders/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}