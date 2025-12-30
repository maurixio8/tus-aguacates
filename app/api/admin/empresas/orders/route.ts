import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Obtener pedidos B2B
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;

    // Query para pedidos B2B (isB2B: true en order_data)
    let query = supabase
      .from('guest_orders')
      .select('*', { count: 'exact' })
      .contains('order_data', { isB2B: true })
      .order('created_at', { ascending: false });

    // Filtros
    if (status) {
      query = query.eq('status', status);
    }

    if (dateFrom) {
      query = query.gte('created_at', `${dateFrom}T00:00:00`);
    }

    if (dateTo) {
      query = query.lte('created_at', `${dateTo}T23:59:59`);
    }

    // Paginación
    query = query.range(offset, offset + limit - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Error fetching B2B orders:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Filtrar por búsqueda si existe (después de la query por limitaciones de JSONB)
    let filteredOrders = orders || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredOrders = filteredOrders.filter(order => {
        const orderData = order.order_data || {};
        return (
          order.customer_name?.toLowerCase().includes(searchLower) ||
          order.customer_email?.toLowerCase().includes(searchLower) ||
          orderData.companyName?.toLowerCase().includes(searchLower) ||
          orderData.nit?.toLowerCase().includes(searchLower) ||
          order.id?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Transformar datos para la respuesta
    const transformedOrders = filteredOrders.map(order => {
      const orderData = order.order_data || {};
      return {
        id: order.id,
        order_number: order.id.substring(0, 8).toUpperCase(),
        customer_name: order.customer_name || orderData.customerName || 'Cliente',
        customer_email: order.customer_email || orderData.email,
        customer_phone: order.customer_phone || orderData.phone,
        company_name: orderData.companyName,
        nit: orderData.nit,
        delivery_address: orderData.address,
        city: orderData.city,
        notes: orderData.notes,
        status: order.status || 'pending',
        total: order.total_amount || orderData.total || 0,
        payment_method: order.payment_method || orderData.paymentMethod,
        created_at: order.created_at,
        order_data: orderData
      };
    });

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in B2B orders API:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}
