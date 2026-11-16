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
function presentationFor(name: string, exactVariant: string | null, product: any): string | null {
  const n = clean(name);
  const packageLabel = /arandano|agraz|fresa|frambuesa|cereza/.test(n) ? 'Contenedor' : /naranja valencia/.test(n) ? 'Malla' : /uva|manzana|durazno|kiwi|ciruela/.test(n) ? 'Bandeja' : /championes[-_ ]tajados|vienen en bandeja/i.test(`${text(product?.slug)} ${text(product?.description)}`) ? 'Bandeja' : null;
  if (!packageLabel) return exactVariant;
  if (/championes[-_ ]tajados|vienen en bandeja/i.test(`${text(product?.slug)} ${text(product?.description)}`)) return packageLabel;
  return exactVariant ? `${packageLabel} ${exactVariant}` : packageLabel;
}
function catalogResolved(raw: any, catalog: { products: Map<string, any>; variants: Map<string, any>; variantsByProduct: Map<string, any[]> }, orderItemFallback?: any) {
  const productId = text(raw.productId) || text(raw.product_id) || null;
  const variantId = text(raw.variantId) || text(raw.variant_id) || null;
  const product = productId ? catalog.products.get(productId) : null;
  const productVariants = productId ? catalog.variantsByProduct.get(productId) || [] : [];
  const variant = (variantId ? catalog.variants.get(variantId) : null) || productVariants.find((candidate: any) => Number(candidate.price) === Number(raw.price)) || null;
  const fallbackVariantValue = text(orderItemFallback?.variant_value);
  const fallbackVariantName = text(orderItemFallback?.variant_name);
  const name = text(product?.name) || productName(raw);
  const rawVariant = variantValue(raw);
  const exactVariant = text(variant?.variant_value) || fallbackVariantValue || (rawVariant && !/^(peso|cantidad|presentacion|presentación)$/i.test(rawVariant) ? rawVariant : null);
  const presentationLabel = presentationFor(name, exactVariant, product);
  return { productId, variantId, product, variant, name, exactVariant, variantName: text(variant?.variant_name) || fallbackVariantName || exactVariant, presentationLabel };
}

function buildRealProjection(rows: any[], catalog: { products: Map<string, any>; variants: Map<string, any>; variantsByProduct: Map<string, any[]> }, orderItemVariants: Map<string, any>) {
  const itemMap = new Map<string, any>(); const packing: any[] = []; let realItemLines = 0;
  for (const row of rows) {
    const orderNumber = text(row.order_number) || `Pedido ${String(row.id).slice(0, 8)}`;
    const customerName = text(row.customer_name) || text(row.guest_name) || 'Cliente';
    const items = sourceItems(row); realItemLines += items.length;
    for (const raw of items) {
      const resolved = catalogResolved(raw, catalog, orderItemVariants.get(`${row.id}|${text(raw.productId) || text(raw.product_id)}`)); const name = resolved.name; const variant = resolved.exactVariant; const zone = zoneFor(name); const qty = quantity(raw);
      const line = { source_order_id: text(row.id) || null, source_order_line_id: text(raw.id) || text(raw.lineId) || text(raw.line_id) || null, product_id: resolved.productId, product_name: name, variant_id: resolved.variantId, variant_name: resolved.variantName, variant_value: variant, presentation_label: resolved.presentationLabel, requested_qty: qty, purchased_qty: 0, missing_qty: qty, surplus_qty: 0, weight_kg: null, unit: unitFor(name, raw), supplier_id: zone, sub_location_hint: subLocation(name), ripeness_note_snapshot: null, is_promo_gift: false };
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
  const orderItemVariants = new Map<string, any>();
  const orderItemRows = rows.length ? await supabase.from('order_items').select('order_id,product_id,product_snapshot').in('order_id', rows.map((row: any) => row.id)) : { data: [], error: null } as any;
  for (const item of orderItemRows.data || []) { const snapshot = item.product_snapshot && typeof item.product_snapshot === 'object' ? item.product_snapshot : {}; orderItemVariants.set(`${item.order_id}|${item.product_id}`, { variant_id: item.variant_id, variant_name: snapshot.variant_name, variant_value: snapshot.variant_value }); }
  const catalogProductIds = [...new Set(rows.flatMap((row: any) => sourceItems(row).map((item: any) => text(item.productId) || text(item.product_id)).filter(Boolean)))];
  const [catalogProductsResult, catalogVariantsResult] = await Promise.all([
    catalogProductIds.length ? supabase.from('products').select('id,name,slug,description,unit,is_active').in('id', catalogProductIds) : Promise.resolve({ data: [], error: null } as any),
    supabase.from('product_variants').select('id,product_id,variant_name,variant_value,price,is_active').order('id').limit(1000),
  ]);
  const variantsByProduct = new Map<string, any[]>(); for (const item of catalogVariantsResult.data || []) { const list = variantsByProduct.get(item.product_id) || []; list.push(item); variantsByProduct.set(item.product_id, list); }
  const catalog = { products: new Map<string, any>((catalogProductsResult.data || []).map((item: any) => [item.id, item])), variants: new Map<string, any>((catalogVariantsResult.data || []).map((item: any) => [item.id, item])), variantsByProduct };
  const real = buildRealProjection(rows, catalog, orderItemVariants);
  const existingByKey = new Map<string, any>((session.items || []).map((item: any) => [keyFor(item.product_name, item.variant_value, item.supplier_id || zoneFor(item.product_name)), item]));
  const existingByName = new Map<string, any[]>(); for (const item of session.items || []) { const key = clean(item.product_name); const list = existingByName.get(key) || []; list.push(item); existingByName.set(key, list); }
  const items = real.real_order_count > 0 ? real.items.map((item: any) => { const saved = existingByKey.get(keyFor(item.product_name, item.variant_value, item.supplier_id)) || ((existingByName.get(clean(item.product_name)) || []).length === 1 ? existingByName.get(clean(item.product_name))?.[0] : null); return saved ? { ...item, id: saved.id, purchased_qty: Number(saved.purchased_qty || 0), missing_qty: Math.max(item.requested_qty - Number(saved.purchased_qty || 0), 0), surplus_qty: Math.max(Number(saved.purchased_qty || 0) - item.requested_qty, 0), weight_kg: saved.weight_kg || null } : { ...item, id: `real-${keyFor(item.product_name, item.variant_value, item.supplier_id)}` }; }) : (session.items || []);
  const savedPackingByKey = new Map<string, any>((session.packing_items || []).map((item: any) => [packingKeyFor(item), item]));
  const packing_items = real.real_order_count > 0 ? real.packing_items.map((item: any) => { const saved = savedPackingByKey.get(packingKeyFor(item)); return saved ? { ...item, id: saved.id, picked_qty: Number(saved.picked_qty || 0), status: saved.status || 'pending' } : item; }) : (session.packing_items || []);
  return NextResponse.json({ success: true, buyer_id: auth.claims.sub, real_order_count: real.real_order_count, real_item_lines: real.real_item_lines, orders: [{ id: session.id, order_number: session.id, delivery_date: session.delivery_date, status: session.status, cash_advanced: Number(session.cash_advanced || 0), actual_total_paid: Number(session.actual_total_paid || 0), operational_expenses: session.operational_expenses || {}, promo_gift_enabled: Boolean(session.promo_gift_enabled), promo_gift_qty_per_trigger: Number(session.promo_gift_qty_per_trigger || 0), customer_name: 'Jornada de compras', items, packing_items }] });
});

export async function OPTIONS(_request: NextRequest) { return new NextResponse(null, { status: 204 }); }
