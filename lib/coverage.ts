import config from '@/config/coverage.json';
import zones from '@/config/zonas-entrega.json';
import { haversineKm, type StructuredAddress } from '@/lib/address-structured';

export interface CoverageShadowResult {
  decision: 'dentro' | 'fuera' | 'confirmar';
  reasons: string[];
  distanceKm: number | null;
  travelMinutes: number | null;
  zone: string | null;
  mode: 'shadow';
}

type Ring = number[][];
function pointInRing(point: [number, number], ring: Ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    const hit = yi > point[1] !== yj > point[1] && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}
function pointInPolygon(point: [number, number], coordinates: number[][][]) {
  return pointInRing(point, coordinates[0] as Ring) && !coordinates.slice(1).some((hole) => pointInRing(point, hole as Ring));
}
function zoneForPoint(point: [number, number]) {
  const matches = zones.features.filter((feature) => feature.geometry.type === 'Polygon' && pointInPolygon(point, feature.geometry.coordinates as number[][][]));
  return { excluded: matches.find((f) => f.properties?.tipo === 'exclusion'), delivery: matches.find((f) => f.properties?.tipo === 'entrega') };
}

export function evaluateCoverage(address: StructuredAddress): CoverageShadowResult {
  const distanceKm = address.latitude != null && address.longitude != null ? haversineKm(config.warehouse.latitude, config.warehouse.longitude, address.latitude, address.longitude) : null;
  const travelMinutes = distanceKm == null ? null : Math.round(distanceKm * 3.5 + 15);
  if (address.latitude == null || address.longitude == null) return { decision: 'confirmar', reasons: ['sin_pin'], distanceKm, travelMinutes, zone: null, mode: 'shadow' };
  const { excluded, delivery } = zoneForPoint([address.longitude, address.latitude]);
  if (excluded) return { decision: 'fuera', reasons: ['zona_excluida'], distanceKm, travelMinutes, zone: excluded.properties?.nombre || null, mode: 'shadow' };
  if (delivery) return { decision: 'dentro', reasons: [], distanceKm, travelMinutes, zone: delivery.properties?.nombre || null, mode: 'shadow' };
  return { decision: 'confirmar', reasons: ['fuera_de_poligonos_confirmar'], distanceKm, travelMinutes, zone: null, mode: 'shadow' };
}
