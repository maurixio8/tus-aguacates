/* eslint-disable @typescript-eslint/no-explicit-any */

export const CONFIRMED_ROUTE_STATUSES = new Set([
  'confirmado', 'confirmed', 'pendiente_entrega', 'pending_delivery',
  'pagado', 'paid', 'processing', 'en_ruta', 'pendiente', 'pending',
]);

export const CORABASTOS = { lat: 4.63205, lng: -74.15534, address: 'Corabastos, Bogotá' };
export const DELIVERY_CUTOFF_HOUR = 6;

export type RouteResolution = 'pin' | 'geocodificado' | 'verificar_barrio' | 'sin_coordenadas';
export type RouteCoverage = 'dentro' | 'por_confirmar' | 'chia' | 'fuera';

export function normalizeWhatsAppPhone(value: unknown): string | null {
  const digits = String(value ?? '').replace(/\D/g, '');
  const local = digits.startsWith('57') && digits.length === 12 ? digits.slice(2) : digits;
  return /^3\d{9}$/.test(local) ? `57${local}` : null;
}

export function clientAddressMessage(address: string | null | undefined): string {
  const clean = String(address || '').replace(/\?/g, '').trim();
  return clean
    ? `Hola, soy Mauricio de Tus Aguacates. Para dejarte el pedido sin enredos, ¿me confirmas tu dirección? Tenemos registrada: ${clean}. ¿Es correcta? Si no, pásame la correcta con el nombre del conjunto o edificio, el apartamento y el barrio. ¡Gracias!`
    : 'Hola, soy Mauricio de Tus Aguacates. Para dejarte el pedido sin enredos, ¿me confirmas tu dirección completa con el nombre del conjunto o edificio, el apartamento y el barrio? ¡Gracias!';
}

export function buildWhatsAppUrl(phone: unknown, address: string | null | undefined): string | null {
  const normalized = normalizeWhatsAppPhone(phone);
  return normalized ? `https://wa.me/${normalized}?text=${encodeURIComponent(clientAddressMessage(address))}` : null;
}

