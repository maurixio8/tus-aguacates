import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient, requireAdminRole } from '@/lib/auth-admin';
import { normalizeOrderStatus } from '@/lib/orders/operational';

export const dynamic = 'force-dynamic';

// GET - Obtener estadísticas de pedidos
export async function GET(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'viewer');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const supabase = createSupabaseClient();

    // Obtener conteos por estado de la tabla orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('status');

    if (ordersError) {
      console.error('Error getting orders stats:', ordersError);
      return NextResponse.json(
        { error: 'Error al obtener estadísticas' },
        { status: 500 }
      );
    }

    // Obtener conteos por estado de guest_orders
    const { data: guestOrdersData, error: guestError } = await supabase
      .from('guest_orders')
      .select('status');

    // Inicializar contadores
    const stats = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      total: 0
    };

    // Contar pedidos de orders
    if (ordersData) {
      for (const order of ordersData) {
        const status = normalizeOrderStatus(order.status);
        stats[status]++;
        stats.total++;
      }
    }

    // Contar pedidos de guest_orders
    if (guestOrdersData) {
      for (const order of guestOrdersData) {
        const status = normalizeOrderStatus(order.status);
        stats[status]++;
        stats.total++;
      }
    }

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
