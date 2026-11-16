import { NextRequest, NextResponse } from 'next/server';
import { createBuyerGuardedHandler } from '@/lib/buyer-auth';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

export const GET = createBuyerGuardedHandler(async (request, auth) => {
  const { searchParams } = new URL(request.url);
  const deliveryDate = searchParams.get('deliveryDate');
  const supabase = createSupabaseClient();

  const { data, error } = await supabase.rpc('get_buyer_purchase_projection', {
    p_buyer_id: auth.claims.sub,
    p_delivery_date: deliveryDate || null,
  });
  if (error) {
    return NextResponse.json(
      { success: false, code: 'PURCHASE_SCHEMA_NOT_READY', error: 'Purchase session schema is not applied' },
      { status: 503 },
    );
  }

  const sessions = Array.isArray(data) ? data : [];
  const orders = sessions.map((session: any) => ({
    id: session.id,
    order_number: session.id,
    delivery_date: session.delivery_date,
    status: session.status,
    cash_advanced: Number(session.cash_advanced || 0),
    actual_total_paid: Number(session.actual_total_paid || 0),
    operational_expenses: session.operational_expenses || {},
    promo_gift_enabled: Boolean(session.promo_gift_enabled),
    promo_gift_qty_per_trigger: Number(session.promo_gift_qty_per_trigger || 0),
    customer_name: 'Jornada de compras',
    items: Array.isArray(session.items) ? session.items : [],
    packing_items: Array.isArray(session.packing_items) ? session.packing_items.map((item: any) => ({
      id: item.id,
      order_label: item.source_order_number || (item.source_order_id ? `Pedido #${String(item.source_order_id).slice(0, 8)}` : 'Pedido'),
      customer_name: item.customer_name || 'Cliente',
      product_id: item.product_id,
      product_name: item.product_name,
      variant_name: item.variant_name || null,
      variant_value: item.variant_value || null,
      requested_qty: item.requested_qty,
      picked_qty: item.picked_qty,
      missing_qty: item.missing_qty,
      ripeness_note_snapshot: item.ripeness_note_snapshot || null,
      is_promo_gift: item.is_promo_gift,
      status: item.status,
    })) : [],
  }));

  return NextResponse.json({ success: true, buyer_id: auth.claims.sub, orders });
});

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, { status: 204 });
}
