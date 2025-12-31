import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Generar reportes B2B
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';

    // Calcular fecha de inicio según el rango
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0); // Todo el histórico
    }

    // Obtener pedidos B2B en el rango
    let query = supabase
      .from('guest_orders')
      .select('*')
      .contains('order_data', { isB2B: true })
      .order('created_at', { ascending: false });

    if (range !== 'all') {
      query = query.gte('created_at', startDate.toISOString());
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching B2B orders for reports:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const ordersList = orders || [];

    // Calcular métricas
    const totalRevenue = ordersList.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const totalOrders = ordersList.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Clientes únicos
    const uniqueClientsSet = new Set(ordersList.map(o => o.customer_email || o.customer_phone || o.customer_name));
    const uniqueClients = uniqueClientsSet.size;

    // Top productos
    const productCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};
    ordersList.forEach(order => {
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
      .slice(0, 10);

    // Top clientes
    const clientCounts: Record<string, { name: string; company: string; orders: number; total: number }> = {};
    ordersList.forEach(order => {
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
      .slice(0, 10);

    // Por categoría (extraer de items)
    const categoryCounts: Record<string, { category: string; revenue: number; orders: number }> = {};
    ordersList.forEach(order => {
      const items = order.order_data?.items || [];
      items.forEach((item: any) => {
        const category = item.category || 'general';
        if (!categoryCounts[category]) {
          categoryCounts[category] = { category, revenue: 0, orders: 0 };
        }
        categoryCounts[category].revenue += (item.price || 0) * (item.quantity || 1);
        categoryCounts[category].orders++;
      });
    });
    const byCategory = Object.values(categoryCounts)
      .sort((a, b) => b.revenue - a.revenue);

    // Datos mensuales (últimos 6 meses)
    const monthlyData: Record<string, { month: string; revenue: number; orders: number }> = {};
    ordersList.forEach(order => {
      const date = new Date(order.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, revenue: 0, orders: 0 };
      }
      monthlyData[monthKey].revenue += order.total_amount || 0;
      monthlyData[monthKey].orders++;
    });
    const monthly = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    const report = {
      summary: {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        uniqueClients
      },
      monthly,
      topProducts,
      topClients,
      byCategory
    };

    return NextResponse.json({ success: true, report });

  } catch (error) {
    console.error('Error in B2B reports API:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}
