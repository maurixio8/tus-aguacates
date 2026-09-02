import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient, requireAdminRole } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;
const CLOSED = new Set(['cancelled', 'cancelado', 'canceled']);
const DELIVERED = new Set(['delivered', 'entregado', 'completed', 'completado']);

function normalizePhone(value: unknown): string {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('57') && digits.length >= 12) return digits.slice(-10);
  return digits;
}

function customerKey(order: any): string {
  const phone = normalizePhone(order.customer_phone || order.guest_phone);
  if (phone) return `phone:${phone}`;
  const email = String(order.customer_email || order.guest_email || '').trim().toLowerCase();
  if (email) return `email:${email}`;
  const name = String(order.customer_name || order.guest_name || '').trim().toLowerCase();
  return `name:${name || order.id}`;
}

function orderItems(order: any): any[] {
  let data = order.order_data;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch { data = null; }
  }
  return Array.isArray(data?.items) ? data.items : [];
}

function money(value: any): number {
  return Number(value || 0);
}

function dateBogota(value: string): Date {
  return new Date(new Date(value).getTime() - BOGOTA_OFFSET_MS);
}

export async function GET(request: NextRequest) {
  const adminAccess = await requireAdminRole(request, 'admin');
  if (adminAccess.response) return adminAccess.response;

  try {
    const supabase = createSupabaseClient();
    const [ordersResult, guestsResult] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5000),
      supabase.from('guest_orders').select('*').order('created_at', { ascending: false }).limit(5000),
    ]);

    if (ordersResult.error) throw ordersResult.error;
    if (guestsResult.error) throw guestsResult.error;

    const orders = [...(ordersResult.data || []), ...(guestsResult.data || [])]
      .filter(order => !CLOSED.has(String(order.status || order.order_status || '').toLowerCase()));

    const now = Date.now();
    const grouped = new Map<string, any>();

    for (const order of orders) {
      const key = customerKey(order);
      const name = String(order.customer_name || order.guest_name || 'Cliente sin nombre').trim();
      const phone = String(order.customer_phone || order.guest_phone || '').trim();
      const email = String(order.customer_email || order.guest_email || '').trim();
      const existing = grouped.get(key) || {
        key, name, phone, email, orders: 0, delivered: 0, pending: 0,
        totalSpent: 0, lastOrder: null, lastDelivered: null, products: new Map<string, number>(),
      };

      existing.orders += 1;
      const state = String(order.order_status || order.status || '').toLowerCase();
      const isDelivered = DELIVERED.has(state);
      if (isDelivered) existing.delivered += 1; else existing.pending += 1;
      existing.totalSpent += money(order.total ?? order.total_amount);

      if (!existing.lastOrder || new Date(order.created_at) > new Date(existing.lastOrder)) existing.lastOrder = order.created_at;
      if (isDelivered && (!existing.lastDelivered || new Date(order.created_at) > new Date(existing.lastDelivered))) existing.lastDelivered = order.created_at;

      for (const item of orderItems(order)) {
        const itemName = String(item.productName || item.product_name || 'Producto').trim();
        existing.products.set(itemName, (existing.products.get(itemName) || 0) + money(item.quantity));
      }
      grouped.set(key, existing);
    }

    const customers = Array.from(grouped.values()).map(customer => {
      const lastDate = customer.lastDelivered || customer.lastOrder;
      const daysSince = lastDate ? Math.max(0, Math.floor((now - new Date(lastDate).getTime()) / 86400000)) : 999;
      const topProducts = Array.from(customer.products.entries()).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3).map((x: any) => x[0]);
      let segment = 'new';
      let segmentLabel = 'Nuevo';
      if (customer.pending > 0) { segment = 'pending'; segmentLabel = 'Con pedido pendiente'; }
      else if (customer.orders >= 2 && daysSince > 60) { segment = 'high_risk'; segmentLabel = 'Alto riesgo'; }
      else if (customer.orders >= 2 && daysSince > 30) { segment = 'at_risk'; segmentLabel = 'En riesgo'; }
      else if (customer.orders >= 5 && customer.totalSpent >= 500000) { segment = 'best'; segmentLabel = 'Mejor cliente'; }
      else if (customer.orders >= 2) { segment = 'loyal'; segmentLabel = 'Cliente fiel'; }
      else if (daysSince <= 30) { segment = 'potential'; segmentLabel = 'Potencial'; }
      return { ...customer, products: undefined, topProducts, daysSince, segment, segmentLabel };
    });

    const delivered = orders.filter(o => DELIVERED.has(String(o.order_status || o.status || '').toLowerCase())).length;
    const pending = orders.length - delivered;
    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      summary: { orders: orders.length, delivered, pending, customers: customers.length },
      segments: {
        highRisk: customers.filter(c => c.segment === 'high_risk').sort((a, b) => b.totalSpent - a.totalSpent),
        atRisk: customers.filter(c => c.segment === 'at_risk').sort((a, b) => b.totalSpent - a.totalSpent),
        best: customers.filter(c => c.segment === 'best').sort((a, b) => b.totalSpent - a.totalSpent),
        potential: customers.filter(c => c.segment === 'potential').sort((a, b) => b.daysSince - a.daysSince),
        pending: customers.filter(c => c.segment === 'pending').sort((a, b) => (b.lastOrder || '').localeCompare(a.lastOrder || '')),
      },
    });
  } catch (error) {
    console.error('Error generando insights de clientes:', error);
    return NextResponse.json({ success: false, error: 'No se pudo generar el análisis de clientes' }, { status: 500 });
  }
}
