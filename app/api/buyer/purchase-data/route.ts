import { NextRequest, NextResponse } from 'next/server';
import { createBuyerGuardedHandler } from '@/lib/buyer-auth';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

export const GET = createBuyerGuardedHandler(async (request, auth) => {
  const { searchParams } = new URL(request.url);
  const deliveryDate = searchParams.get('deliveryDate');
  const supabase = createSupabaseClient();

  let sessionsQuery = supabase
    .from('purchase_sessions')
    .select(`
      id,
      delivery_date,
      status,
      purchase_items (
        id,
        source_order_id,
        product_id,
        product_name,
        variant_value,
        requested_qty,
        purchased_qty,
        missing_qty,
        unit,
        supplier_id,
        sub_location_hint,
        is_promo_gift
      )
    `)
    .eq('buyer_id', auth.claims.sub)
    .order('delivery_date', { ascending: false })
    .limit(30);
  if (deliveryDate) sessionsQuery = sessionsQuery.eq('delivery_date', deliveryDate);

  const { data, error } = await sessionsQuery;
  if (error) {
    return NextResponse.json(
      { success: false, code: 'PURCHASE_SCHEMA_NOT_READY', error: 'Purchase session schema is not applied' },
      { status: 503 },
    );
  }

  const orders = (data || []).map((session: any) => ({
    id: session.id,
    order_number: session.id,
    delivery_date: session.delivery_date,
    customer_name: 'Jornada de compras',
    delivery_address: null,
    items: (session.purchase_items || []).map((item: any) => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.requested_qty,
      product_name: item.product_name,
      variant_value: item.variant_value || null,
      unit: item.unit || null,
      missing_quantity: item.missing_qty,
      supplier_id: item.supplier_id,
      sub_location_hint: item.sub_location_hint,
      is_promo_gift: item.is_promo_gift,
    })),
  }));

  return NextResponse.json({ success: true, buyer_id: auth.claims.sub, orders });
});

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, { status: 204 });
}
