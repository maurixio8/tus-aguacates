import { NextRequest, NextResponse } from 'next/server';
import { createBuyerGuardedHandler } from '@/lib/buyer-auth';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

export const GET = createBuyerGuardedHandler(async (request, auth) => {
  const { searchParams } = new URL(request.url);
  const deliveryDate = searchParams.get('deliveryDate');
  const supabase = createSupabaseClient();

  let ordersQuery = supabase
    .from('orders')
    .select('id, order_number, delivery_date, customer_name, delivery_address, order_items(id, product_id, quantity, product_snapshot)')
    .eq('user_id', auth.claims.sub)
    .order('created_at', { ascending: false })
    .limit(100);
  if (deliveryDate) ordersQuery = ordersQuery.eq('delivery_date', deliveryDate);

  const { data, error } = await ordersQuery;
  if (error) {
    return NextResponse.json({ success: false, error: 'Unable to load purchase data' }, { status: 500 });
  }

  const orders = (data || []).map((order: any) => ({
    id: order.id,
    order_number: order.order_number,
    delivery_date: order.delivery_date,
    customer_name: order.customer_name,
    delivery_address: order.delivery_address,
    items: (order.order_items || []).map((item: any) => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      product_name: item.product_snapshot?.name || 'Producto',
      variant_value: item.product_snapshot?.variant_value || null,
      unit: item.product_snapshot?.unit || null,
    })),
  }));

  return NextResponse.json({ success: true, buyer_id: auth.claims.sub, orders });
});

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, { status: 204 });
}
