/* eslint-disable @typescript-eslint/no-explicit-any */

export type LocationResolutionStatus = 'sin_coordenadas' | 'candidata' | 'confirmada' | 'rechazada';

export interface LocationCandidate {
  latitude: number;
  longitude: number;
  label: string;
  confidence: 'alta' | 'media' | 'baja';
  provider: string;
}

// Normalization is intentionally conservative: it removes presentation noise,
// expands common Colombian street abbreviations, preserves numbers, and appends
// the known city only when the caller supplies it. It never invents a barrio.
export function normalizeDeliveryAddress(address: string, city = ''): string {
  let value = `${address || ''} ${city || ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  value = value.replace(/[.,;:()[\]{}]/g, ' ');
  value = value.replace(/\b(cra|cr|kr)\b/g, ' carrera ');
  value = value.replace(/\b(cl|cll)\b/g, ' calle ');
  value = value.replace(/\b(av|avda|ak)\b/g, ' avenida ');
  value = value.replace(/\b(diag|dgn)\b/g, ' diagonal ');
  value = value.replace(/\b(tv|transv)\b/g, ' transversal ');
  value = value.replace(/\s*#\s*/g, ' numero ');
  value = value.replace(/\s*-\s*/g, '-');
  value = value.replace(/[^a-z0-9#\-\s]/g, ' ');
  return value.replace(/\s+/g, ' ').trim();
}

export function formatNormalizedDeliveryAddress(address: string, city = ''): string {
  let value = String(address || '').replace(/\s+/g, ' ').trim();
  value = value
    .replace(/\b(carrera|cra\.?|cr\.?|kr\.?)\s*/gi, 'Cra ')
    .replace(/\b(calle|cll?\.?|cl\.?)\s*/gi, 'Cll ')
    .replace(/\b(avenida|avda?\.?|ak\.?)\s*/gi, 'Av ')
    .replace(/\b(transversal|transv?\.?|tv\.?)\s*/gi, 'Tv ')
    .replace(/\b(diagonal|diag\.?|dgn\.?)\s*/gi, 'Dg ')
    .replace(/\b(numero|número|no\.?|n\.?)\s*/gi, '# ')
    .replace(/\s*#\s*/g, ' # ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  const cleanCity = String(city || '').replace(/\s+/g, ' ').trim();
  if (cleanCity && !value.toLowerCase().includes(cleanCity.toLowerCase())) {
    value = value ? `${value}, ${cleanCity}` : cleanCity;
  }
  return value;
}

export function resolutionFromRow(row: any): {
  originalAddress: string;
  normalizedAddress: string;
  latitude: number | null;
  longitude: number | null;
} {
  const originalAddress = String(row.deliveryAddress || '').trim();
  return {
    originalAddress,
    normalizedAddress: normalizeDeliveryAddress(originalAddress, row.city || 'Bogota'),
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
  };
}
