import { NextRequest, NextResponse } from 'next/server';
import { createBuyerGuardedHandler } from '@/lib/buyer-auth';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

const cancelled = /cancel|rechaz|declin|failed|fallid/i;
function scheduledDate(value: any): string | null {
  return value?.delivery_date || value?.deliveryDate || value?.order_data?.delivery_date || value?.order_data?.deliveryDate || value?.order_data?.shippingInfo?.deliveryDate || null;
}
function isActive(value: any): boolean {
  return !cancelled.test(`${value?.status || ''} ${value?.order_status || ''}`);
}

export const POST = createBuyerGuardedHandler(async (request: NextRequest) => {
  const body = await request.json().catch(() => null);
  const deliveryDate = typeof body?.delivery_date === 'string' ? body.delivery_date : '2026-11-17';
  const supabase = createSupabaseClient();
  const [ordersResult, guestResult] = await Promise.all([
    supabase.from('orders').select('id,order_number,status,order_status,customer_name,order_data,created_at').order('created_at', { ascending: false }).limit(500),
    supabase.from('guest_orders').select('id,guest_name,status,order_status,delivery_date,order_data,created_at').order('created_at', { ascending: false }).limit(500),
  ]);
  if (ordersResult.error || guestResult.error) return NextResponse.json({ success: false, error: 'No se pudieron leer los pedidos reales' }, { status: 503 });
  const matching = [...(ordersResult.data || []), ...(guestResult.data || [])].filter(order => isActive(order) && scheduledDate(order) === deliveryDate);
  const itemLines = matching.reduce((sum, order: any) => sum + (Array.isArray(order.order_data?.items) ? order.order_data.items.length : 0), 0);
  return NextResponse.json({
    success: true,
    delivery_date: deliveryDate,
    real_order_count: matching.length,
    real_item_lines: itemLines,
    applied: false,
    code: matching.length ? 'REAL_ORDERS_FOUND_SYNC_ADAPTER_PENDING' : 'NO_SCHEDULED_ORDERS',
    message: matching.length ? 'Hay pedidos fechados para la jornada; la revisión de mapeo queda pendiente antes de mezclarlos con la compra.' : 'No hay pedidos reales con fecha explícita para esta jornada.',
  });
});
