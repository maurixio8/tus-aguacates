export type OptimizationStop = {
  id: string;
  orderNumber?: string;
  customerName?: string;
  address: string;
  deliveryDate: string;
  latitude: number;
  longitude: number;
  coverage: string;
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
  group: 'Norte' | 'Sur';
  driver: string;
  stops: OptimizationStop[];
  originalStops: OptimizationStop[];
  optimizedWaypointIndices: number[];
  legs: OptimizedLeg[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  estimatedBalanceMinutes: number;
  csv: string;
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

export function csvForRoute(route: { stops: OptimizationStop[]; group: string; driver: string; legs?: OptimizedLeg[] }): string {
  const rows = ['lat,lng,address,note'];
  route.stops.forEach((stop, index) => {
    const leg = route.legs?.[index];
    const note = `${route.group} | conductor=${route.driver} | parada=${index + 1}${leg ? ` | ETA=${leg.eta}` : ''}`;
    rows.push([stop.latitude, stop.longitude, `"${stop.address.replace(/"/g, '""')}"`, `"${note.replace(/"/g, '""')}"`].join(','));
  });
  return rows.join('\n');
}

export function formatMinutes(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}
