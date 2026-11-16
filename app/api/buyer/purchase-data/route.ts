import { NextRequest, NextResponse } from 'next/server';
import { createBuyerGuardedHandler } from '@/lib/buyer-auth';
import { createSupabaseClient } from '@/lib/auth-admin';
import { deliveryDateOf, isRouteEligible } from '@/lib/admin-route';

export const dynamic = 'force-dynamic';
const TUESDAY_DATE = '2026-11-17';
const TUESDAY_CUTOFF = new Date('2026-11-13T11:00:00.000Z');

function text(value: unknown): string { return typeof value === 'string' ? value.trim() : ''; }
function clean(value: string): string { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function zoneFor(name: string): string {
  const n = clean(name);
  if (/aguacate|hass|injerto|caja de 24|caja seleccion 18|caja de 18|caja de 12.*premium|paquete 4.*premium/.test(n)) return 'aguacates';
  if (/arandano|durazno/.test(n)) return 'popular';
  if (/banano criollo|banano bocadillo|mango comun|mango azucar|papa sabanera/.test(n)) return 'medio-fruver';
  if (/fresa|frambuesa|mora|uva|manzana|pera|kiwi|granadilla|toronja|papaya|naranja|ciruela|cereza|agraz|sandia/.test(n)) return 'reina';
  if (/lechuga|eucalipto|rucula|albahaca|acelga|cilantro|perejil|espinaca|champinon|germinado|cebollin|berenjena/.test(n)) return 'hierbas';
  return 'especies';
}
function subLocation(name: string): string | null { const n = clean(name); if (n.includes('maracuya') || n.includes('mandarina')) return '📍 Alero Sur'; if (n.includes('arandano')) return '📍 Minorista'; if (n.includes('durazno')) return '📍 Mayorista'; return null; }
function variantValue(item: any): string | null { return text(item.variantValue) || text(item.variant_value) || text(item.variantName) || text(item.variant_name) || null; }
function productName(item: any): string { return text(item.productName) || text(item.product_name) || text(item.name) || 'Producto'; }
function quantity(item: any): number { const value = Number(item.quantity ?? item.qty ?? 0); return Number.isFinite(value) ? value : 0; }
function unitFor(name: string, item: any): string { return clean(name).includes('maracuya') ? 'kg' : text(item.unit) || 'unidad'; }
function sourceItems(row: any): any[] { return Array.isArray(row?.order_data?.items) ? row.order_data.items : []; }
function keyFor(name: string, variant: string | null, zone: string): string { return `${clean(name)}|${clean(variant || '')}|${zone}`; }
function packingKeyFor(item: any): string { return `${text(item.source_order_number) || text(item.order_label)}|${text(item.customer_name)}|${clean(productName(item))}|${clean(variantValue(item) || '')}|${item.is_promo_gift ? 'gift' : 'normal'}`; }

function buildRealProjection(rows: any[]) {
  const itemMap = new Map<string, any>(); const packing: any[] = []; let realItemLines = 0;
  for (const row of rows) {
    const orderNumber = text(row.order_number) || `Pedido ${String(row.id).slice(0, 8)}`;
    const customerName = text(row.customer_name) || text(row.guest_name) || 'Cliente';
    const items = sourceItems(row); realItemLines += items.length;
    for (const raw of items) {
      const name = productName(raw); const variant = variantValue(raw); const zone = zoneFor(name); const qty = quantity(raw);
      const line = { source_order_id: text(row.id) || null, source_order_line_id: text(raw.id) || text(raw.lineId) || text(raw.line_id) || null, product_id: text(raw.productId) || text(raw.product_id) || null, product_name: name, variant_id: text(raw.variantId) || text(raw.variant_id) || null, variant_name: variant, variant_value: variant, requested_qty: qty, purchased_qty: 0, missing_qty: qty, surplus_qty: 0, weight_kg: null, unit: unitFor(name, raw), supplier_id: zone, sub_location_hint: subLocation(name), ripeness_note_snapshot: null, is_promo_gift: false };
      const key = keyFor(name, variant, zone); const existing = itemMap.get(key); if (existing) existing.requested_qty += qty; else itemMap.set(key, line);
      packing.push({ id: `real-pack-${row.id}-${packing.length}`, source_order_id: text(row.id) || null, source_order_line_id: text(raw.id) || text(raw.lineId) || text(raw.line_id) || null, source_order_number: orderNumber, order_label: orderNumber, customer_name: customerName, product_name: name, variant_name: variant, variant_value: variant, requested_qty: qty, picked_qty: 0, missing_qty: qty, ripeness_note_snapshot: null, is_promo_gift: false, status: 'pending' });
      if (/caja\s*de\s*24/.test(clean(name))) {
        const giftName = 'Duraznos'; const giftKey = keyFor(giftName, 'Paquete de 5-6', 'popular'); const gift = itemMap.get(giftKey);
        if (gift) gift.requested_qty += qty; else itemMap.set(giftKey, { product_id: null, product_name: giftName, variant_name: 'Paquete de 5-6', variant_value: '5-6 duraznos', requested_qty: qty, purchased_qty: 0, missing_qty: qty, surplus_qty: 0, weight_kg: null, unit: 'paquete', supplier_id: 'popular', sub_location_hint: '📍 Mayorista', ripeness_note_snapshot: '🎁 OBSEQUIO PROMO: Paquete de 5-6 Duraznos gratis', is_promo_gift: true });
        packing.push({ id: `real-pack-${row.id}-gift-${packing.length}`, source_order_id: text(row.id) || null, source_order_number: orderNumber, order_label: orderNumber, customer_name: customerName, product_name: giftName, variant_name: 'Paquete de 5-6', variant_value: '5-6 duraznos', requested_qty: qty, picked_qty: 0, missing_qty: qty, ripeness_note_snapshot: '🎁 OBSEQUIO PROMO: Paquete de 5-6 Duraznos gratis', is_promo_gift: true, status: 'pending' });
      }
    }
  }
  return { items: [...itemMap.values()], packing_items: packing, real_order_count: rows.length, real_item_lines: realItemLines };
}

export const GET = createBuyerGuardedHandler(async (request, auth) => {
  const { searchParams } = new URL(request.url); const deliveryDate = searchParams.get('deliveryDate') || TUESDAY_DATE; const supabase = createSupabaseClient();
  const { data, error } = await supabase.rpc('get_buyer_purchase_projection', { p_buyer_id: auth.claims.sub, p_delivery_date: deliveryDate });
  if (error) return NextResponse.json({ success: false, code: 'PURCHASE_SCHEMA_NOT_READY', error: 'Purchase session schema is not applied' }, { status: 503 });
  const session = Array.isArray(data) ? data[0] : null; if (!session) return NextResponse.json({ success: true, buyer_id: auth.claims.sub, orders: [] });
  const [ordersResult, guestResult] = await Promise.all([
    supabase.from('orders').select('id,order_number,customer_name,status,order_status,order_data,created_at,delivered_at').order('created_at', { ascending: false }).limit(500),
    supabase.from('guest_orders').select('id,guest_name,status,order_status,delivery_date,order_data,created_at').order('created_at', { ascending: false }).limit(500),
  ]);
  const rows = [...(ordersResult.data || []), ...(guestResult.data || [])].filter((row: any) => isRouteEligible(row) && deliveryDateOf(row) === deliveryDate && new Date(row.created_at || 0) >= TUESDAY_CUTOFF);
  const real = buildRealProjection(rows);
  const existingByKey = new Map<string, any>((session.items || []).map((item: any) => [keyFor(item.product_name, item.variant_value, item.supplier_id || zoneFor(item.product_name)), item]));
  const items = real.real_order_count > 0 ? real.items.map((item: any) => { const saved = existingByKey.get(keyFor(item.product_name, item.variant_value, item.supplier_id)); return saved ? { ...item, id: saved.id, purchased_qty: Number(saved.purchased_qty || 0), missing_qty: Math.max(item.requested_qty - Number(saved.purchased_qty || 0), 0), surplus_qty: Math.max(Number(saved.purchased_qty || 0) - item.requested_qty, 0), weight_kg: saved.weight_kg || null } : { ...item, id: `real-${keyFor(item.product_name, item.variant_value, item.supplier_id)}` }; }) : (session.items || []);
  const savedPackingByKey = new Map<string, any>((session.packing_items || []).map((item: any) => [packingKeyFor(item), item]));
  const packing_items = real.real_order_count > 0 ? real.packing_items.map((item: any) => { const saved = savedPackingByKey.get(packingKeyFor(item)); return saved ? { ...item, id: saved.id, picked_qty: Number(saved.picked_qty || 0), status: saved.status || 'pending' } : item; }) : (session.packing_items || []);
  return NextResponse.json({ success: true, buyer_id: auth.claims.sub, real_order_count: real.real_order_count, real_item_lines: real.real_item_lines, orders: [{ id: session.id, order_number: session.id, delivery_date: session.delivery_date, status: session.status, cash_advanced: Number(session.cash_advanced || 0), actual_total_paid: Number(session.actual_total_paid || 0), operational_expenses: session.operational_expenses || {}, promo_gift_enabled: Boolean(session.promo_gift_enabled), promo_gift_qty_per_trigger: Number(session.promo_gift_qty_per_trigger || 0), customer_name: 'Jornada de compras', items, packing_items }] });
});

export async function OPTIONS(_request: NextRequest) { return new NextResponse(null, { status: 204 }); }
