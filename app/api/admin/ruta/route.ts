/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient, verifyAdminAuth } from '@/lib/auth-admin';
import { evaluateCoverage } from '@/lib/coverage';
import { classifyLocationCandidates } from '@/lib/location-candidates';
import { geocodeDeliveryAddress } from '@/lib/location-geocoding';
import { addressParts, AdminRouteOrder, cancellationReasonOf, CONFIRMED_ROUTE_STATUSES, deliveryDateOf, isCancelledStatus, isChia, nextDeliveryDate, normalizeStatus, orderItems, parseOrderData } from '@/lib/admin-route';
import { normalizeDeliveryAddress } from '@/lib/location-resolution';

export const dynamic = 'force-dynamic';
const CORABASTOS = { lat: 4.63205, lng: -74.15534, address: 'Corabastos, Bogotá' };

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

async function fetchResolutions() {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from('delivery_location_resolutions').select('*').order('updated_at', { ascending: true }).limit(2000);
  if (error) throw error;
  const resolutions = new Map<string, any>();
  for (const row of data || []) {
    if (row.normalized_address) resolutions.set(row.normalized_address, row);
    if (row.original_address) resolutions.set(normalizeDeliveryAddress(row.original_address, 'Bogotá'), row);
    if (row.corrected_address) resolutions.set(normalizeDeliveryAddress(row.corrected_address, 'Bogotá'), row);
  }
  const { data: history, error: historyError } = await supabase.from('delivery_location_resolution_history').select('*').order('captured_at', { ascending: true }).limit(5000);
  if (historyError) throw historyError;
  const historyByOriginal = new Map<string, any[]>();
  for (const row of history || []) {
    const key = normalizeDeliveryAddress(row.original_address || '', 'Bogotá');
    if (!key) continue;
    const previous = historyByOriginal.get(key) || [];
    previous.push(row);
    historyByOriginal.set(key, previous);
  }
  return { resolutions, historyByOriginal };
}

async function normalizeRow(row: any, source: 'orders' | 'guest_orders', resolutions: Map<string, any>, historyByOriginal: Map<string, any[]>): Promise<AdminRouteOrder> {
  const data = parseOrderData(row);
  const parts = addressParts(row);
  const normalizedAddress = normalizeDeliveryAddress(parts.address, parts.city || 'Bogotá');
  const saved = resolutions.get(normalizedAddress);
  let latitude = parts.latitude;
  let longitude = parts.longitude;
  let resolutionStatus: AdminRouteOrder['resolutionStatus'] = saved?.status || 'sin_coordenadas';
  let resolutionCandidates = Array.isArray(saved?.candidates) ? saved.candidates : [];
  let coordinateSource: AdminRouteOrder['coordinateSource'] = latitude != null && longitude != null ? 'pin' : 'sin_coordenadas';
  let confidence: AdminRouteOrder['confidence'] = coordinateSource === 'pin' ? 'alta' : 'sin_coordenadas';

  if (latitude == null || longitude == null) {
    if (saved?.status === 'confirmada' && saved.latitude != null && saved.longitude != null) {
      latitude = Number(saved.latitude); longitude = Number(saved.longitude); coordinateSource = 'pin'; confidence = 'alta'; resolutionStatus = 'confirmada';
    } else if (saved?.status === 'rechazada') {
      resolutionStatus = 'sin_coordenadas';
      resolutionCandidates = [];
    } else if (parts.address) {
      resolutionCandidates = resolutionCandidates.length ? resolutionCandidates : classifyLocationCandidates(await geocodeDeliveryAddress(parts.address, parts.city || 'Bogotá'), parts.address, parts.city || 'Bogotá');
      if (resolutionCandidates.length) {
        resolutionStatus = 'candidata';
        confidence = resolutionCandidates[0].confidence === 'alta' ? 'alta' : 'media';
      }
    }
  }

  let coverage: AdminRouteOrder['coverage'] = 'por_confirmar';
  let coverageReason: string | null = 'sin_coordenadas';
  let coverageZone: string | null = null;
  if (isChia(parts.city, parts.address)) {
    coverage = 'chia'; coverageReason = 'chia_no_entregar_por_ahora';
  } else if (latitude != null && longitude != null && coordinateSource !== 'sin_coordenadas') {
    const result = evaluateCoverage({ rawAddress: parts.address, viaType: '', viaNumber: '', complement: '', neighborhood: '', city: parts.city || 'Bogotá', deliveryNotes: '', latitude, longitude, pinConfidence: 'pin' });
    coverage = result.decision === 'dentro' ? 'dentro' : result.decision === 'fuera' ? 'fuera' : 'por_confirmar';
    coverageReason = result.reasons[0] || null; coverageZone = result.zone;
  } else if (resolutionStatus === 'candidata') {
    coverageReason = 'candidata_sin_confirmar';
  } else if (coordinateSource === 'sin_coordenadas') {
    coverageReason = parts.address ? 'verificar_barrio' : 'sin_coordenadas';
  }

  const items = orderItems(row, data);
  return {
    id: String(row.id), source, orderNumber: String(row.order_number || row.orderNumber || row.id || ''),
    customerName: String(row.customer_name || row.guest_name || row.name || 'Cliente'), customerPhone: String(row.customer_phone || row.guest_phone || row.phone || ''),
    deliveryAddress: parts.address, deliveryDate: deliveryDateOf(row), createdAt: row.created_at || null, totalAmount: Number(row.total_amount || row.total || data.total || 0), items, itemCount: items.length,
    isDelivered: Boolean(row.delivered_at) || ['delivered', 'entregado'].includes(normalizeStatus(row)), paymentStatus: String(row.payment_status || data.payment_status || 'pending'), paymentMethod: row.payment_method || data.payment_method || null, subtotal: Number(row.subtotal || data.subtotal || 0), shippingFee: Number(row.shipping_fee || row.shipping_cost || data.shipping_fee || data.shipping_cost || data.shippingFee || 0), discount: Number(row.discount || row.discount_amount || data.discount || data.discount_amount || 0), couponCode: row.coupon_code || data.coupon_code || null, notes: String(row.notes || row.delivery_notes || data.delivery_notes || ''),
    latitude, longitude, coordinateSource, confidence, coverage, coverageReason, coverageZone, city: parts.city || 'Bogotá', resolutionStatus, resolutionCandidates,
    correctedAddress: saved?.corrected_address || null,
    normalizedAddress: saved?.normalized_address || normalizedAddress,
    resolutionId: saved?.id || null,
    resolutionConfirmedBy: saved?.confirmed_by || null,
    resolutionResolvedAt: saved?.resolved_at || null,
    resolutionHistory: historyByOriginal.get(normalizeDeliveryAddress(parts.address, 'Bogotá')) || [],
    isCancelled: isCancelledStatus(row),
    cancellationReason: cancellationReasonOf(row, data),
    cancelledAt: row.cancelled_at || data?.cancelled_at || null,
  };
}