export function buildGoogleMapsDirectionsUrl(origin: string, stops: string[], destination = origin): string {
  const params = new URLSearchParams({ api: '1', origin, destination, travelmode: 'driving' });
  if (stops.length) params.set('waypoints', stops.join('|'));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function deliveryDatesInRange(dateFrom: string, dateTo: string): string[] {
  const start = new Date(`${dateFrom}T00:00:00Z`);
  const end = new Date(`${dateTo}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];
  const dates: string[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const weekday = cursor.getUTCDay();
    if (weekday === 2 || weekday === 5) dates.push(cursor.toISOString().slice(0, 10));
  }
  return dates;
}

export function isCancelledStatus(row: any): boolean {
  return ['cancelado', 'cancelled'].includes(String(row?.status ?? '').trim().toLowerCase())
    || ['cancelado', 'cancelled'].includes(String(row?.order_status ?? '').trim().toLowerCase());
}

export interface AdminRouteOrder {
  id: string;
  source: 'orders' | 'guest_orders';
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryDate: string | null;
  createdAt: string | null;
  totalAmount: number;
  items: { name: string; quantity: number; price: number }[];
  itemCount: number;
  isDelivered: boolean;
  paymentStatus: string;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  coordinateSource: RouteResolution;
  confidence: 'alta' | 'media' | 'baja' | 'sin_coordenadas';
  coverage: RouteCoverage;
  coverageReason: string | null;
  coverageZone: string | null;
  city: string;
  resolutionStatus: 'sin_coordenadas' | 'candidata' | 'confirmada' | 'rechazada';
  resolutionCandidates: { latitude: number; longitude: number; label: string; confidence: string; provider: string }[];
  correctedAddress?: string | null;
  normalizedAddress?: string | null;
  resolutionId?: string | null;
  resolutionConfirmedBy?: string | null;
  resolutionResolvedAt?: string | null;
  resolutionHistory?: Array<Record<string, any>>;
  isCancelled?: boolean;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
}

export function parseOrderData(row: any): any {
  if (!row?.order_data) return {};
  if (typeof row.order_data === 'string') {
    try { return JSON.parse(row.order_data) || {}; } catch { return {}; }
  }
  return row.order_data;
}

export function cancellationReasonOf(row: any, data = parseOrderData(row)): string | null {
  return row?.cancellation_reason || row?.notes || data?.cancellation_reason || data?.cancellationReason || null;
}

export function derivedDeliveryDate(createdAt: string | null | undefined): string | null {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(date);
  const y = Number(parts.find(p => p.type === 'year')?.value);
  const m = Number(parts.find(p => p.type === 'month')?.value);
  const d = Number(parts.find(p => p.type === 'day')?.value);
  const hour = Number(parts.find(p => p.type === 'hour')?.value);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const next = deliveryDayDelta(weekday, hour);
  const result = new Date(Date.UTC(y, m - 1, d + next));
  return result.toISOString().slice(0, 10);
}

export function deliveryDateOf(row: any): string | null {
  const data = parseOrderData(row);
  for (const key of ['delivery_date', 'deliveryDate', 'scheduled_delivery_date', 'fecha_entrega']) {
    const value = row?.[key] ?? data?.[key];
    if (value) return String(value).slice(0, 10);
  }
  return derivedDeliveryDate(row?.created_at || null);
}

export function normalizeStatus(row: any): string {
  return String(row?.status ?? row?.order_status ?? '').trim().toLowerCase();
}

export function hasUsableSavedResolution(saved: { status?: unknown } | null | undefined): boolean {
  const status = typeof saved?.status === 'string' ? saved.status : null;
  return Boolean(status && status !== 'rechazada' && status !== 'sin_coordenadas');
}

export function nextDeliveryDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(now);
  const y = Number(parts.find(p => p.type === 'year')?.value);
  const m = Number(parts.find(p => p.type === 'month')?.value);
  const d = Number(parts.find(p => p.type === 'day')?.value);
  const hour = Number(parts.find(p => p.type === 'hour')?.value);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const delta = deliveryDayDelta(weekday, hour);
  const result = new Date(Date.UTC(y, m - 1, d + delta));
  return result.toISOString().slice(0, 10);
}

function deliveryDayDelta(weekday: number, hour: number): number {
  if (weekday < 2) return 2 - weekday;
  if (weekday === 2) return hour < DELIVERY_CUTOFF_HOUR ? 0 : 3;
  if (weekday < 5) return 5 - weekday;
  if (weekday === 5) return hour < DELIVERY_CUTOFF_HOUR ? 0 : 4;
  return weekday === 6 ? 3 : 2;
}

function finiteCoordinate(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function addressParts(row: any) {
  const data = parseOrderData(row);
  const structured = data?.address_structured || {};
  const shipping = row?.shipping_address || row?.shipping_address_snapshot || {};
  const safeShipping = shipping && typeof shipping === 'object' ? shipping : {};
  const address = String(row?.guest_address || row?.delivery_address || structured.rawAddress || safeShipping.street_address || safeShipping.address || '').replace(/\?/g, '').trim();
  const latitude = structured.latitude ?? safeShipping.latitude ?? row?.latitude ?? row?.lat ?? null;
  const longitude = structured.longitude ?? safeShipping.longitude ?? row?.longitude ?? row?.lng ?? null;
  const city = String(structured.city || safeShipping.city || row?.city || '').trim();
  return { data, structured, address, latitude: finiteCoordinate(latitude), longitude: finiteCoordinate(longitude), city };
}

export function orderItems(row: any, data: any) {
  const values = Array.isArray(data?.items) ? data.items : Array.isArray(data?.products) ? data.products : [];
  return values.map((item: any) => ({ name: item.product_name || item.name || 'Producto', quantity: Number(item.quantity || 1), price: Number(item.price || item.unit_price || 0) }));
}

export function isChia(city: string, address: string): boolean {
  const value = `${city} ${address}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return value.includes('chia');
}
