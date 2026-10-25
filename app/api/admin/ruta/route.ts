/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient, verifyAdminAuth } from '@/lib/auth-admin';
import { evaluateCoverage } from '@/lib/coverage';
import {
  addressParts, AdminRouteOrder, CONFIRMED_ROUTE_STATUSES, deliveryDateOf,
  isChia, nextDeliveryDate, normalizeStatus, orderItems, parseOrderData,
} from '@/lib/admin-route';

export const dynamic = 'force-dynamic';
const CORABASTOS = { lat: 4.63205, lng: -74.15534, address: 'Corabastos, Bogotá' };
const geocodeCache = new Map<string, any>();

async function fetchAll(table: 'orders' | 'guest_orders') {
  const supabase = createSupabaseClient();
  const rows: any[] = [];
  for (let from = 0; from < 10000; from += 1000) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + 999);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

async function geocode(address: string) {
  const key = address.trim().toLowerCase();
  if (!key) return null;
  if (geocodeCache.has(key)) return geocodeCache.get(key);
  try {
    const params = new URLSearchParams({ format: 'jsonv2', addressdetails: '1', limit: '5', countrycodes: 'co', bounded: '1', viewbox: '-74.25,4.85,-73.95,4.45', q: address });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { 'User-Agent': 'TusAguacates/admin-route-phase3b' }, next: { revalidate: 86400 } });
    const rows = await res.json();
    const first = Array.isArray(rows) ? rows[0] : null;
    const addr = first?.address || {};
    const result = first ? {
      latitude: Number(first.lat), longitude: Number(first.lon),
      confidence: addr.house_number && (addr.city || addr.town || addr.municipality) ? 'alta' : 'media',
      label: first.display_name || '',
    } : null;
    geocodeCache.set(key, result);
    return result;
  } catch {
    geocodeCache.set(key, null);
    return null;
  }
}

async function normalizeRow(row: any, source: 'orders' | 'guest_orders'): Promise<AdminRouteOrder> {
  const data = parseOrderData(row);
  const parts = addressParts(row);
  let latitude = parts.latitude;
  let longitude = parts.longitude;
  let coordinateSource: AdminRouteOrder['coordinateSource'] = latitude != null && longitude != null ? 'pin' : 'sin_coordenadas';
  let confidence: AdminRouteOrder['confidence'] = coordinateSource === 'pin' ? 'alta' : 'sin_coordenadas';

  if (latitude == null || longitude == null) {
    const result = await geocode(parts.address);
    if (result && result.confidence === 'alta') {
      latitude = result.latitude; longitude = result.longitude;
      coordinateSource = 'geocodificado'; confidence = 'alta';
    } else if (result) {
      coordinateSource = 'sin_coordenadas'; confidence = result.confidence;
    } else {
      coordinateSource = 'sin_coordenadas';
      confidence = parts.address ? 'baja' : 'sin_coordenadas';
    }
  }

  let coverage: AdminRouteOrder['coverage'] = 'por_confirmar';
  let coverageReason: string | null = 'sin_coordenadas';
  let coverageZone: string | null = null;
  if (isChia(parts.city, parts.address)) {
    coverage = 'chia'; coverageReason = 'chia_no_entregar_por_ahora';
  } else if (latitude != null && longitude != null && coordinateSource !== 'sin_coordenadas') {
    const result = evaluateCoverage({ rawAddress: parts.address, viaType: '', viaNumber: '', complement: '', neighborhood: '', city: parts.city || 'Bogotá', deliveryNotes: '', latitude, longitude, pinConfidence: coordinateSource === 'pin' ? 'pin' : 'sin_pin' });
    coverage = result.decision === 'dentro' ? 'dentro' : result.decision === 'fuera' ? 'fuera' : 'por_confirmar';
    coverageReason = result.reasons[0] || null;
    coverageZone = result.zone;
  } else if (coordinateSource === 'sin_coordenadas') {
    coverage = 'por_confirmar'; coverageReason = parts.address ? 'verificar_barrio' : 'sin_coordenadas';
  }

  const items = orderItems(row, data);
  return {
    id: String(row.id), source, orderNumber: String(row.order_number || row.orderNumber || row.id || ''),
    customerName: String(row.customer_name || row.guest_name || row.name || 'Cliente'),
    customerPhone: String(row.customer_phone || row.guest_phone || row.phone || ''),
    deliveryAddress: parts.address, deliveryDate: deliveryDateOf(row), createdAt: row.created_at || null,
    totalAmount: Number(row.total_amount || row.total || 0), items, itemCount: items.length,
    isDelivered: Boolean(row.delivered_at) || ['delivered', 'entregado'].includes(normalizeStatus(row)),
    paymentStatus: String(row.payment_status || 'pending'), notes: String(row.notes || row.delivery_notes || data.delivery_notes || ''),
    latitude, longitude, coordinateSource, confidence, coverage, coverageReason, coverageZone, city: parts.city || 'Bogotá',
  };
}

