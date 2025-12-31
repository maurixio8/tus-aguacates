import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Obtener clientes B2B (extraídos de pedidos)
export async function GET(request: NextRequest) {
  try {
    // Obtener todos los pedidos B2B
    const { data: orders, error } = await supabase
      .from('guest_orders')
      .select('*')
      .contains('order_data', { isB2B: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching B2B orders for clients:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Agrupar por cliente (usando email como identificador único)
    const clientsMap: Record<string, any> = {};

    (orders || []).forEach(order => {
      const orderData = order.order_data || {};
      const clientKey = order.customer_email || order.customer_phone || order.customer_name || 'unknown';

      if (!clientsMap[clientKey]) {
        clientsMap[clientKey] = {
          id: clientKey,
          name: order.customer_name || orderData.customerName || 'Cliente',
          email: order.customer_email || orderData.email || '',
          phone: order.customer_phone || orderData.phone || '',
          company_name: orderData.companyName || '',
          nit: orderData.nit || '',
          address: orderData.address || '',
          city: orderData.city || '',
          total_orders: 0,
          total_spent: 0,
          last_order_date: order.created_at
        };
      }

      clientsMap[clientKey].total_orders++;
      clientsMap[clientKey].total_spent += order.total_amount || 0;

      // Actualizar última fecha de pedido si es más reciente
      if (new Date(order.created_at) > new Date(clientsMap[clientKey].last_order_date)) {
        clientsMap[clientKey].last_order_date = order.created_at;
      }

      // Actualizar info si falta
      if (!clientsMap[clientKey].company_name && orderData.companyName) {
        clientsMap[clientKey].company_name = orderData.companyName;
      }
      if (!clientsMap[clientKey].nit && orderData.nit) {
        clientsMap[clientKey].nit = orderData.nit;
      }
    });

    // Convertir a array y ordenar por total gastado
    const clients = Object.values(clientsMap).sort((a, b) => b.total_spent - a.total_spent);

    return NextResponse.json({ success: true, clients });

  } catch (error) {
    console.error('Error in B2B clients API:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}
