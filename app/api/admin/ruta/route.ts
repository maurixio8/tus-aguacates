/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient, verifyAdminAuth } from '@/lib/auth-admin';
import { evaluateCoverage } from '@/lib/coverage';
import { classifyLocationCandidates } from '@/lib/location-candidates';
import { addressParts, AdminRouteOrder, CONFIRMED_ROUTE_STATUSES, deliveryDateOf, isChia, nextDeliveryDate, normalizeStatus, orderItems, parseOrderData } from '@/lib/admin-route';
import { normalizeDeliveryAddress } from '@/lib/location-resolution';

export const dynamic = 'force-dynamic';
const CORABASTOS = { lat: 4.63205, lng: -74.15534, address: 'Corabastos, Bogotá' };
const geocodeCache = new Map<string, any>();
let nominatimQueue = Promise.resolve();
let lastNominatimAt = 0;

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

function queryVariants(address: string, city: string) {
  const base = address.trim();
  if (!base) return [];
  const expanded = base.replace(/\b(cra|cr|kr)\.?\b/gi, 'Carrera').replace(/\b(cl|cll)\.?\b/gi, 'Calle').replace(/\b(av|avda|ak)\.?\b/gi, 'Avenida').replace(/\s*#\s*/g, ' ');
  const suffix = city || 'Bogotá';
  return Array.from(new Set([`${base}, ${suffix}, Colombia`, `${expanded}, ${suffix}, Colombia`, `${base}, Bogotá, Colombia`].map(x => x.replace(/\s+/g, ' ').trim())));
}

async function nominatim(query: string) {
  const run = async () => {
    const wait = Math.max(0, 1000 - (Date.now() - lastNominatimAt));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    lastNominatimAt = Date.now();
    const params = new URLSearchParams({ format: 'jsonv2', addressdetails: '1', limit: '5', countrycodes: 'co', bounded: '1', viewbox: '-74.25,4.85,-73.95,4.45', q: query });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { 'User-Agent': 'TusAguacates/admin-location-resolution/1.0' }, next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const rows = await res.json();
    return Array.isArray(rows) ? rows : [];
  };
  const result = nominatimQueue.then(run, run);
  nominatimQueue = result.then(() => undefined, () => undefined);
  return result;
}

async function geoapify(query: string) {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) return [];
  try {
    const params = new URLSearchParams({ text: query, filter: 'countrycode:co', bias: 'proximity:-74.1,4.65', limit: '5', apiKey });
    const res = await fetch(`https://api.geoapify.com/v1/geocode/search?${params}`, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const body = await res.json();
    return (body.features || []).map((feature: any) => ({ latitude: Number(feature.properties.lat), longitude: Number(feature.properties.lon), label: feature.properties.formatted || query, confidence: Number(feature.properties.rank?.confidence || 0) >= 0.9 ? 'alta' : 'media', provider: 'geoapify' })).filter((candidate: any) => Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude));
  } catch { return []; }
}

