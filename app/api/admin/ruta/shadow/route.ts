/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-admin';
import { createSupabaseClient } from '@/lib/auth-admin';
import { evaluateCoverage } from '@/lib/coverage';
import { addressParts, CONFIRMED_ROUTE_STATUSES, deliveryDateOf, deliveryDatesInRange, isCancelledStatus, isChia, nextDeliveryDate, normalizeStatus, parseOrderData } from '@/lib/admin-route';
import { normalizeDeliveryAddress } from '@/lib/location-resolution';
import { generateDashboardOrderSummary } from '@/utils/dashboardOrderSummary';

export const dynamic = 'force-dynamic';
const CORABASTOS = { lat: 4.63205, lng: -74.15534, address: 'Corabastos, Bogotá' };
type ArtifactStore = Map<string, string>;
const artifactStore = (globalThis as typeof globalThis & { __routeShadowArtifacts?: ArtifactStore }).__routeShadowArtifacts ||= new Map();

async function fetchAll(table: 'orders' | 'guest_orders') {
  const supabase = createSupabaseClient();
  const rows: any[] = [];
  const select = table === 'orders' ? '*, order_items (*, products:product_id (name))' : '*';
  for (let from = 0; from < 10000; from += 1000) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + 999);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

function summaryItems(row: any, data: any) {
  const registeredItems = Array.isArray(row?.order_items) ? row.order_items : [];
  if (registeredItems.length > 0) {
    const orderDataItems = Array.isArray(data?.items) ? data.items : [];
    return registeredItems.map((item: any, index: number) => {
      const fallback = orderDataItems[index] || orderDataItems.find((candidate: any) => (candidate.product_id || candidate.productId) === item.product_id) || {};
      const variant = item.variant_name || item.variant_value || fallback.variant_name || fallback.variantName || fallback.variant_value || fallback.variantValue || '';
      const productName = item.product_name || item.products?.name || item.product_snapshot?.name || fallback.product_name || fallback.productName || 'Producto';
      return {
        ...item,
        product_name: productName,
        productName: productName,
        variantName: variant,
        variant_name: variant,
        variant_value: variant,
        weight: item.weight ?? fallback.weight ?? null,
        unit: item.unit ?? fallback.unit ?? null,
        product_snapshot: { ...item.product_snapshot, name: productName, variant_name: variant ? 'Presentación' : null, variant_value: variant },
      };
    });
  }
  return (Array.isArray(data?.items) ? data.items : []).map((item: any) => ({
    id: item.id || null,
    product_id: item.productId || item.product_id || null,
    quantity: item.quantity || 0,
    unit_price: item.price || item.unit_price || 0,
    subtotal: item.subtotal || (item.quantity || 0) * (item.price || item.unit_price || 0),
    product_name: item.productName || item.product_name || item.name || 'Producto',
    variantName: item.variantName || item.variant_name || item.variant_value || item.variantValue || '',
    variant_name: item.variantName || item.variant_name || item.variant_value || item.variantValue || '',
    variant_value: item.variantName || item.variant_name || item.variant_value || item.variantValue || '',
    weight: item.weight ?? null,
    unit: item.unit || null,
    product_snapshot: { name: item.productName || item.product_name || item.name || 'Producto', variant_value: item.variantName || item.variant_name || item.variant_value || item.variantValue || null },
  }));
}

async function fetchConfirmedResolutions() {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from('delivery_location_resolutions').select('status,normalized_address,original_address,corrected_address,latitude,longitude').eq('status', 'confirmada').limit(5000);
  if (error) throw error;
  const map = new Map<string, { latitude: number; longitude: number }>();
  for (const row of data || []) {
    if (row.latitude == null || row.longitude == null) continue;
    for (const value of [row.normalized_address, row.original_address, row.corrected_address]) {
      if (value) map.set(normalizeDeliveryAddress(String(value), 'Bogotá'), { latitude: Number(row.latitude), longitude: Number(row.longitude) });
    }
  }
  return map;
}

