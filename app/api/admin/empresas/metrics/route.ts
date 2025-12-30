import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Métricas del dashboard B2B
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Obtener todos los pedidos B2B
    const { data: allOrders, error } = await supabase
      .from('guest_orders')
      .select('*')
      .contains('order_data', { isB2B: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching B2B metrics:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const orders = allOrders || [];

    // Calcular métricas
    const todayOrders = orders.filter(o => new Date(o.created_at) >= new Date(todayStart));
    const weekOrders = orders.filter(o => new Date(o.created_at) >= new Date(weekStart));
    const monthOrders = orders.filter(o => new Date(o.created_at) >= new Date(monthStart));
    const pendingOrders = orders.filter(o => o.status === 'pending' || !o.status);

    const sumTotal = (arr: any[]) => arr.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Top productos
    const productCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};
    orders.forEach(order => {
      const items = order.order_data?.items || [];
      items.forEach((item: any) => {
        const name = item.productName || item.name || 'Producto';
        if (!productCounts[name]) {
          productCounts[name] = { name, quantity: 0, revenue: 0 };
        }
        productCounts[name].quantity += item.quantity || 1;
        productCounts[name].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });

    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top clientes
    const clientCounts: Record<string, { name: string; company: string; orders: number; total: number }> = {};
    orders.forEach(order => {
      const clientKey = order.customer_email || order.customer_name || 'unknown';
      const company = order.order_data?.companyName || '';
      if (!clientCounts[clientKey]) {
        clientCounts[clientKey] = {
          name: order.customer_name || 'Cliente',
          company,
          orders: 0,
          total: 0
        };
      }
      clientCounts[clientKey].orders++;
      clientCounts[clientKey].total += order.total_amount || 0;
    });

    const topClients = Object.values(clientCounts)
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);

    // Pedidos recientes
    const recentOrders = orders.slice(0, 5).map(order => ({
      id: order.id,
      order_number: order.id.substring(0, 8).toUpperCase(),
      customer_name: order.customer_name || 'Cliente',
      company_name: order.order_data?.companyName,
      total: order.total_amount || 0,
      status: order.status || 'pending',
      created_at: order.created_at
    }));

    const metrics = {
      today: {
        orders: todayOrders.length,
        revenue: sumTotal(todayOrders)
      },
      week: {
        orders: weekOrders.length,
        revenue: sumTotal(weekOrders)
      },
      month: {
        orders: monthOrders.length,
        revenue: sumTotal(monthOrders)
      },
      pending: {
        count: pendingOrders.length
      },
      recentOrders,
      topProducts,
      topClients
    };

    return NextResponse.json({ success: true, metrics });

  } catch (error) {
    console.error('Error in B2B metrics API:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}
