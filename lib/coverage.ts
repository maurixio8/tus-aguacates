import config from '@/config/coverage.json';
import { haversineKm, type StructuredAddress } from '@/lib/address-structured';

export interface CoverageShadowResult { decision: 'dentro' | 'fuera'; reasons: string[]; distanceKm: number | null; travelMinutes: number | null; mode: 'shadow'; }

export function evaluateCoverage(address: StructuredAddress): CoverageShadowResult {
  const reasons: string[] = [];
  const distanceKm = address.latitude != null && address.longitude != null ? haversineKm(config.warehouse.latitude, config.warehouse.longitude, address.latitude, address.longitude) : null;
  const travelMinutes = distanceKm == null ? null : Math.round(distanceKm * 3.5 + 15);
  if (config.excludedCities.map((x) => x.toLowerCase()).includes(address.city.toLowerCase())) reasons.push('ciudad_excluida');
  if (address.city === 'Bogotá' && !config.allowedLocalities.includes(address.neighborhood)) reasons.push('localidad_barrio_pendiente');
  if (distanceKm != null && distanceKm > config.maxDistanceKm) reasons.push('distancia_superada');
  if (travelMinutes != null && travelMinutes > config.maxTravelMinutes) reasons.push('tiempo_estimado_superado');
  return { decision: reasons.length ? 'fuera' : 'dentro', reasons, distanceKm, travelMinutes, mode: 'shadow' };
}
