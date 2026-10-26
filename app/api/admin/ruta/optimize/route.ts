/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-admin';
import { CORABASTOS } from '@/lib/admin-route';
import { csvForRoute, formatMinutes, parseGoogleDuration, splitNorthSouthBalanced, type OptimizationStop, type OptimizedLeg, type OptimizedRoute } from '@/lib/route-optimization';

export const dynamic = 'force-dynamic';
const MAX_STOPS = 10;
const cache = (globalThis as typeof globalThis & { __routeOptimizationCache?: Map<string, any> }).__routeOptimizationCache ||= new Map();

function departureIso(date: string, time: string) {
  const safe = /^\d{2}:\d{2}$/.test(time) ? time : '14:00';
  return new Date(`${date}T${safe}:00-05:00`).toISOString();
}

function localEta(value: Date) {
  return new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(value);
}

function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

async function computeRoute(date: string, group: 'Norte' | 'Sur', stops: OptimizationStop[], driver: string, departureTime: string, apiKey: string, callCounter: { value: number }): Promise<OptimizedRoute> {
  const originalStops = [...stops];
  const departureIsoValue = departureIso(date, departureTime);
  const payload: any = {
    origin: { location: { latLng: { latitude: CORABASTOS.lat, longitude: CORABASTOS.lng } } },
    destination: { location: { latLng: { latitude: CORABASTOS.lat, longitude: CORABASTOS.lng } } },
    intermediates: stops.map(stop => ({ location: { latLng: { latitude: stop.latitude, longitude: stop.longitude } }, vehicleStopover: true })),
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE',
    optimizeWaypointOrder: stops.length > 1,
    languageCode: 'es',
    units: 'METRIC',
  };
  const hasFutureDeparture = new Date(departureIsoValue).getTime() > Date.now();
  if (hasFutureDeparture) payload.departureTime = departureIsoValue;
  const response = await fetch(`https://routes.googleapis.com/directions/v2:computeRoutes?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.legs.distanceMeters,routes.legs.duration,routes.optimizedIntermediateWaypointIndex' },
    body: JSON.stringify(payload),
  });
  callCounter.value += 1;
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.routes?.[0]) throw new Error(`Routes API HTTP ${response.status}: ${body.error?.message || 'sin ruta'}`);
  const route = body.routes[0];
  const rawIndices: number[] = Array.isArray(route.optimizedIntermediateWaypointIndex) ? route.optimizedIntermediateWaypointIndex : [];
  const indices: number[] = stops.length === 1 ? [0] : rawIndices.length === stops.length && rawIndices.every(index => index >= 0 && index < stops.length) ? rawIndices : stops.map((_, index) => index);
  const orderedStops = indices.map(index => stops[index]).filter(Boolean);
  const legs = Array.isArray(route.legs) ? route.legs : [];
  const departure = new Date(departureIso(date, departureTime));
  let cursor = departure;
  const optimizedLegs: OptimizedLeg[] = legs.map((leg: any, index: number) => {
    const durationSeconds = parseGoogleDuration(leg.duration);
    cursor = new Date(cursor.getTime() + durationSeconds * 1000);
    const from = index === 0 ? CORABASTOS.address : orderedStops[index - 1]?.address || 'Parada anterior';
    const to = index < orderedStops.length ? orderedStops[index].address : CORABASTOS.address;
    return { from, to, distanceMeters: Number(leg.distanceMeters || 0), durationSeconds, eta: localEta(cursor) };
  });
  const totalDurationSeconds = parseGoogleDuration(route.duration) || optimizedLegs.reduce((sum, leg) => sum + leg.durationSeconds, 0);
  const totalDistanceMeters = Number(route.distanceMeters || optimizedLegs.reduce((sum, leg) => sum + leg.distanceMeters, 0));
  const result: OptimizedRoute = { date, group, driver, stops: orderedStops, originalStops, optimizedWaypointIndices: indices, legs: optimizedLegs, totalDistanceMeters, totalDurationSeconds, estimatedBalanceMinutes: Math.round(totalDurationSeconds / 60), csv: '' };
  result.csv = csvForRoute(result);
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const dates = Array.isArray(body.dates) ? body.dates.map(String) : [];
    const departureTime = String(body.departureTime || '14:00');
    const drivers = { norte: String(body.drivers?.norte || 'Mauricio'), sur: String(body.drivers?.sur || 'Mauricio') };
    const stops = Array.isArray(body.stops) ? body.stops : [];
    if (!dates.length || !stops.length) return NextResponse.json({ error: 'Faltan fechas o paradas confirmadas' }, { status: 400 });
    const safeStops: OptimizationStop[] = stops.filter((stop: any) => stop && stop.coverage === 'dentro' && !stop.isCancelled && Number.isFinite(Number(stop.latitude)) && Number.isFinite(Number(stop.longitude))).map((stop: any) => ({ id: String(stop.id), orderNumber: stop.orderNumber, customerName: stop.customerName, address: String(stop.deliveryAddress || ''), deliveryDate: String(stop.deliveryDate || ''), latitude: Number(stop.latitude), longitude: Number(stop.longitude), coverage: 'dentro' }));
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'GOOGLE_MAPS_API_KEY no está configurada en el runtime' }, { status: 503 });
    const cacheKey = JSON.stringify({ dates, departureTime, drivers, stops: safeStops.map(stop => [stop.id, stop.latitude, stop.longitude, stop.deliveryDate]) });
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json({ ...cached, cacheHit: true, routesApiCalls: 0 });
    const callCounter = { value: 0 };
    const routes: OptimizedRoute[] = [];
    for (const date of dates) {
      const dayStops = safeStops.filter(stop => stop.deliveryDate === date);
      const split = splitNorthSouthBalanced(dayStops);
      const groups: Array<{ name: 'Norte' | 'Sur'; stops: OptimizationStop[]; driver: string }> = [
        { name: 'Norte', stops: split.north, driver: drivers.norte },
        { name: 'Sur', stops: split.south, driver: drivers.sur },
      ];
      for (const group of groups) {
        for (const part of chunk(group.stops, MAX_STOPS)) {
          if (part.length) routes.push(await computeRoute(date, group.name, part, group.driver, departureTime, apiKey, callCounter));
        }
      }
    }
    const totalStops = routes.reduce((sum, route) => sum + route.stops.length, 0);
    const result = { dateFrom: dates[0], dateTo: dates[dates.length - 1], dates, departureTime, drivers, routeCount: routes.length, totalStops, suggestedHelper: totalStops > 25, balanceCriterion: 'Minimiza conjuntamente la diferencia relativa de cantidad de paradas y de minutos estimados por distancia geográfica antes de llamar Routes API.', routes, cacheHit: false, routesApiCalls: callCounter.value, durationLabel: formatMinutes(routes.reduce((sum, route) => sum + route.totalDurationSeconds, 0)) };
    cache.set(cacheKey, result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error calculating optimized route', error?.message || error);
    return NextResponse.json({ error: error?.message || 'No se pudo calcular la ruta optimizada' }, { status: 500 });
  }
}