function csvCell(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function routePreview(date: string, routed: any[]) {
  const markers = JSON.stringify(routed.map((item, index) => ({ index: index + 1, lat: item.lat, lng: item.lng, address: item.address }))).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Ruta sombra ${date}</title></head><body><h1>Ruta sombra ${date}</h1><p>Paradas: ${routed.length}. Salida y llegada: Corabastos.</p><pre id="stops"></pre><script>const stops=${markers};document.getElementById('stops').textContent=stops.map(x=>x.index+'. '+x.address).join('\\n');</script></body></html>`;
}

async function generateDay(date: string, resolutions: Map<string, { latitude: number; longitude: number }>) {
  const [orders, guests] = await Promise.all([fetchAll('orders'), fetchAll('guest_orders')]);
  const candidates: any[] = [];
  for (const [source, rows] of [['orders', orders], ['guest_orders', guests] as const]) {
    for (const row of rows as any[]) {
      if (deliveryDateOf(row) !== date || !CONFIRMED_ROUTE_STATUSES.has(normalizeStatus(row)) || isCancelledStatus(row) || row.delivered_at) continue;
      const parts = addressParts(row);
      const saved = resolutions.get(normalizeDeliveryAddress(parts.address, parts.city || 'Bogotá'));
      const latitude = saved?.latitude ?? parts.latitude;
      const longitude = saved?.longitude ?? parts.longitude;
      const data = parseOrderData(row);
      const items = summaryItems(row, data);
      const orderNumber = String(row.order_number || row.orderNumber || `INV-${String(row.id).slice(-8)}`);
      const customerName = String(row.customer_name || row.guest_name || row.name || 'Cliente');
      const customerPhone = String(row.customer_phone || row.guest_phone || row.phone || '');
      const totalAmount = Number(row.total_amount || row.total || data.total || 0);
      const summary = generateDashboardOrderSummary(
        { delivery_address: parts.address, total_amount: totalAmount },
        customerName,
        items,
      );
      const item: any = { source, id: String(row.id), address: parts.address, city: parts.city || 'Bogotá', customerName, customerPhone, orderNumber, totalAmount, items, summary, coverage: 'por_confirmar', reason: 'sin_coordenadas', resolution: saved ? 'pin' : 'sin_pin', lat: latitude, lng: longitude };
      if (isChia(parts.city, parts.address)) { item.coverage = 'chia'; item.reason = 'chia_no_entregar_por_ahora'; candidates.push(item); continue; }
      if (latitude == null || longitude == null) { candidates.push(item); continue; }
      const result = evaluateCoverage({ rawAddress: parts.address, viaType: '', viaNumber: '', complement: '', neighborhood: '', city: parts.city || 'Bogotá', deliveryNotes: '', latitude, longitude, pinConfidence: 'pin' });
      item.coverage = result.decision === 'dentro' ? 'dentro' : result.decision === 'fuera' ? 'fuera' : 'por_confirmar';
      item.reason = result.reasons[0] || item.coverage;
      candidates.push(item);
    }
  }
  const routed = candidates.filter(item => item.coverage === 'dentro' && item.lat != null && item.lng != null).sort((a, b) => a.lat - b.lat || a.lng - b.lng || a.id.localeCompare(b.id));
  const excluded = candidates.filter(item => !routed.includes(item));
  const routes: any[] = routed.length > 0 ? [{
    name: 'Ruta completa',
    file: 'ruta-completa.csv',
    stops: routed.length,
    start: CORABASTOS,
    end: CORABASTOS,
    order_ids: routed.map(item => item.id),
  }] : [];
  if (routed.length > 0) {
    artifactStore.set(`${date}/ruta-completa.csv`, ['lat,lng,address,note', ...routed.map(item => [item.lat, item.lng, csvCell(item.address), csvCell(item.summary || `${item.source}:${item.id} | cobertura=dentro`)].join(','))].join('\n'));
  }
  const report = { date, source: 'Supabase guest_orders + orders + confirmed resolutions', routes, counts: { orders_total: orders.length + guests.length, eligible_confirmed: candidates.length, routed: routed.length, routes: routes.length, excluded: excluded.length, fuera: excluded.filter(item => item.coverage === 'fuera').length, por_confirmar: excluded.filter(item => item.coverage === 'por_confirmar').length, chia: excluded.filter(item => item.coverage === 'chia').length } };
  artifactStore.set(`${date}/route-report.json`, JSON.stringify(report, null, 2));
  artifactStore.set(`${date}/orders-classification.json`, JSON.stringify(candidates, null, 2));
  artifactStore.set(`${date}/preview.html`, routePreview(date, routed));
  return { date, output_dir: null, counts: report.counts, routes };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const dateFrom = String(body.dateFrom || body.date || nextDeliveryDate());
    const dateTo = String(body.dateTo || body.date || dateFrom);
    const dates = body.dateFrom || body.dateTo ? deliveryDatesInRange(dateFrom, dateTo) : [dateFrom];
    if (!dates.length || dates.some(date => !/^\d{4}-\d{2}-\d{2}$/.test(date))) return NextResponse.json({ error: 'Rango de fechas inválido o sin días de entrega martes/viernes' }, { status: 400 });
    const resolutions = await fetchConfirmedResolutions();
    const days = [];
    for (const date of dates) days.push(await generateDay(date, resolutions));
    const counts = days.reduce((sum, day) => ({ routed: sum.routed + day.counts.routed, routes: sum.routes + day.counts.routes, excluded: sum.excluded + day.counts.excluded }), { routed: 0, routes: 0, excluded: 0 });
    return NextResponse.json({ dateFrom, dateTo, dates, days, counts, routes: days.flatMap(day => day.routes.map((route: any) => ({ ...route, date: day.date }))) });
  } catch (error: any) {
    const detail = String(error?.message || error || 'error desconocido');
    console.error('Error generating shadow route', detail);
    return NextResponse.json({ error: 'No se pudo generar la ruta sombra', detail }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || nextDeliveryDate();
    const file = searchParams.get('file') || 'route-report.json';
    const download = searchParams.get('download') === '1';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^(route-report\.json|orders-classification\.json|preview\.html|ruta-completa\.csv)$/.test(file)) return NextResponse.json({ error: 'Archivo inválido' }, { status: 400 });

    let content = artifactStore.get(`${date}/${file}`);
    // Serverless instances do not share the in-memory artifact store. If the
    // download lands on another instance, regenerate the CSV instead of
    // leaving the browser waiting on a stale/missing artifact.
    if (!content && file === 'ruta-completa.csv') {
      const resolutions = await fetchConfirmedResolutions();
      await generateDay(date, resolutions);
      content = artifactStore.get(`${date}/${file}`);
    }
    if (!content) return NextResponse.json({ error: 'Archivo no disponible; genera primero la ruta sombra' }, { status: 404 });
    const type = file.endsWith('.html') ? 'text/html; charset=utf-8' : file.endsWith('.csv') ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8';
    if (download && file.endsWith('.csv')) {
      const storagePath = `routes/${date}/ruta-completa-${crypto.randomUUID()}.csv`;
      const supabase = createSupabaseClient();
      const upload = await supabase.storage.from('route-csv-temp').upload(storagePath, Buffer.from(content, 'utf8'), { contentType: 'text/csv', upsert: true });
      if (upload.error) throw upload.error;
      const signed = await supabase.storage.from('route-csv-temp').createSignedUrl(storagePath, 600);
      if (signed.error || !signed.data?.signedUrl) throw signed.error || new Error('No se pudo crear el enlace de descarga');
      const downloadUrl = `${signed.data.signedUrl}${signed.data.signedUrl.includes('?') ? '&' : '?'}download=ruta-completa.csv`;
      return NextResponse.redirect(downloadUrl, 302);
    }
    return new NextResponse(content, {
      headers: {
        'Content-Type': type,
        'Content-Disposition': `${download && file.endsWith('.csv') ? 'attachment' : 'inline'}; filename="${file}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Error serving shadow artifact', error?.message || error);
    return NextResponse.json({ error: 'No se pudo descargar el archivo de ruta' }, { status: 500 });
  }
}