async function geocode(address: string, city: string) {
  const key = normalizeDeliveryAddress(address, city);
  if (!key) return [];
  if (geocodeCache.has(key)) return geocodeCache.get(key);
  const candidates: any[] = [];
  for (const query of queryVariants(address, city)) {
    try {
      const rows = await nominatim(query);
      for (const row of rows) {
        const addr = row.address || {};
        const candidate = { latitude: Number(row.lat), longitude: Number(row.lon), label: row.display_name || query, confidence: addr.house_number && (addr.city || addr.town || addr.municipality) ? 'alta' : 'media', provider: 'nominatim' };
        if (Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude) && !candidates.some(x => x.latitude === candidate.latitude && x.longitude === candidate.longitude)) candidates.push(candidate);
      }
      if (candidates.some(x => x.confidence === 'alta')) break;
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch { /* keep the address unresolved */ }
  }
  if (!candidates.length) {
    const fallback = await geoapify(`${address}, ${city || 'Bogotá'}, Colombia`);
    candidates.push(...fallback);
  }
  geocodeCache.set(key, candidates);
  return candidates;
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
      resolutionCandidates = resolutionCandidates.length ? resolutionCandidates : classifyLocationCandidates(await geocode(parts.address, parts.city || 'Bogotá'), parts.address, parts.city || 'Bogotá');
      if (resolutionCandidates.length && resolutionCandidates[0].confidence === 'alta' && resolutionCandidates[0].recommended !== false) {
        latitude = resolutionCandidates[0].latitude; longitude = resolutionCandidates[0].longitude; coordinateSource = 'geocodificado'; confidence = 'alta'; resolutionStatus = 'confirmada';
      } else if (resolutionCandidates.length) {
        resolutionStatus = 'candidata'; confidence = resolutionCandidates[0].confidence === 'alta' ? 'alta' : 'media';
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
    deliveryAddress: parts.address, deliveryDate: deliveryDateOf(row), createdAt: row.created_at || null, totalAmount: Number(row.total_amount || row.total || 0), items, itemCount: items.length,
    isDelivered: Boolean(row.delivered_at) || ['delivered', 'entregado'].includes(normalizeStatus(row)), paymentStatus: String(row.payment_status || 'pending'), notes: String(row.notes || row.delivery_notes || data.delivery_notes || ''),
    latitude, longitude, coordinateSource, confidence, coverage, coverageReason, coverageZone, city: parts.city || 'Bogotá', resolutionStatus, resolutionCandidates,
    correctedAddress: saved?.corrected_address || null,
    normalizedAddress: saved?.normalized_address || normalizedAddress,
    resolutionId: saved?.id || null,
    resolutionConfirmedBy: saved?.confirmed_by || null,
    resolutionResolvedAt: saved?.resolved_at || null,
    resolutionHistory: historyByOriginal.get(normalizeDeliveryAddress(parts.address, 'Bogotá')) || [],
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
    const selected = all.filter(({ row }) => isEligible(row) && deliveryDateOf(row) != null && deliveryDateOf(row)! >= desde && deliveryDateOf(row)! <= hasta);
    const normalized = await Promise.all(selected.map(({ row, source }) => normalizeRow(row, source, resolutionBundle.resolutions, resolutionBundle.historyByOriginal)));
    const autoConfirmed = normalized.filter(order => order.resolutionStatus === 'confirmada' && order.coordinateSource === 'geocodificado' && order.latitude != null && order.longitude != null);
    if (autoConfirmed.length) {
      const supabase = createSupabaseClient();
      await supabase.from('delivery_location_resolutions').upsert(autoConfirmed.map(order => ({ original_address: order.deliveryAddress, normalized_address: normalizeDeliveryAddress(order.deliveryAddress, order.city), latitude: order.latitude, longitude: order.longitude, provider: 'nominatim', confidence: 'alta', status: 'confirmada', candidates: order.resolutionCandidates, resolved_at: new Date().toISOString(), confirmed_by: 'auto_exact_high', rejection_reason: null, updated_at: new Date().toISOString() })), { onConflict: 'normalized_address' });
    }
    normalized.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)) || a.id.localeCompare(b.id));
    const counts = {
      total: normalized.length, conPin: normalized.filter(o => o.coordinateSource === 'pin').length,
      geocodificados: normalized.filter(o => o.resolutionStatus === 'candidata').length,
      porVerificar: normalized.filter(o => o.coordinateSource === 'sin_coordenadas').length,
      candidatas: normalized.filter(o => o.resolutionStatus === 'candidata').length,
      confirmadas: normalized.filter(o => o.resolutionStatus === 'confirmada').length,
      fueraCobertura: normalized.filter(o => o.coverage === 'fuera').length, chia: normalized.filter(o => o.coverage === 'chia').length,
      dentro: normalized.filter(o => o.coverage === 'dentro').length, porConfirmar: normalized.filter(o => o.coverage === 'por_confirmar').length,
    };
    const zones = normalized.length ? { todos: { name: 'Pedidos del rango', orders: normalized, count: normalized.length } } : {};
    return NextResponse.json({ orders: normalized, zones, total: normalized.length, totalAmount: normalized.reduce((sum, o) => sum + o.totalAmount, 0), counts, dateFrom: desde, dateTo: hasta, canonicalDateSource: 'orders/guest_orders: delivery_date|deliveryDate|scheduled_delivery_date|fecha_entrega; si faltan, derivada desde created_at en America/Bogota con corte de ciclo martes/viernes a las 6:00 a. m.; no es filtro created_at', origin: CORABASTOS });
  } catch (error) { console.error('Error in GET /api/admin/ruta', error); return NextResponse.json({ error: 'Error al obtener pedidos de ruta' }, { status: 500 }); }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request); if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
    const supabase = createSupabaseClient(); const { orderIds } = await request.json();
    if (!Array.isArray(orderIds) || orderIds.length === 0) return NextResponse.json({ error: 'Se requieren orderIds' }, { status: 400 });
    const now = new Date().toISOString();
    const { data, error } = await supabase.from('orders').update({ delivered_at: now, updated_at: now, order_status: 'entregado', status: 'delivered' }).in('id', orderIds).select('id, order_number, customer_name');
    if (error) return NextResponse.json({ error: 'Error al marcar pedidos' }, { status: 500 });
    return NextResponse.json({ success: true, marked: data?.length || 0, orders: data || [] });
  } catch { return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 }); }
}