function isEligible(row: any) {
  const status = normalizeStatus(row);
  return CONFIRMED_ROUTE_STATUSES.has(status) && !row.delivered_at;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const desde = searchParams.get('desde') || searchParams.get('dateFrom') || nextDeliveryDate();
    const hasta = searchParams.get('hasta') || searchParams.get('dateTo') || desde;
    const [orders, guests] = await Promise.all([fetchAll('orders'), fetchAll('guest_orders')]);
    const all = [...orders.map(row => ({ row, source: 'orders' as const })), ...guests.map(row => ({ row, source: 'guest_orders' as const }))];
    const selected = all.filter(({ row }) => isEligible(row) && deliveryDateOf(row) != null && deliveryDateOf(row)! >= desde && deliveryDateOf(row)! <= hasta);
    const normalized = await Promise.all(selected.map(({ row, source }) => normalizeRow(row, source)));
    normalized.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)) || a.id.localeCompare(b.id));
    const counts = {
      total: normalized.length,
      conPin: normalized.filter(o => o.coordinateSource === 'pin').length,
      geocodificados: normalized.filter(o => o.coordinateSource === 'geocodificado').length,
      porVerificar: normalized.filter(o => o.coordinateSource === 'verificar_barrio' || o.coordinateSource === 'sin_coordenadas').length,
      fueraCobertura: normalized.filter(o => o.coverage === 'fuera').length,
      chia: normalized.filter(o => o.coverage === 'chia').length,
      dentro: normalized.filter(o => o.coverage === 'dentro').length,
      porConfirmar: normalized.filter(o => o.coverage === 'por_confirmar').length,
    };
    const zones = normalized.length ? { todos: { name: 'Pedidos del rango', orders: normalized, count: normalized.length } } : {};
    return NextResponse.json({ orders: normalized, zones, total: normalized.length, totalAmount: normalized.reduce((sum, o) => sum + o.totalAmount, 0), counts, dateFrom: desde, dateTo: hasta, canonicalDateSource: 'orders/guest_orders: delivery_date|deliveryDate|scheduled_delivery_date|fecha_entrega; si faltan, derivada desde created_at en America/Bogota con corte de ciclo martes/viernes a las 6:00 a. m.; no es filtro created_at', origin: CORABASTOS });
  } catch (error) {
    console.error('Error in GET /api/admin/ruta', error);
    return NextResponse.json({ error: 'Error al obtener pedidos de ruta' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
    const supabase = createSupabaseClient();
    const { orderIds } = await request.json();
    if (!Array.isArray(orderIds) || orderIds.length === 0) return NextResponse.json({ error: 'Se requieren orderIds' }, { status: 400 });
    const now = new Date().toISOString();
    const { data, error } = await supabase.from('orders').update({ delivered_at: now, updated_at: now, order_status: 'entregado', status: 'delivered' }).in('id', orderIds).select('id, order_number, customer_name');
    if (error) return NextResponse.json({ error: 'Error al marcar pedidos' }, { status: 500 });
    return NextResponse.json({ success: true, marked: data?.length || 0, orders: data || [] });
  } catch { return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 }); }
}
