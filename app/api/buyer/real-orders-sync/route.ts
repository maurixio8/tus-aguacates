import { NextRequest, NextResponse } from 'next/server';
import { createBuyerGuardedHandler } from '@/lib/buyer-auth';
import { createSupabaseClient } from '@/lib/auth-admin';
import { deliveryDateOf, isRouteEligible } from '@/lib/admin-route';
import { buyerPurchaseCycle, buyerPurchaseCycleForDeliveryDate } from '@/lib/buyer-cycle';

export const dynamic = 'force-dynamic';

export const POST = createBuyerGuardedHandler(async (request: NextRequest) => {
  const body = await request.json().catch(() => null);
  const requestedDate = typeof body?.delivery_date === 'string' ? body.delivery_date : null;
  const cycle = requestedDate ? buyerPurchaseCycleForDeliveryDate(requestedDate) : buyerPurchaseCycle();
  const deliveryDate = cycle.deliveryDate;
  const cutoff = cycle.startsAt;
  const supabase = createSupabaseClient();
  const [ordersResult, guestResult] = await Promise.all([
    supabase.from('orders').select('id,order_number,status,order_status,customer_name,order_data,created_at,delivered_at').order('created_at', { ascending: false }).limit(500),
    supabase.from('guest_orders').select('id,guest_name,status,order_status,delivery_date,order_data,created_at').order('created_at', { ascending: false }).limit(500),
  ]);
  if (ordersResult.error || guestResult.error) return NextResponse.json({ success: false, error: 'No se pudieron leer los pedidos reales' }, { status: 503 });
  const all = [...(ordersResult.data || []), ...(guestResult.data || [])];
  const matching = all.filter((order: any) => {
    const created = new Date(order.created_at || 0);
    return isRouteEligible(order) && deliveryDateOf(order) === deliveryDate && created >= cycle.startsAt && created < cycle.endsAt;
  });
  const itemLines = matching.reduce((sum, order: any) => sum + (Array.isArray(order.order_data?.items) ? order.order_data.items.length : 0), 0);
  const statusCounts = matching.reduce<Record<string, number>>((counts, order: any) => {
    const status = String(order.status || order.order_status || 'sin_estado').toLowerCase();
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
  return NextResponse.json({
    success: true,
    delivery_date: deliveryDate,
    cutoff_utc: cutoff.toISOString(),
    ends_at_utc: cycle.endsAt.toISOString(),
    handoff_at_utc: cycle.handoffAt.toISOString(),
    real_order_count: matching.length,
    real_item_lines: itemLines,
    status_counts: statusCounts,
    applied: false,
    code: matching.length ? 'REAL_ORDERS_SELECTED_BY_ACTIVE_CYCLE' : 'NO_ACTIVE_ORDERS_FOR_CYCLE',
    message: matching.length ? `${matching.length} pedidos reales elegibles por ciclo activo; la escritura se mantiene bloqueada hasta aplicar el adaptador de sincronización.` : 'No hay pedidos reales elegibles para esta jornada.',
  });
});
