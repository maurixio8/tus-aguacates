// Edge Function para reportes y análisis
Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const url = new URL(req.url);
    const reportType = url.searchParams.get('type');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    const from = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const to = dateTo || new Date().toISOString().split('T')[0];

    // Obtener todos los pedidos del rango
    const ordersResponse = await fetch(
      `${supabaseUrl}/rest/v1/guest_orders?created_at=gte.${from}T00:00:00&created_at=lte.${to}T23:59:59`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    const orders = await ordersResponse.json();

    if (reportType === 'sales_summary') {
      // Resumen de ventas
      const totalRevenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || 0), 0);
      const averageOrder = orders.length > 0 ? totalRevenue / orders.length : 0;

      const statusCount: Record<string, number> = {};
      orders.forEach((o: any) => {
        const status = o.order_status || 'pendiente';
        statusCount[status] = (statusCount[status] || 0) + 1;
      });

      return new Response(
        JSON.stringify({
          success: true,
          report: {
            type: 'sales_summary',
            period: { from, to },
            totalOrders: orders.length,
            totalRevenue: totalRevenue,
            averageOrderValue: averageOrder,
            ordersByStatus: statusCount
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (reportType === 'top_products') {
      // Productos más vendidos
      const productStats: Record<string, any> = {};

      orders.forEach((order: any) => {
        if (order.order_items && Array.isArray(order.order_items)) {
          order.order_items.forEach((item: any) => {
            const key = item.productName || item.product_name || 'Desconocido';
            if (!productStats[key]) {
              productStats[key] = { name: key, quantity: 0, revenue: 0, orders: 0 };
            }
            productStats[key].quantity += item.quantity || 0;
            productStats[key].revenue += (item.price || 0) * (item.quantity || 0);
            productStats[key].orders += 1;
          });
        }
      });

      const topProducts = Object.values(productStats)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 20);

      return new Response(
        JSON.stringify({
          success: true,
          report: {
            type: 'top_products',
            period: { from, to },
            products: topProducts
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (reportType === 'sales_by_category') {
      // Ventas por categoría
      const categoryStats: Record<string, any> = {};

      orders.forEach((order: any) => {
        if (order.order_items && Array.isArray(order.order_items)) {
          order.order_items.forEach((item: any) => {
            const category = item.category || 'Otros';
            if (!categoryStats[category]) {
              categoryStats[category] = { category: category, revenue: 0, quantity: 0 };
            }
            categoryStats[category].revenue += (item.price || 0) * (item.quantity || 0);
            categoryStats[category].quantity += item.quantity || 0;
          });
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          report: {
            type: 'sales_by_category',
            period: { from, to },
            categories: Object.values(categoryStats).sort((a: any, b: any) => b.revenue - a.revenue)
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (reportType === 'daily_sales') {
      // Ventas diarias
      const dailyStats: Record<string, any> = {};

      orders.forEach((order: any) => {
        const date = order.created_at.split('T')[0];
        if (!dailyStats[date]) {
          dailyStats[date] = { date: date, orders: 0, revenue: 0 };
        }
        dailyStats[date].orders += 1;
        dailyStats[date].revenue += parseFloat(order.total_amount || 0);
      });

      const dailySales = Object.values(dailyStats).sort((a: any, b: any) => a.date.localeCompare(b.date));

      return new Response(
        JSON.stringify({
          success: true,
          report: {
            type: 'daily_sales',
            period: { from, to },
            daily: dailySales
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Reporte general
    return new Response(
      JSON.stringify({
        success: true,
        report: {
          type: 'general',
          period: { from, to },
          totalOrders: orders.length,
          availableReports: ['sales_summary', 'top_products', 'sales_by_category', 'daily_sales']
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error en reports:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
