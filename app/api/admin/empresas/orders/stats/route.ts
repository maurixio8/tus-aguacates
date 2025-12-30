import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Estadísticas de pedidos B2B
export async function GET(request: NextRequest) {
  try {
    // Obtener todos los pedidos B2B
    const { data: orders, error } = await supabase
      .from('guest_orders')
      .select('id, status')
      .contains('order_data', { isB2B: true });

    if (error) {
      console.error('Error fetching B2B order stats:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Contar por estado
    const stats = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      total: orders?.length || 0
    };

    orders?.forEach(order => {
      const status = order.status || 'pending';
      if (status in stats) {
        stats[status as keyof typeof stats]++;
      }
    });

    return NextResponse.json({ success: true, stats });

  } catch (error) {
    console.error('Error in B2B order stats API:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}