function isEligible(row: any) {
  return CONFIRMED_ROUTE_STATUSES.has(normalizeStatus(row)) && !row.delivered_at;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const desde = searchParams.get('desde') || searchParams.get('dateFrom') || nextDeliveryDate();
    const hasta = searchParams.get('hasta') || searchParams.get('dateTo') || desde;
    const [orders, guests, resolutionBundle] = await Promise.all([fetchAll('orders'), fetchAll('guest_orders'), fetchResolutions()]);
    const all = [...orders.map(row => ({ row, source: 'orders' as const })), ...guests.map(row => ({ row, source: 'guest_orders' as const }))];
    const selected = all.filter(({ row }) => (isEligible(row) || isCancelledStatus(row)) && deliveryDateOf(row) != null && deliveryDateOf(row)! >= desde && deliveryDateOf(row)! <= hasta);
    const normalized = await Promise.all(selected.map(({ row, source }) => normalizeRow(row, source, resolutionBundle.resolutions, resolutionBundle.historyByOriginal)));
    normalized.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)) || a.id.localeCompare(b.id));
    const routeOrders = normalized.filter(order => !order.isCancelled && order.coverage === 'dentro' && order.latitude != null && order.longitude != null);
    const excluded = normalized.filter(order => order.isCancelled || order.coverage !== 'dentro' || order.latitude == null || order.longitude == null);
    const counts = {
      total: normalized.length, conPin: normalized.filter(o => o.coordinateSource === 'pin').length,
      geocodificados: normalized.filter(o => o.resolutionStatus === 'candidata').length,
      porVerificar: normalized.filter(o => o.coordinateSource === 'sin_coordenadas').length,
      candidatas: normalized.filter(o => o.resolutionStatus === 'candidata').length,
      confirmadas: normalized.filter(o => o.resolutionStatus === 'confirmada').length,
      fueraCobertura: normalized.filter(o => o.coverage === 'fuera').length, chia: normalized.filter(o => o.coverage === 'chia').length,
      dentro: normalized.filter(o => o.coverage === 'dentro').length, porConfirmar: normalized.filter(o => o.coverage === 'por_confirmar').length,
      ruta: routeOrders.length, excluidas: excluded.length, cancelados: normalized.filter(o => o.isCancelled).length,
    };
    const zones: Record<string, any> = {};
    if (routeOrders.length) zones.ruta = { name: 'Paradas de ruta', orders: routeOrders, count: routeOrders.length };
    const excludedOutside = excluded.filter(o => !o.isCancelled && o.coverage === 'fuera');
    const excludedChia = excluded.filter(o => !o.isCancelled && o.coverage === 'chia');
    const excludedConfirm = excluded.filter(o => !o.isCancelled && (o.coverage === 'por_confirmar' || o.latitude == null || o.longitude == null));
    const cancelled = excluded.filter(o => o.isCancelled);
    if (excludedOutside.length) zones.fuera = { name: 'Excluidas — fuera de cobertura', orders: excludedOutside, count: excludedOutside.length };
    if (excludedChia.length) zones.chia = { name: 'Por confirmar — Chía, sin entrega por ahora', orders: excludedChia, count: excludedChia.length };
    if (excludedConfirm.length) zones.por_confirmar = { name: 'Por confirmar — ubicación pendiente', orders: excludedConfirm, count: excludedConfirm.length };
    if (cancelled.length) zones.cancelados = { name: 'Cancelados', orders: cancelled, count: cancelled.length };
    return NextResponse.json({ orders: normalized, zones, routeOrders, total: normalized.length, totalAmount: normalized.reduce((sum, o) => sum + o.totalAmount, 0), counts, dateFrom: desde, dateTo: hasta, canonicalDateSource: 'orders/guest_orders: delivery_date|deliveryDate|scheduled_delivery_date|fecha_entrega; si faltan, derivada desde created_at en America/Bogota con corte de ciclo martes/viernes a las 6:00 a. m.; no es filtro created_at', origin: CORABASTOS });
  } catch (error) { console.error('Error in GET /api/admin/ruta', error); return NextResponse.json({ error: 'Error al obtener pedidos de ruta' }, { status: 500 }); }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request); if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    if (body.action === 'deliver') {
      const orderId = String(body.orderId || '').trim();
      const source = body.source === 'guest_orders' ? 'guest_orders' : body.source === 'orders' ? 'orders' : null;
      if (!orderId || !source || body.confirmDelivery !== true) return NextResponse.json({ error: 'La entrega requiere pedido, origen y confirmación explícita' }, { status: 400 });
      const supabase = createSupabaseClient();
      const now = new Date().toISOString();
      const table = source === 'guest_orders' ? 'guest_orders' : 'orders';
      const payload = source === 'guest_orders' ? { status: 'delivered', order_status: 'entregado', updated_at: now } : { delivered_at: now, updated_at: now, order_status: 'entregado', status: 'delivered' };
      const { data, error } = await supabase.from(table).update(payload).eq('id', orderId).select('id,status,order_status,updated_at').single();
      if (error) throw error;
      return NextResponse.json({ success: true, action: 'deliver', source, fields: Object.keys(payload), order: data });
    }
    if (body.action === 'cancel') {
      if (body.confirmCancellation !== true) return NextResponse.json({ error: 'La cancelación requiere confirmación explícita' }, { status: 400 });
      const orderId = String(body.orderId || '').trim();
      const source = body.source === 'guest_orders' ? 'guest_orders' : body.source === 'orders' ? 'orders' : null;
      const reason = String(body.reason || '').trim();
      if (!orderId || !source || !reason) return NextResponse.json({ error: 'Faltan pedido, origen o motivo de cancelación' }, { status: 400 });
      const supabase = createSupabaseClient();
      const now = new Date().toISOString();
      if (source === 'orders') {
        const { data: current, error: readError } = await supabase.from('orders').select('id,status,order_status,notes').eq('id', orderId).maybeSingle();
        if (readError) throw readError;
        if (!current) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
        const notes = [current.notes, `Cancelado por fuera de cobertura — ${reason} (${now})`].filter(Boolean).join('\n');
        const { data, error } = await supabase.from('orders').update({ status: 'cancelado', order_status: 'cancelado', cancelled_at: now, updated_at: now, notes }).eq('id', orderId).select('id,status,order_status,cancelled_at,notes').single();
        if (error) throw error;
        return NextResponse.json({ success: true, source, field: 'status', value: 'cancelado', order: data });
      }
      const { data: current, error: readError } = await supabase.from('guest_orders').select('id,status,order_status,order_data').eq('id', orderId).maybeSingle();
      if (readError) throw readError;
      if (!current) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
      const orderData = current.order_data && typeof current.order_data === 'object' ? current.order_data : {};
      const nextOrderData = { ...orderData, cancellation_reason: reason, cancelled_at: now };
      const { data, error } = await supabase.from('guest_orders').update({ status: 'cancelado', updated_at: now, order_data: nextOrderData }).eq('id', orderId).select('id,status,order_status,order_data,updated_at').single();
      if (error) throw error;
      return NextResponse.json({ success: true, source, field: 'status', value: 'cancelado', order: data });
    }
    const { orderIds } = body;
    const supabase = createSupabaseClient();
    if (!Array.isArray(orderIds) || orderIds.length === 0) return NextResponse.json({ error: 'Se requieren orderIds' }, { status: 400 });
    const now = new Date().toISOString();
    const { data, error } = await supabase.from('orders').update({ delivered_at: now, updated_at: now, order_status: 'entregado', status: 'delivered' }).in('id', orderIds).select('id, order_number, customer_name');
    if (error) return NextResponse.json({ error: 'Error al marcar pedidos' }, { status: 500 });
    return NextResponse.json({ success: true, marked: data?.length || 0, orders: data || [] });
  } catch { return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 }); }
}
