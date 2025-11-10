// Edge Function para métricas del dashboard principal
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

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Pedidos del día
    const ordersToday = await fetch(
      `${supabaseUrl}/rest/v1/guest_orders?created_at=gte.${today}T00:00:00`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    ).then(r => r.json());

    // Calcular ventas del día
    const totalToday = ordersToday.reduce((sum: number, order: any) => sum + parseFloat(order.total_amount || 0), 0);

    // Pedidos pendientes
    const pendingOrders = await fetch(
      `${supabaseUrl}/rest/v1/guest_orders?order_status=eq.pendiente`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    ).then(r => r.json());

    // Productos más vendidos del día (necesitamos parsear order_items que es JSONB)
    const productStats: Record<string, any> = {};
    ordersToday.forEach((order: any) => {
      if (order.order_items && Array.isArray(order.order_items)) {
        order.order_items.forEach((item: any) => {
          const key = item.productName || item.product_name || 'Desconocido';
          if (!productStats[key]) {
            productStats[key] = { name: key, quantity: 0, revenue: 0 };
          }
          productStats[key].quantity += item.quantity || 0;
          productStats[key].revenue += (item.price || 0) * (item.quantity || 0);
        });
      }
    });

    const topProducts = Object.values(productStats)
      .sort((a: any, b: any) => b.quantity - a.quantity)
      .slice(0, 5);

    // Productos para mañana (pedidos con delivery_date = mañana)
    const tomorrowOrders = await fetch(
      `${supabaseUrl}/rest/v1/guest_orders?delivery_date=eq.${tomorrow}`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    ).then(r => r.json());

    const tomorrowProducts: Record<string, any> = {};
    tomorrowOrders.forEach((order: any) => {
      if (order.order_items && Array.isArray(order.order_items)) {
        order.order_items.forEach((item: any) => {
          const key = item.productName || item.product_name || 'Desconocido';
          if (!tomorrowProducts[key]) {
            tomorrowProducts[key] = { name: key, quantity: 0 };
          }
          tomorrowProducts[key].quantity += item.quantity || 0;
        });
      }
    });

    // Ventas por categoría (últimos 7 días)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const ordersWeek = await fetch(
      `${supabaseUrl}/rest/v1/guest_orders?created_at=gte.${weekAgo}T00:00:00`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    ).then(r => r.json());

    const categoryStats: Record<string, number> = {};
    ordersWeek.forEach((order: any) => {
      if (order.order_items && Array.isArray(order.order_items)) {
        order.order_items.forEach((item: any) => {
          const category = item.category || 'Otros';
          categoryStats[category] = (categoryStats[category] || 0) + ((item.price || 0) * (item.quantity || 0));
        });
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        metrics: {
          today: {
            orders: ordersToday.length,
            revenue: totalToday,
            topProducts: topProducts
          },
          pending: {
            count: pendingOrders.length,
            orders: pendingOrders
          },
          tomorrow: {
            ordersCount: tomorrowOrders.length,
            products: Object.values(tomorrowProducts)
          },
          categoryStats: categoryStats
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error en métricas:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
