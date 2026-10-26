import type { OperationalSummaryItem } from '@/utils/orderSummaryGenerator';
import type { ComboComponent } from '@/lib/combo-definitions';

export type OptimizationStop = {
  id: string;
  source?: 'orders' | 'guest_orders';
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  address: string;
  deliveryDate: string;
  items?: (OperationalSummaryItem & { comboComponents?: ComboComponent[] | null })[];
  subtotal?: number;
  totalAmount?: number;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  deliveryNotes?: string;
  notes?: string;
  shippingFee?: number;
  discount?: number;
  couponCode?: string;
  coverage: string;
  latitude: number;
  longitude: number;
};

export type OptimizedLeg = {
  from: string;
  to: string;
  distanceMeters: number;
  durationSeconds: number;
  eta: string;
};

export type OptimizedRoute = {
  date: string;
  group: 'Norte' | 'Sur' | 'Compacta';
  driver: string;
  stops: OptimizationStop[];
  originalStops: OptimizationStop[];
  optimizedWaypointIndices: number[];
  legs: OptimizedLeg[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  estimatedBalanceMinutes: number;
  csv: string;
  currentStops?: OptimizationStop[];
  currentLegs?: OptimizedLeg[];
  currentDistanceMeters?: number;
  currentDurationSeconds?: number;
};

export function parseGoogleDuration(value: unknown): number {
  const match = String(value || '').match(/([0-9]+(?:\.[0-9]+)?)s/);
  return match ? Math.round(Number(match[1])) : 0;
}

export function haversineMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const earth = 6371000;
  const lat1 = a.latitude * Math.PI / 180;
  const lat2 = b.latitude * Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLng = (b.longitude - a.longitude) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.sqrt(h));
}

export function estimateStopsMinutes(stops: OptimizationStop[], origin = { latitude: 4.63205, longitude: -74.15534 }): number {
  if (!stops.length) return 0;
  let distance = 0;
  let previous = origin;
  for (const stop of stops) {
    distance += haversineMeters(previous, stop);
    previous = stop;
  }
  distance += haversineMeters(previous, origin);
  return Math.round(distance / 300 * 60 + stops.length * 4);
}

export function splitNorthSouthBalanced(stops: OptimizationStop[]): { north: OptimizationStop[]; south: OptimizationStop[]; splitIndex: number; score: number } {
  if (stops.length < 2) return { north: stops, south: [], splitIndex: stops.length, score: 0 };
  const sorted = [...stops].sort((a, b) => b.latitude - a.latitude || a.longitude - b.longitude || a.id.localeCompare(b.id));
  let best = { splitIndex: 1, score: Number.POSITIVE_INFINITY };
  for (let index = 1; index < sorted.length; index += 1) {
    const north = sorted.slice(0, index);
    const south = sorted.slice(index);
    const countDelta = Math.abs(north.length - south.length) / sorted.length;
    const timeDelta = Math.abs(estimateStopsMinutes(north) - estimateStopsMinutes(south)) / Math.max(1, estimateStopsMinutes(sorted));
    const score = countDelta + timeDelta;
    if (score < best.score) best = { splitIndex: index, score };
  }
  return { north: sorted.slice(0, best.splitIndex), south: sorted.slice(best.splitIndex), splitIndex: best.splitIndex, score: best.score };
}

export function reorderStopsByWaypointIndex<T>(stops: T[], indices: number[]): T[] {
  const safe = indices.length === stops.length && indices.every(index => index >= 0 && index < stops.length) ? indices : stops.map((_, index) => index);
  return safe.map(index => stops[index]);
}

import { formatOperationalSummary } from '@/utils/orderSummaryGenerator';

export function csvForRoute(route: { stops: OptimizationStop[]; group: string; driver: string; legs?: OptimizedLeg[] }): string {
  const rows = ['lat,lng,address,note'];
  route.stops.forEach((stop, index) => {
    const leg = route.legs?.[index];
    const summary = formatOperationalSummary({
      id: stop.id,
      order_number: stop.orderNumber,
      customer_name: stop.customerName,
      customer_phone: stop.customerPhone,
      delivery_address: stop.address,
      status: stop.status,
      payment_status: stop.paymentStatus,
      payment_method: stop.paymentMethod,
      delivery_date: stop.deliveryDate,
      delivery_notes: stop.deliveryNotes,
      notes: stop.notes,
      subtotal: stop.subtotal,
      total_amount: stop.totalAmount,
      shipping_fee: stop.shippingFee,
      discount: stop.discount,
      coupon_code: stop.couponCode,
      items: stop.items,
    });
    const note = `${route.group} | conductor=${route.driver} | parada=${index + 1}${leg ? ` | ETA=${leg.eta}` : ''}\n${summary}`;
    rows.push([stop.latitude, stop.longitude, `"${stop.address.replace(/"/g, '""')}"`, `"${note.replace(/"/g, '""')}"`].join(','));
  });
  return rows.join('\n');
}

export function formatMinutes(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}
