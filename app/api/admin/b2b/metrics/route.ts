import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener empresas
    const { data: companies, error: companiesError } = await supabase
      .from('b2b_companies')
      .select('status');

    if (companiesError) throw companiesError;

    const activeCompanies = companies?.filter(c => c.status === 'active').length || 0;
    const pendingCompanies = companies?.filter(c => c.status === 'pending').length || 0;

    // Obtener productos B2B
    const { data: products, error: productsError } = await supabase
      .from('b2b_products')
      .select('id');

    if (productsError) throw productsError;

    const activeProducts = products?.length || 0;

    // Obtener pedidos B2B de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayOrders, error: todayOrdersError } = await supabase
      .from('b2b_orders')
      .select('total')
      .gte('created_at', today.toISOString());

    if (todayOrdersError) throw todayOrdersError;

    const todayOrdersCount = todayOrders?.length || 0;
    const todayRevenue = todayOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    // Obtener pedidos B2B del mes
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: monthOrders, error: monthOrdersError } = await supabase
      .from('b2b_orders')
      .select('total, status, created_at');

    if (monthOrdersError) throw monthOrdersError;

    const monthOrdersFiltered = monthOrders?.filter(o => new Date(o.created_at || '') >= monthStart) || [];
    const monthOrdersCount = monthOrdersFiltered.length;
    const monthRevenue = monthOrdersFiltered.reduce((sum, order) => sum + (order.total || 0), 0);
    const pendingOrders = monthOrdersFiltered.filter(o => o.status === 'pending').length;

    // Obtener productos más vendidos hoy
    const { data: topProductsData, error: topProductsError } = await supabase
      .from('b2b_order_items')
      .select('product_snapshot, quantity')
      .gte('created_at', today.toISOString());

    if (topProductsError) throw topProductsError;

    // Agrupar por producto
    const productSales = new Map<string, { quantity: number; revenue: number }>();

    topProductsData?.forEach((item: any) => {
      const snapshot = typeof item.product_snapshot === 'string'
        ? JSON.parse(item.product_snapshot)
        : item.product_snapshot;

      const name = snapshot.name || 'Producto sin nombre';
      const price = snapshot.price || snapshot.base_price || 0;
      const quantity = item.quantity || 0;

      if (!productSales.has(name)) {
        productSales.set(name, { quantity: 0, revenue: 0 });
      }

      const current = productSales.get(name)!;
      current.quantity += quantity;
      current.revenue += quantity * price;
    });

    const topProducts = Array.from(productSales.entries())
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const metrics = {
      companies: {
        active: activeCompanies,
        pending: pendingCompanies,
        total: companies?.length || 0,
      },
      products: {
        active: activeProducts,
        total: products?.length || 0,
      },
      orders: {
        today: todayOrdersCount,
        month: monthOrdersCount,
        pending: pendingOrders,
      },
      revenue: {
        today: todayRevenue,
        month: monthRevenue,
      },
      topProducts,
    };

    return NextResponse.json({ success: true, metrics });
  } catch (error) {
    console.error('Error obteniendo métricas B2B:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener métricas B2B' },
      { status: 500 }
    );
  }
}
