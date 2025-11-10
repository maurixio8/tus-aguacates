// Edge Function para gestión de pedidos
Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const url = new URL(req.url);
    const orderId = url.searchParams.get('id');

    // GET - Listar pedidos
    if (req.method === 'GET' && !orderId) {
      const status = url.searchParams.get('status');
      const dateFrom = url.searchParams.get('dateFrom');
      const dateTo = url.searchParams.get('dateTo');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      let query = `${supabaseUrl}/rest/v1/guest_orders?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`;

      if (status) {
        query += `&order_status=eq.${status}`;
      }

      if (dateFrom) {
        query += `&created_at=gte.${dateFrom}T00:00:00`;
      }

      if (dateTo) {
        query += `&created_at=lte.${dateTo}T23:59:59`;
      }

      const response = await fetch(query, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      const orders = await response.json();

      // Contar total
      let countQuery = `${supabaseUrl}/rest/v1/guest_orders?select=count`;
      if (status) {
        countQuery += `&order_status=eq.${status}`;
      }
      if (dateFrom) {
        countQuery += `&created_at=gte.${dateFrom}T00:00:00`;
      }
      if (dateTo) {
        countQuery += `&created_at=lte.${dateTo}T23:59:59`;
      }

      const countResponse = await fetch(countQuery, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'count=exact'
        }
      });

      const totalCount = parseInt(countResponse.headers.get('content-range')?.split('/')[1] || '0');

      return new Response(
        JSON.stringify({
          success: true,
          orders: orders,
          pagination: {
            page: page,
            limit: limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // GET - Obtener pedido específico
    if (req.method === 'GET' && orderId) {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/guest_orders?id=eq.${orderId}`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }
      );

      const orders = await response.json();

      if (!orders || orders.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Pedido no encontrado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      return new Response(
        JSON.stringify({ success: true, order: orders[0] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // PATCH - Actualizar estado del pedido
    if (req.method === 'PATCH' && orderId) {
      const { order_status } = await req.json();

      if (!order_status) {
        return new Response(
          JSON.stringify({ error: 'Estado requerido' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const validStatuses = ['pendiente', 'en_preparacion', 'listo_entrega', 'entregado', 'cancelado'];
      if (!validStatuses.includes(order_status)) {
        return new Response(
          JSON.stringify({ error: 'Estado no válido' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/guest_orders?id=eq.${orderId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ order_status: order_status })
        }
      );

      const updated = await response.json();

      return new Response(
        JSON.stringify({ success: true, order: updated[0] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Acción no válida' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Error en orders-management:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
