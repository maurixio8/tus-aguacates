import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production'
    ? 'https://tus-aguacates.vercel.app'
    : 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Cookie, Set-Cookie',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

// GET /api/admin/ruta - Obtener pedidos pendientes para la ruta
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pendiente';
    const limit = parseInt(searchParams.get('limit') || '200');
    const desde = searchParams.get('desde');
    const hasta = searchParams.get('hasta');
    const origin = searchParams.get('origin') || '';

    // Construir query base
    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        customer_phone,
        delivery_address,
        shipping_address,
        total_amount,
        order_data,
        created_at,
        delivered_at,
        payment_status,
        notes,
        delivery_notes
      `)
      .is('delivered_at', null)
      .or(`order_status.eq.${status},status.eq.${status}`);

    // Filtro por rango de fechas
    if (desde) {
      query = query.gte('created_at', desde);
    }
    if (hasta) {
      const hastaEnd = hasta.length === 10 ? hasta + 'T23:59:59.999Z' : hasta;
      query = query.lte('created_at', hastaEnd);
    }

    const { data: orders, error } = await query
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('❌ Error fetching ruta orders:', error);
      return NextResponse.json({ error: 'Error al obtener pedidos' }, {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Procesar cada pedido para extraer items
    const processed = (orders || []).map((order) => {
      const orderData = typeof order.order_data === 'string'
        ? JSON.parse(order.order_data)
        : (order.order_data || {});

      let items: any[] = [];
      if (Array.isArray(orderData?.items)) {
        items = orderData.items;
      } else if (typeof orderData === 'object') {
        // Intentar extraer items de diferentes formatos
        const possibleItems = (orderData as any).items || (orderData as any).products || [];
        items = Array.isArray(possibleItems) ? possibleItems : [];
      }

      // Extraer dirección limpia
      const rawAddress = order.delivery_address || '';
      const shippingAddr = order.shipping_address || {};
      let cleanAddress = rawAddress;
      
      return {
        id: order.id,
        orderNumber: order.order_number,
        customerName: order.customer_name || 'Cliente',
        customerPhone: order.customer_phone || '',
        deliveryAddress: cleanAddress.replace(/\?/g, '').trim(),
        totalAmount: order.total_amount || 0,
        items: items.map((item: any) => ({
          name: item.product_name || item.name || 'Producto',
          quantity: item.quantity || 1,
          price: item.price || 0,
        })),
        itemCount: items.length,
        createdAt: order.created_at,
        isDelivered: !!order.delivered_at,
        paymentStatus: order.payment_status || 'pending',
        notes: order.notes || order.delivery_notes || '',
      };
    });

    // Agrupar por zona (aproximación por localidad)
    const zones = groupByZone(processed);

    return NextResponse.json({
      orders: processed,
      zones,
      total: processed.length,
      totalAmount: processed.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ Error in GET /api/admin/ruta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, {
      status: 500,
      headers: corsHeaders,
    });
  }
}

// PATCH /api/admin/ruta - Marcar pedidos como entregados
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const body = await request.json();
    const { orderIds } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'Se requieren orderIds' }, {
        status: 400,
        headers: corsHeaders,
      });
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('orders')
      .update({
        delivered_at: now,
        updated_at: now,
        order_status: 'entregado',
        status: 'delivered',
      })
      .in('id', orderIds)
      .select('id, order_number, customer_name');

    if (error) {
      console.error('❌ Error marking orders as delivered:', error);
      return NextResponse.json({ error: 'Error al marcar pedidos' }, {
        status: 500,
        headers: corsHeaders,
      });
    }

    return NextResponse.json({
      success: true,
      marked: data?.length || 0,
      orders: data || [],
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ Error in PATCH /api/admin/ruta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, {
      status: 500,
      headers: corsHeaders,
    });
  }
}

// Agrupar pedidos por zona/localidad aproximada
function groupByZone(orders: any[]) {
  const zones: Record<string, { name: string; orders: any[]; count: number }> = {
    chapinero: { name: 'Chapinero', orders: [], count: 0 },
    usaquen: { name: 'Usaquén', orders: [], count: 0 },
    suba: { name: 'Suba', orders: [], count: 0 },
    engativa: { name: 'Engativá', orders: [], count: 0 },
    fontibon: { name: 'Fontibón', orders: [], count: 0 },
    teusaquillo: { name: 'Teusaquillo', orders: [], count: 0 },
    barrios_unidos: { name: 'Barrios Unidos', orders: [], count: 0 },
    puente_aranda: { name: 'Puente Aranda', orders: [], count: 0 },
    martires: { name: 'Mártires', orders: [], count: 0 },
    antonio_narino: { name: 'Antonio Nariño', orders: [], count: 0 },
    san_cristobal: { name: 'San Cristóbal', orders: [], count: 0 },
    santa_fe: { name: 'Santa Fe', orders: [], count: 0 },
    candelaria: { name: 'Candelaria', orders: [], count: 0 },
    rafael_uribe: { name: 'Rafael Uribe', orders: [], count: 0 },
    ciudad_bolivar: { name: 'Ciudad Bolívar', orders: [], count: 0 },
    usme: { name: 'Usme', orders: [], count: 0 },
    tintal: { name: 'Tintal / Bosa', orders: [], count: 0 },
    kennedy: { name: 'Kennedy', orders: [], count: 0 },
    otras: { name: 'Otras', orders: [], count: 0 },
  };

  const zoneKeywords: Record<string, string[]> = {
    chapinero: ['chapinero'],
    usaquen: ['usaquén', 'usAquen', 'cedritos', 'santa bárbara'],
    suba: ['suba', 'iberia', 'prado', 'mirandela'],
    engativa: ['engativá', 'engativa', 'normandía', 'villa', 'bonanza'],
    fontibon: ['fontibón', 'fontibon'],
    teusaquillo: ['teusaquillo', 'salitre', 'simón bolívar'],
    barrios_unidos: ['barrios unidos', 'doce de octubre', 'siete de agosto'],
    puente_aranda: ['puente aranda', 'galerías', 'paloquemao', 'carabelas'],
    martires: ['mártires', 'martires', 'voto nacional'],
    tintal: ['tintal', 'bosa', 'porvenir', 'olimpia'],
    kennedy: ['kennedy', 'britalia', 'patio bonito', 'marsella', 'dindalito'],
    ciudad_bolivar: ['ciudad bolívar', 'ciudad bolivar', 'arboleda'],
    rafael_uribe: ['rafael uribe', 'rafael uribe uribe', 'marruecos'],
    santa_fe: ['santa fe', 'santa fé', 'centro bogotá'],
    san_cristobal: ['san cristóbal', 'sancristobal', 'veinte de julio', 'socorro'],
    candelaria: ['candelaria', 'la candelaria'],
  };

  for (const order of orders) {
    const addr = (order.deliveryAddress || '').toLowerCase();
    let assigned = false;
    
    for (const [zone, keywords] of Object.entries(zoneKeywords)) {
      if (keywords.some(k => addr.includes(k))) {
        zones[zone].orders.push(order);
        zones[zone].count++;
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      zones.otras.orders.push(order);
      zones.otras.count++;
    }
  }

  // Devolver solo las zonas que tienen pedidos
  return Object.fromEntries(
    Object.entries(zones).filter(([_, z]) => z.count > 0)
  );
}
